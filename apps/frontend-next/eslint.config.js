const { FlatCompat } = require('@eslint/eslintrc')
const js = require('@eslint/js')
const baseConfig = require('../../eslint.config.js')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

module.exports = [
  ...compat.extends(
    'plugin:@nx/react-typescript'
    // 'next',
    // 'next/core-web-vitals'
  ),
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
    },
    languageOptions: {
      parserOptions: { project: ['apps/frontend-next/tsconfig.json'] },
    },
  },
  ...compat.config({ env: { jest: true } }).map((config) => ({
    ...config,
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
    rules: {
      ...config.rules,
    },
  })),
  { ignores: ['!**/*', '**/.next/*', '**/jest.config.ts'] },
]
