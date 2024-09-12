import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as rds from 'aws-cdk-lib/aws-rds'
import { Construct } from 'constructs'

interface ApiBaseStackProps extends cdk.StackProps {
  readonly envName: string
  readonly ecsVpc: ec2.Vpc
  readonly ecsCluster: ecs.Cluster
}

interface EnvConfig {
  readonly database: {
    instanceType: ec2.InstanceType
    allocatedStorage: number
    maxStorage: number
  }
}

export class ApiBaseStack extends cdk.Stack {
  private envConfig: EnvConfig

  public database: rds.DatabaseInstance
  // public apiJwtSecret: secretsmanager.Secret

  constructor(
    private readonly scope: Construct,
    private readonly id: string,
    private readonly props: ApiBaseStackProps
  ) {
    super(scope, id, props)
    this.setEnvConfig()

    this.createMemberPortalDatabase()

    // this.createCognitoUserPool()

    // this.apiJwtSecret = new secretsmanager.Secret(this, 'ApiJwtSecret', {
    //   description:
    //     'Secret used by the gateway to sign the JWT tokens sent to the internal services',
    //   secretName: `${this.props.envName}/api/jwt`,
    // })

    const { envName } = props
  }

  private createMemberPortalDatabase() {
    const { envConfig } = this

    const dbSG = new ec2.SecurityGroup(this, `${this.props.envName}ApiRdsSG`, {
      allowAllOutbound: true,
      vpc: this.props.ecsVpc,
    })
    dbSG.addIngressRule(
      ec2.Peer.ipv4(this.props.ecsVpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Db Ingress 5342 only from ecs vpc'
    )

    // dbSG.addIngressRule(
    //   ec2.Peer.ipv4(consts.VPC_CIDR_SHARED_SERVICES),
    //   ec2.Port.allTraffic()
    // )

    // dbSG.addIngressRule(ec2.Peer.ipv4(consts.VPN_CIDR), ec2.Port.allTraffic())

    const credentials = rds.Credentials.fromGeneratedSecret('postgres', {
      secretName: `${this.props.envName}/api/dbsecret`,
    })

    const dbEngine = rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.VER_13_14,
    })

    const parameterGroup = new rds.ParameterGroup(this, 'DbParameterGroup', {
      engine: dbEngine,
      parameters: {
        // Enable logical decoding which is required by DMS .
        'rds.logical_replication': '1',
        max_slot_wal_keep_size:
          this.props.envName === 'staging' ? '10000' : '-1',
      },
      description:
        'Parameter group for postgres13 with logical replication enabled',
    })

    this.database = new rds.DatabaseInstance(
      this,
      `${this.props.envName}ApiRDS`,
      {
        engine: dbEngine,
        instanceType: envConfig.database.instanceType,
        vpc: this.props.ecsVpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        credentials,
        allocatedStorage: envConfig.database.allocatedStorage,
        maxAllocatedStorage: envConfig.database.maxStorage,
        multiAz: this.props.envName === 'prod' ? true : false,
        storageEncrypted: false,
        backupRetention:
          this.props.envName === 'dev' ? undefined : cdk.Duration.days(7),
        deleteAutomatedBackups: false,
        autoMinorVersionUpgrade: false,
        removalPolicy:
          this.props.envName === 'prod' || this.props.envName === 'staging'
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY,
        publiclyAccessible: false,
        securityGroups: [dbSG],
        parameterGroup,
      }
    )

    cdk.Tags.of(this.database).add('Name', `${this.props.envName}-api-db`)

    return this.database
  }

  private setEnvConfig() {
    const { envName } = this.props

    const defaultEnvConfig: EnvConfig = {
      database: {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.SMALL
        ),
        allocatedStorage: 100,
        maxStorage: 200,
      },
    }

    const envSpecificConfig: { [key: string]: Partial<EnvConfig> } = {
      prod: {
        database: {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.M5,
            ec2.InstanceSize.XLARGE4
          ),
          allocatedStorage: 1500,
          maxStorage: 5000,
        },
      },
    }

    this.envConfig = {
      ...defaultEnvConfig,
      ...envSpecificConfig[envName],
    }
  }
}
