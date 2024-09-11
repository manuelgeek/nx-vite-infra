const { FlatCompat } = require('@eslint/eslintrc')
const nrwlEslintPluginNx = require('@nrwl/eslint-plugin-nx')
const typescriptEslintEslintPlugin = require('@typescript-eslint/eslint-plugin')
const js = require('@eslint/js')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

module.exports = [
  ...compat.extends(
    // 'airbnb-typescript',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@nrwl/nx/typescript',
    'plugin:import/recommended'
  ),
  {
    plugins: {
      '@nrwl/nx': nrwlEslintPluginNx,
      '@typescript-eslint': typescriptEslintEslintPlugin,
    },
  },
  {
    ignores: ['**/*'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
      '@typescript-eslint/lines-between-class-members': 'off',
      '@typescript-eslint/no-throw-literal': 'off',
      'react/jsx-filename-extension': 'off',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/return-await': 'off',
      'import/extension': 'off',
      'import/namespace': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      // 'import/no-named-as-default-member': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nrwl/nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  ...compat
    .config({ extends: ['plugin:@nrwl/nx/typescript'] })
    .map((config) => ({
      ...config,
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        ...config.rules,
      },
    })),
  ...compat
    .config({
      extends: [
        'plugin:vue/vue3-recommended',
        'eslint:recommended',
        '@vue/typescript/recommended',
        'prettier',
      ],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.vue'],
      rules: {
        ...config.rules,
        'vue/multi-word-component-names': 'off',
        'vue/require-default-prop': 'off',
      },
      languageOptions: { parserOptions: { ecmaVersion: 2021 } },
    })),
  ...compat
    .config({ extends: ['plugin:@nrwl/nx/javascript'] })
    .map((config) => ({
      ...config,
      files: ['**/*.js', '**/*.jsx'],
      rules: {
        ...config.rules,
      },
    })),
]
