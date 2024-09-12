import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery'
import * as consts from '../consts'
import { AlbLogs } from './constructs/alb-logs'

interface EcsStackProps extends cdk.StackProps {
  readonly envName: string
  vpc: ec2.Vpc
}

export class EcsStack extends cdk.Stack {
  private envConfig: EnvConfig

  public readonly ecsCluster: ecs.Cluster
  public readonly privateNamespace: servicediscovery.IPrivateDnsNamespace

  constructor(
    private readonly scope: Construct,
    private readonly id: string,
    private readonly props: EcsStackProps
  ) {
    super(scope, id, props)
    const { envName } = props

    // ecs cluster
    this.ecsCluster = new ecs.Cluster(this, `MainCluster${envName}`, {
      vpc: this.props.vpc,
      clusterName: `${envName}-main`,
    })

    // service discovery
    this.privateNamespace = new servicediscovery.PrivateDnsNamespace(
      this,
      'Namespace',
      {
        name: `${envName}.codescape`,
        vpc: this.props.vpc,
      }
    )
  }
}
