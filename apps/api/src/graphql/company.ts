import {
  arg,
  extendType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus'

export const Company = objectType({
  name: 'Company',
  definition(t) {
    t.nonNull.int('id')
    t.string('name')
    t.string('contactPerson')
    t.string('bio')
    t.string('email')
    t.string('website')
    t.int('roleId')
    t.nonNull.list.nonNull.field('roles', {
      type: 'Role',
      resolve: (parent, _, ctx) => {
        return ctx.db.company
          .findUnique({
            where: { id: parent.id },
          })
          .roles()
      },
    })
  },
})

export const CompanyQuery = extendType({
  type: 'Query',
  definition(t) {
    // get all companies
    t.list.field('companies', {
      type: 'Company',
      resolve(_root, _args, ctx) {
        return ctx.db.company.findMany()
      },
    })
    // get company by id
    t.field('company', {
      type: 'Company',
      args: {
        id: nonNull(intArg()),
      },
      resolve(_root, args, ctx) {
        return ctx.db.company.findUnique({
          where: { id: args.id },
        })
      },
    })
    t.list.field('roles', {
      type: 'Role',
      resolve(_root, _args, ctx) {
        return ctx.db.role.findMany()
      },
    })
  },
})

export const CompanyMutation = extendType({
  type: 'Mutation',
  definition(t) {
    // create a new company
    t.nonNull.field('createCompany', {
      type: 'Company',
      args: {
        id: intArg(),
        name: nonNull(stringArg()),
        contactPerson: nonNull(stringArg()),
        bio: nonNull(stringArg()),
        email: nonNull(stringArg()),
        website: nonNull(stringArg()),
        roleId: intArg(),
        roles: arg({
          type: list('RoleInputType'),
        }),
      },
      resolve(_root, args, ctx) {
        return ctx.db.company.create({
          data: {
            name: args.name,
            contactPerson: args.contactPerson,
            bio: args.bio,
            email: args.email,
            website: args.website,
            roles: {
              connect: [{ id: args.roleId || undefined }],
              // createMany: {
              //   data: [{ name: "Admin" }],
              // },
            },
          },
        })
      },
    })
    // update a company by id
    t.field('updateCompany', {
      type: 'Company',
      args: {
        id: nonNull(intArg()),
        name: stringArg(),
        contactPerson: stringArg(),
        bio: stringArg(),
        email: stringArg(),
        website: stringArg(),
        roleId: intArg(),
        roles: arg({
          type: list('RoleInputType'),
        }),
      },
      resolve(_root, args, ctx) {
        return ctx.db.company.update({
          where: { id: args.id },
          data: {
            name: args.name,
            contactPerson: args.contactPerson,
            bio: args.bio,
            email: args.email,
            website: args.website,
            roles: {
              connect: [{ id: args.roleId || undefined }],
            },
          },
        })
      },
    })
    // delete a company by id
    t.field('deleteCompany', {
      type: 'Company',
      args: {
        id: nonNull(intArg()),
      },
      resolve(_root, args, ctx) {
        return ctx.db.company.delete({
          where: { id: args.id },
        })
      },
    })
  },
})
