import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import path from "path"
import { StaticSite } from "./constructs/static-site"

interface VueSiteSiteStackProps extends cdk.StackProps {
  readonly envName: string
}

interface EnvConfig {
  apiBaseUrl: string
  domain: {
    domainName: string
    isExternalDomain?: boolean
    hostedZone?: string
    certificateArn?: string
  }
}

export class VueSiteStackProps extends cdk.Stack {
  private envConfig: EnvConfig

  constructor(
    scope: Construct,
    id: string,
    private readonly props: VueSiteSiteStackProps
  ) {
    super(scope, id, props)

    this.setEnvConfig()

    const { envName } = props

    // Content bucket
    const siteBucket = new s3.Bucket(this, `VueSiteBucket`, {
      bucketName: `${envName}-vue-site`,
      removalPolicy:
        envName === "prod"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    const rootPath = path.join(process.cwd(), "..")
    const compiledAssetsPath = path.join(rootPath, "dist/apps/my-app")

    new StaticSite(this, `VueSite`, {
      buildCommand: "npx nx run my-app:build --configuration production",
      buildOutput: compiledAssetsPath,
      buildCwd: rootPath,
      environment: {
        VITE_APP_BASE_URL: this.envConfig.apiBaseUrl,
      },
      siteBucket,
      domain: this.envConfig.domain,
    })
  }

  private setEnvConfig() {
    const defaultEnvConfig: EnvConfig = {
      apiBaseUrl: `${this.props.envName}-domain.com`,
      domain: {
        domainName: `${this.props.envName}-codescape.dev.theroom.engineering`,
        hostedZone: `dev.theroom.engineering`,
        isExternalDomain: false,
        certificateArn:
          "arn:aws:acm:us-east-1:798613990450:certificate/02045171-49c1-4666-9ea5-6b33d69da0cc",
      },
    }

    const envSpecificConfig: { [key: string]: Partial<EnvConfig> } = {
      prod: {
        apiBaseUrl: `${this.props.envName}-prod-domain.com`,
        domain: {
          // domainName: `codescp.theroom.com`,
          isExternalDomain: true,
          domainName: `${this.props.envName}-codescape-prod.dev.theroom.engineering`,
          // certificateArn:
          //   "arn:aws:acm:us-east-1:748321714498:certificate/7b832537-536f-4509-b58a-9c82248c025e",
        },
      },
    }

    this.envConfig = {
      ...defaultEnvConfig,
      ...envSpecificConfig[this.props.envName],
    }

    return this.envConfig
  }
}
