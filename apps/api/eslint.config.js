const baseConfig = require('../../eslint.config.js')

module.exports = [
  ...baseConfig,
  { rules: { curly: 'error' } },
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
  { ignores: ['**/*/src/generated', '**/node_modules'] },
]
