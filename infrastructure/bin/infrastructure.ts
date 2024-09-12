#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import * as consts from '../consts'
import { Tags } from 'aws-cdk-lib'
import { VueSiteStackProps } from '../lib/vue-site-stack'
import { getConfig } from '../config'
import { ApiBaseStack } from '../lib/api-base-stack'
import { STACK_NAME } from '../consts'
import { EcsStack } from '../lib/ecs-stack'
import { NetworkingStack } from '../lib/networking-stack'
import { ApiStack } from '../lib/api-stack'

const config = getConfig()

const env = process.env.ENV
if (!env) {
  console.error('No ENV env var defined')
  process.exit(1)
}
const isProd = env === 'prod'
const isDev = env === 'dev'

const isDevEnv = !['prod', 'staging'].includes(env)
const region = config.REGION

// TODO: planning to use 1 for both envs
// let currentEnvironmentAccount = consts.ACCOUNT.PROD;
let currentEnvironmentAccount = consts.ACCOUNT.DEV
if (isDevEnv) {
  currentEnvironmentAccount = consts.ACCOUNT.DEV
}

const app = new cdk.App()
Tags.of(app).add('Env', env)

const networkingEnv = isDevEnv ? 'dev' : env
const networkingStack = new NetworkingStack(
  app,
  STACK_NAME.networkingAndEcsStackName(networkingEnv),
  {
    env: { account: currentEnvironmentAccount, region },
    envName: networkingEnv,
  }
)

Tags.of(networkingStack).add('Env', networkingEnv)

const ecsStack = new EcsStack(app, STACK_NAME.ecsStackName(env), {
  env: { account: currentEnvironmentAccount, region },
  envName: env,
  vpc: networkingStack.mainVpc,
})

const apiBaseStack = new ApiBaseStack(app, STACK_NAME.apiBaseStackName(env), {
  env: { account: currentEnvironmentAccount, region },
  envName: env,
  ecsVpc: networkingStack.mainVpc,
  ecsCluster: ecsStack.ecsCluster,
})

const apiStack = new ApiStack(app, STACK_NAME.apiStackName(env), {
  env: { account: currentEnvironmentAccount, region },
  envName: env,
  ecsVpc: networkingStack.mainVpc,
  ecsCluster: ecsStack.ecsCluster,
  db: apiBaseStack.database,
  // apiJwtSecret: apiStack.apiJwtSecret,
})

new VueSiteStackProps(app, STACK_NAME.vueSiteStackName(env), {
  env: { account: currentEnvironmentAccount, region },
  envName: env,
})
