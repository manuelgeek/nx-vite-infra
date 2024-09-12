import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'

interface NetworkingAndECSStackProps extends cdk.StackProps {
  readonly envName: string
}

const envToCidr: { [i: string]: string } = {
  prod: '10.0.0.0/16',
  staging: '10.20.0.0/16',
}

export class NetworkingStack extends cdk.Stack {
  public readonly mainVpc: ec2.Vpc

  constructor(
    private readonly scope: Construct,
    private readonly id: string,
    private readonly props: NetworkingAndECSStackProps
  ) {
    super(scope, id, props)
    const { envName } = props

    const isProdEnv = envName === 'prod'

    // vpc
    let selectedCidrRange = envToCidr[envName] || envToCidr.dev
    if (!selectedCidrRange) {
      throw new Error(`No CIDR range predefined for '${envName}' env`)
    }

    this.mainVpc = new ec2.Vpc(this, `MainVpc${envName}`, {
      maxAzs: isProdEnv ? 3 : 2, // save on elastic ip's, current limits are quite low
      cidr: selectedCidrRange,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    })
  }
}
