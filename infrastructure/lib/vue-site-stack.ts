import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import path from "path"
import { StaticSite } from "./constructs/static-site"
import { getConfig } from "../config"

const config = getConfig()

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
      apiBaseUrl: `${this.props.envName}-codescape.${config.DOMAIN}`,
      domain: {
        domainName: `${this.props.envName}-codescape.${config.DOMAIN}`,
        hostedZone: `codescape.${config.DOMAIN}`,
        isExternalDomain: false,
        certificateArn: config.CERTIFACE_ARN,
      },
    }

    const envSpecificConfig: { [key: string]: Partial<EnvConfig> } = {
      prod: {
        apiBaseUrl: `${this.props.envName}-codescape-prod.${config.DOMAIN}`,
        domain: {
          // domainName: `codescp.theroom.com`,
          isExternalDomain: true,
          domainName: `${this.props.envName}-codescape-prod.${config.DOMAIN}`,
          // certificateArn:
          //   "",
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
