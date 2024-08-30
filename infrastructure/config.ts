import * as dotenv from "dotenv"
import path = require("path")

// 1. Configure dotenv to read from our `.env` file
dotenv.config({ path: path.resolve(__dirname, ".env") })

// 2. Define a TS Type to type the returned envs from our function below.
export type ConfigProps = {
  REGION: string
  AWS_DEV_ACCOUNT: string
  AWS_PROD_ACCOUNT: string
  DOMAIN: string
  CERTIFACE_ARN: string
}

// 3. Define a function to retrieve our env variables
export const getConfig = (): ConfigProps => ({
  REGION: process.env.REGION || "eu-east-1",
  AWS_DEV_ACCOUNT: process.env.AWS_DEV_ACCOUNT || "",
  AWS_PROD_ACCOUNT: process.env.AWS_PROD_ACCOUNT || "",
  DOMAIN: process.env.DOMAIN || "",
  CERTIFACE_ARN: process.env.CERTIFACE_ARN || "",
})
