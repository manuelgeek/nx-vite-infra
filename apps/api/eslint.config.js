// eslint-disable-next-line @typescript-eslint/no-require-imports
const baseConfig = require('../../eslint.config.js')

module.exports = [
  ...baseConfig,
  {
    rules: {
      curly: 'error',
      'import/extensions': 'off',
      'import/namespace': 'off',
      'import/no-unresolved': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
    languageOptions: {
      parserOptions: { project: ['apps/api/tsconfig.*?.json'] },
    },
  },
  { ignores: ['!**/*', '**/*/src/generated', '**/node_modules'] },
]
