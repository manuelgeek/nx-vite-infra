// ? NOTE: use to display incase of multiple aws accounts

import { getConfig } from "./config"

const config = getConfig()

export const ACCOUNT = {
  PROD: config.AWS_PROD_ACCOUNT,
  DEV: config.AWS_DEV_ACCOUNT,
}


export const STACK_NAME = {
  vueSiteStackName: (env: string) => `${env}VueSiteStack`
}
