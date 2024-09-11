import {
  extendType,
  inputObjectType,
  intArg,
  nonNull,
  objectType,
  stringArg,
} from 'nexus'

export const Role = objectType({
  name: 'Role',
  definition(t) {
    t.nonNull.int('id')
    t.string('name')
    t.field('company', {
      type: 'Company',
      resolve: (parent, _, ctx) => {
        return ctx.db.role
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .company()
      },
    })
    t.list.field('skills', {
      type: 'Skill',
      resolve: (parent, _, ctx) => {
        return ctx.db.role
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .skills()
      },
    })
  },
})

export const RoleInputType = inputObjectType({
  name: 'RoleInputType',
  definition(t) {
    t.nullable.int('id')
    t.nullable.string('name')
  },
})

export const RoleMutation = extendType({
  type: 'Mutation',
  definition(t) {
    // create a new company
    t.nonNull.field('createRole', {
      type: 'Role',
      args: {
        id: intArg(),
        name: nonNull(stringArg()),
      },
      resolve(_root, args, ctx) {
        return ctx.db.role.create({
          data: {
            name: args.name,
          },
        })
      },
    })
  },
})
