import * as childProcess from 'child_process';
import * as path from 'path';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { AwsCliLayer } from 'aws-cdk-lib/lambda-layer-awscli';
import { SourceConfig } from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export interface StaticSiteProps {
  // The command for building the website.
  buildCommand?: string;
  // The folder with the compiled assets.
  buildOutput: string;
  // The current working directory of the build process.
  buildCwd?: string;

  // The map with the environment variables that are passed to the build command.
  environment: {};

  // The name of the s3 bucket that will be created to store the website assets
  // or a cdk.aws-s3.IBucket object of an existing bucket.
  siteBucket: string | s3.IBucket;

  // The cdk.cloudfront.IDistribution object of the distribution that will serve
  // the website. If it is not provided, a new distribution is created by this construct.
  distribution?: cloudfront.IDistribution;

  // The domain to be assigned to the website URL if a new distribution is created.
  domain?: {
    domainName: string;
    hostedZone?: string;
    certificateArn?: string;
    isExternalDomain?: boolean;
  };
}

/**
 * CDK constructs that provides the resources needed to create, build and deploy a static website.
 */
export class StaticSite extends Construct {
  siteBucket: s3.IBucket;
  distribution: cloudfront.IDistribution;

  constructor(
    scope: Construct,
    id: string,
    private readonly props: StaticSiteProps
  ) {
    super(scope, id);

    if (props.buildCommand && !process.env.SKIP_BUILDS) {
      childProcess.execSync(props.buildCommand, {
        cwd: props.buildCwd || process.cwd(),
        env: {
          ...process.env,
          ...this.getEnvVariablesForBuildCommand(props.environment),
        },
        stdio: 'inherit',
      });
    }

    this.createSiteBucket();

    this.createCloudFrontDistribution();

    this.createS3Deployment();
  }

  createSiteBucket() {
    if (typeof this.props.siteBucket !== 'string') {
      this.siteBucket = this.props.siteBucket;
      return;
    }

    this.siteBucket = new s3.Bucket(this, `SiteBucket`, {
      bucketName: this.props.siteBucket,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }

  createCloudFrontDistribution() {
    if (this.props.distribution) {
      this.distribution = this.props.distribution;
      return;
    }

    if (!this.props.domain || !this.props.domain.certificateArn) {
      throw new Error('Distribution or domain must be provided');
    }

    const { domainName, hostedZone, isExternalDomain, certificateArn } =
      this.props.domain;

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'DomainCertificate',
      certificateArn
    );

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      domainNames: [domainName],
      certificate,

      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2019,
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      defaultBehavior: {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        origin: new origins.S3Origin(this.siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy:
          cloudfront.OriginRequestPolicy.USER_AGENT_REFERER_HEADERS,
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.days(365),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.days(365),
        },
      ],
    });

    // Add a Route 53 record if it is not an external domain.
    if (!isExternalDomain) {
      const zone = route53.HostedZone.fromLookup(this, `Zone`, {
        domainName: hostedZone || domainName,
      });

      new route53.ARecord(this, 'SiteAliasRecord', {
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(this.distribution)
        ),
        zone,
      });
    }
  }

  // Creates a CF custom resource that copies the compiled assets to the
  // s3 bucket and replaces the placeholders of the env variables added
  // at build time with the real values.
  private createS3Deployment() {
    const handler = new lambda.SingletonFunction(
      this,
      'CustomResourceHandler',
      {
        uuid: `static-site-deployment`,
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        layers: [new AwsCliLayer(this, 'AwsCliLayer')],
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.handler',
        lambdaPurpose: 'Custom::CDKBucketDeployment',
        timeout: cdk.Duration.minutes(15),
        memorySize: 512,
      }
    );

    this.siteBucket.grantReadWrite(handler);

    handler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudfront:GetInvalidation',
          'cloudfront:CreateInvalidation',
        ],
        resources: ['*'], // TODO: add distribution arn.
      })
    );

    const handlerRole = handler.role;

    if (!handlerRole) {
      throw new Error('lambda.SingletonFunction should have created a Role');
    }

    const source: SourceConfig = s3deploy.Source.asset(
      this.props.buildOutput
    ).bind(this, { handlerRole });

    return new cdk.CustomResource(this, 'StaticSiteDeployment', {
      serviceToken: handler.functionArn,
      resourceType: 'Custom::StaticSiteDeployment',
      properties: {
        SourceBucketNames: [source.bucket.bucketName],
        SourceObjectKeys: [source.zipObjectKey],
        DestinationBucketName: this.siteBucket.bucketName,
        DistributionId: this.distribution.distributionId,
        DistributionPaths: ['/index.html'],
        ReplaceValues: this.getReplaceValuesOption(),
      },
    });
  }

  private getReplaceValuesOption() {
    const replaceValues: {
      files: string;
      search: string;
      replace: any;
    }[] = [];

    Object.entries(this.props.environment || {}).forEach(([key, value]) => {
      const token = `{{ ${key} }}`;
      replaceValues.push(
        {
          files: 'index.html',
          search: token,
          replace: value,
        },
        {
          files: '**/*.js',
          search: token,
          replace: value,
        }
      );
    });

    return replaceValues;
  }

  // Replaces the token values with placeholders. They will be resolved
  // by a lambda function after the website assets are uploaded to s3.
  private getEnvVariablesForBuildCommand(environment?: {
    [key: string]: string;
  }) {
    const buildCmdEnvironment: { [key: string]: string } = {};

    Object.entries(environment || {}).forEach(([key]) => {
      buildCmdEnvironment[key] = `{{ ${key} }}`;
    });

    return buildCmdEnvironment;
  }
}
