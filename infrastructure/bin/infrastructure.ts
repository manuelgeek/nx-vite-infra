#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as consts from "../consts"
import { Tags } from 'aws-cdk-lib';
import { VueSiteStackProps } from '../lib/vue-site-stack';
import { getConfig } from '../config';

const config = getConfig()

const env = process.env.ENV;
if (!env) {
  console.error('No ENV env var defined');
  process.exit(1);
}
const isProd = env === 'prod';
const isDev = env === 'dev';

const isDevEnv = !['prod', 'staging'].includes(env);
const region = config.REGION;

// TODO: planning to use 1 for both envs
// let currentEnvironmentAccount = consts.ACCOUNT.PROD;
let currentEnvironmentAccount = consts.ACCOUNT.DEV
if (isDevEnv) {
  currentEnvironmentAccount = consts.ACCOUNT.DEV;
}

const app = new cdk.App();
Tags.of(app).add("Env", env)

new VueSiteStackProps(app, consts.STACK_NAME.vueSiteStackName(env), {
  env: { account: currentEnvironmentAccount, region },
  envName: env,
})
