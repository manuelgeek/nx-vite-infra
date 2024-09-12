import { omitBy, isNullish } from 'remeda'
import * as childProcess from 'child_process'
import { Construct } from 'constructs'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as path from 'path'
import * as cdk from 'aws-cdk-lib'
// import * as s3 from 'aws-cdk-lib/aws-s3'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
// import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as cr from 'aws-cdk-lib/custom-resources'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdanode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as consts from '../consts'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
// import { AlbLogs } from './constructs/alb-logs'
import { getConfig } from '../config'

const config = getConfig()

interface ApiStackProps extends cdk.StackProps {
  readonly envName: string
  readonly ecsVpc: ec2.Vpc
  readonly ecsCluster: ecs.Cluster
  readonly db: rds.DatabaseInstance
  // readonly userPool: cognito.IUserPool
  // readonly uploadsBucket: s3.Bucket
  // readonly apiJwtSecret: secretsmanager.Secret
}

interface EnvConfig {
  readonly apiDomain: string

  readonly apiFargateTask: {
    readonly cpu: number
    readonly memoryLimitMiB: number
    readonly desiredCount: number
    readonly minTaskCount: number
    readonly maxTaskCount: number
    readonly nodeArgEnableSourceMaps?: boolean
  }
}

export class ApiStack extends cdk.Stack {
  private envConfig: EnvConfig

  public albFargateService: ecsPatterns.ApplicationLoadBalancedFargateService

  public loadBalancerDnsName: string

  public apiLogGroupName: string

  constructor(
    private readonly scope: Construct,
    private readonly id: string,
    private readonly props: ApiStackProps
  ) {
    super(scope, id, props)

    this.setEnvConfig()

    this.createFargateService()
  }

  private createFargateService() {
    const { envConfig } = this

    // Compile API code
    if (!process.env.SKIP_BUILDS) {
      childProcess.execSync('npx nx run api:build', {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'inherit',
      })
    }

    // Build docker image
    const apiDockerImage = new ecrAssets.DockerImageAsset(
      this,
      'apiDockerImage',
      {
        directory: path.join(__dirname, '..', '..', 'dist', 'apps', 'api'),
      }
    )

    const metricsLogGroup = new logs.LogGroup(this, 'MetricsLogGroup', {})

    const taskRole = this.getTaskRole({
      metricsLogGroup,
    })

    const secrets = this.getSecrets(this.props.db)

    const environment = {
      ...this.getBasicEnvironment({
        metricsLogGroup,
      }),
    }

    const apiLogGroup = new logs.LogGroup(this, 'ApiLogGroup', {})
    this.apiLogGroupName = apiLogGroup.logGroupName

    this.albFargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        'ApiService',
        {
          publicLoadBalancer: false,
          cluster: this.props.ecsCluster,
          serviceName: 'api-service',
          desiredCount: this.envConfig.apiFargateTask.desiredCount,
          memoryLimitMiB: this.envConfig.apiFargateTask.memoryLimitMiB,
          cpu: this.envConfig.apiFargateTask.cpu,
          protocol: elbv2.ApplicationProtocol.HTTP,
          taskImageOptions: {
            containerName: consts.API_CONTAINER_NAME,
            image: ecs.ContainerImage.fromDockerImageAsset(apiDockerImage),
            containerPort: 80,
            environment,
            secrets,
            taskRole: taskRole,
            logDriver: ecs.LogDriver.awsLogs({
              streamPrefix: `${this.props.envName}-api-log`,
              logGroup: apiLogGroup,
            }),
          },
        }
      )

    this.loadBalancerDnsName =
      this.albFargateService.loadBalancer.loadBalancerDnsName

    this.albFargateService.targetGroup.configureHealthCheck({
      path: '/healthcheck',
      protocol: elbv2.Protocol.HTTP,
      port: '80',
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
      interval: cdk.Duration.seconds(5),
      timeout: cdk.Duration.seconds(3),
    })

    this.albFargateService.targetGroup.setAttribute(
      'deregistration_delay.timeout_seconds',
      '5'
    )

    this.albFargateService.taskDefinition.addToExecutionRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'ssm:GetParameters',
          'kms:Decrypt',
        ],
        resources: ['*'],
      })
    )

    const adot = this.albFargateService.taskDefinition.addContainer('adot', {
      image: ecs.ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector'
      ),
      cpu: 256,
      memoryLimitMiB: 1024,
      essential: false,
      command: ['--config=/etc/ecs/ecs-default-config.yaml'],
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: `${this.props.envName}-tracing-api-service`,
      }),
    })

    adot.addPortMappings({
      containerPort: 2000,
      protocol: ecs.Protocol.UDP,
    })

    adot.addPortMappings({
      containerPort: 4317,
      protocol: ecs.Protocol.TCP,
    })

    adot.addPortMappings({
      containerPort: 4318,
      protocol: ecs.Protocol.TCP,
    })

    adot.addPortMappings({
      containerPort: 8125,
      protocol: ecs.Protocol.UDP,
    })

    this.addCloudWatchAgentContainer()

    this.createDatabaseMigrationLambdas(this.albFargateService)

    const fargateServiceScalableTarget =
      this.albFargateService.service.autoScaleTaskCount({
        minCapacity: envConfig.apiFargateTask.minTaskCount,
        maxCapacity: envConfig.apiFargateTask.maxTaskCount,
      })

    fargateServiceScalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
    })

    // this.createScheduledTasks(apiDockerImage, secrets, environment)

    // new AlbLogs(this, 'AlbLogs', {
    //   loadBalancer: this.albFargateService.loadBalancer,
    //   bucketForLogsInfixName: 'api-service',
    //   envName: this.props.envName,
    // })
  }

  // private createScheduledTasks(
  //   apiDockerImage: ecrAssets.DockerImageAsset,
  //   secrets: { [key: string]: ecs.Secret },
  //   environment: { [key: string]: string }
  // ) {
  //   const tasks: Array<{
  //     name: string
  //     schedule: Schedule
  //   }> = []

  //   for (const task of tasks) {
  //     new ScheduledFargateTask(this, `ScheduledTask${task.name}`, {
  //       cluster: this.props.ecsCluster,
  //       desiredTaskCount: 1,
  //       schedule: task.schedule,
  //       scheduledFargateTaskImageOptions: {
  //         image: ecs.ContainerImage.fromDockerImageAsset(apiDockerImage),
  //         secrets,
  //         environment,
  //         memoryLimitMiB: 1024,
  //         cpu: 512,
  //         command: [task.name],
  //         logDriver: ecs.LogDriver.awsLogs({
  //           streamPrefix: `${this.props.envName}-${task.name}`,
  //         }),
  //       },
  //     })
  //   }
  // }

  private getTaskRole({ metricsLogGroup }: { metricsLogGroup: logs.LogGroup }) {
    const taskRole = new iam.Role(this, `${this.props.envName}ApiTaskRole`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      inlinePolicies: {
        policy: new iam.PolicyDocument({
          statements: [
            // Needed by the CloudWatch Agent to push logs to the metrics log group.
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [cdk.Fn.join(':', [metricsLogGroup.logGroupArn, '*'])],
            }),
            // Tracing permissions
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:DescribeLogStreams',
                'logs:DescribeLogGroups',
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords',
                'xray:GetSamplingRules',
                'xray:GetSamplingTargets',
                'xray:GetSamplingStatisticSummaries',
                'cloudwatch:PutMetricData',
                'ec2:DescribeVolumes',
                'ec2:DescribeTags',
                'ssm:GetParameters',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    })

    return taskRole
  }

  private getBasicEnvironment({
    metricsLogGroup,
  }: {
    metricsLogGroup: logs.LogGroup
  }) {
    const {
      envConfig,
      props: { db },
    } = this

    return omitBy(
      {
        AWS_REGION: this.region,
        ENV_NAME: this.props.envName,
        // this is created inside containers 'docker-entrypoint.sh' using 'secrets' env vars
        // DATABASE_NAME: 'postgres',
        DATABASE_HOST: db.dbInstanceEndpointAddress,
        DATABASE_PORT: db.dbInstanceEndpointPort,
        NODE_ARG_ENABLE_SOURCE_MAPS: envConfig.apiFargateTask
          .nodeArgEnableSourceMaps
          ? 'true'
          : undefined,
        NODE_ENV: 'production',
      },
      isNullish
    ) as { [key: string]: string }
  }

  private getSecrets(db: rds.DatabaseInstance) {
    const { envConfig } = this

    if (!db.secret) {
      throw new Error('No secret attached to db (not possible)')
    }

    const dbSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'DbSecret',
      db.secret.secretName
    )

    return {
      DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
      DATABASE_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
      // API_JWT_SECRET: ecs.Secret.fromSecretsManager(this.props.apiJwtSecret),
    }
  }

  private addCloudWatchAgentContainer() {
    const cloudwatchAgent = this.albFargateService.taskDefinition.addContainer(
      'cw-agent',
      {
        image: ecs.ContainerImage.fromRegistry(
          'public.ecr.aws/cloudwatch-agent/cloudwatch-agent'
        ),
        cpu: 32,
        memoryReservationMiB: 256,
        essential: false,
        environment: {
          // Enable embedded metrics collection.
          CW_CONFIG_CONTENT: '{"logs":{"metrics_collected":{"emf":{}}}}',
        },
      }
    )

    cloudwatchAgent.addPortMappings({
      containerPort: 25888,
      protocol: ecs.Protocol.TCP,
    })
  }

  private createDatabaseMigrationLambdas(
    fargateService: ecsPatterns.ApplicationLoadBalancedFargateService
  ) {
    const migrationLambdaFnOnEvent = new lambdanode.NodejsFunction(
      this,
      `${this.props.envName}ApiRunMigrationScriptOnEvent`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, '..', 'lambda', 'migrations-on-event.ts'),
        functionName: `${this.props.envName}-api-run-migrations-on-event`,
        handler: 'onEvent',
        timeout: cdk.Duration.seconds(15),
        bundling: {
          sourceMap: true,
        },
      }
    )

    const migrationLambdaFnIsComplete = new lambdanode.NodejsFunction(
      this,
      `${this.props.envName}ApiRunMigrationScriptIsComplete`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          '..',
          'lambda',
          'migrations-is-complete.ts'
        ),
        functionName: `${this.props.envName}-api-run-migrations-is-complete`,
        handler: 'isComplete',
        timeout: cdk.Duration.seconds(30),
        bundling: {
          sourceMap: true,
        },
      }
    )

    ;[migrationLambdaFnOnEvent, migrationLambdaFnIsComplete].forEach((fn) => {
      fn.role?.addToPrincipalPolicy(
        new iam.PolicyStatement({
          actions: ['*'],
          resources: ['*'],
        })
      )
    })

    const executeMigrationsProvider = new cr.Provider(
      this,
      `${this.props.envName}ExecuteMigrationsProvider`,
      {
        onEventHandler: migrationLambdaFnOnEvent,
        isCompleteHandler: migrationLambdaFnIsComplete,
        queryInterval: cdk.Duration.seconds(20),
        totalTimeout: cdk.Duration.minutes(30),
      }
    )

    const executeMigrationsCustomResource = new cdk.CustomResource(
      this,
      `${this.props.envName}MigrationsCustomResource`,
      {
        serviceToken: executeMigrationsProvider.serviceToken,
        properties: {
          TASK_DEFINITION_ARN: fargateService.taskDefinition.taskDefinitionArn,
          CLUSTER_ARN: this.props.ecsCluster.clusterArn,
          PRIVATE_SUBNET_IDS: this.props.ecsVpc.privateSubnets.map(
            (x) => x.subnetId
          ),
          CONTAINER_NAME: consts.API_CONTAINER_NAME,
        },
      }
    )

    fargateService.service.node.addDependency(executeMigrationsCustomResource)
  }

  private setEnvConfig() {
    const { envName } = this.props

    const defaultEnvConfig: EnvConfig = {
      apiDomain: `${envName}-api.${config.DOMAIN}`,

      apiFargateTask: {
        cpu: 1024,
        memoryLimitMiB: 4096,
        desiredCount: 1,
        minTaskCount: 1,
        maxTaskCount: 2,
        nodeArgEnableSourceMaps: true,
      },
    }

    const envSpecificConfig: { [key: string]: Partial<EnvConfig> } = {
      prod: {
        apiDomain: `${envName}-api.${config.DOMAIN}`,

        apiFargateTask: {
          cpu: 4096,
          memoryLimitMiB: 8192,
          desiredCount: 3,
          minTaskCount: 3,
          maxTaskCount: 18,
          nodeArgEnableSourceMaps: false,
        },
      },
    }

    this.envConfig = {
      ...defaultEnvConfig,
      ...envSpecificConfig[envName],
    }
  }
}
