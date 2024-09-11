import {
  arg,
  extendType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus'

export const Skill = objectType({
  name: 'Skill',
  definition(t) {
    t.nonNull.int('id')
    t.string('name')
    t.field('role', {
      type: 'Role',
      resolve: (parent, _, ctx) => {
        return ctx.db.skill
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .role()
      },
    })
  },
})

export const SkillMutation = extendType({
  type: 'Mutation',
  definition(t) {
    // create a new company
    t.nonNull.field('createSkill', {
      type: 'Skill',
      args: {
        id: intArg(),
        name: nonNull(stringArg()),
        roleId: intArg(),
      },
      resolve(_root, args, ctx) {
        return ctx.db.skill.create({
          data: {
            name: args.name,
            roleId: args.roleId,
          },
        })
      },
    })
  },
})
