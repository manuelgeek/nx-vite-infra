import { ApolloServer } from 'apollo-server'
import { schema } from './schema'
import { context } from './context'

const server = new ApolloServer({ schema, context })

const port = process.env.PORT || 4000

server.listen({ port }).then(() => {
  console.log(`Server API ready at http://localhost:${port}/graphql`)
})
