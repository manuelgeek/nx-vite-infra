// ? NOTE: use to display incase of multiple aws accounts

import { getConfig } from './config'

const config = getConfig()

export const ACCOUNT = {
  PROD: config.AWS_PROD_ACCOUNT,
  DEV: config.AWS_DEV_ACCOUNT,
}

export const API_CONTAINER_NAME = 'main'

export const STACK_NAME = {
  networkingAndEcsStackName: (env: string) => `${env}NetworkAndEcs`,
  ecsStackName: (env: string) => `${env}EcsStack`,
  vueSiteStackName: (env: string) => `${env}VueSiteStack`,
  apiStackName: (env: string) => `${env}ApiStack`,
  apiBaseStackName: (env: string) => `${env}ApiBaseStack`,
}
