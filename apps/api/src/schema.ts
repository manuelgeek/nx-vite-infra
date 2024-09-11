import { makeSchema } from 'nexus'
import path, { join } from 'path'
import fs from 'fs'
// It is considered best practice to pass your types directly from a "star import" like we've done above. Under the hood, Nexus will unwrap the types. This prevents from constantly having to manually export & import every single type of your API.
import * as types from './graphql'

const contextModulePath = path.join(__dirname, 'context.ts')

export const schema = makeSchema({
  // GraphQL types that will be used to construct your GraphQL schema.
  types,
  outputs: {
    // Output path to where nexus should write the generated TypeScript definition types derived from your schema. This is mandatory to benefit from Nexus' type-safety.
    // typegen: join(__dirname, '..', 'nexus-typegen.ts'),
    typegen: path.join(
      __dirname,
      '../node_modules/@types/nexus-typegen-custom/index.d.ts'
    ),
    // Output path to where nexus should write the SDL (schema definition language) version of your GraphQL schema.
    schema: join(
      __dirname,
      '..',
      'src',
      'generated',
      'graphql',
      'schema.graphql'
    ),
  },
  // Typing for the GraphQL context.
  contextType: fs.existsSync(contextModulePath)
    ? {
        // Path to the module where the context type is exported
        module: contextModulePath,
        // Name of the export in that module
        export: 'GqlContext',
      }
    : undefined,
})
