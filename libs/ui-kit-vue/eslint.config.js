const { FlatCompat } = require('@eslint/eslintrc')
const baseConfig = require('../../eslint.config.js')
const eslintPluginVitest = require('eslint-plugin-vitest')
const eslintPluginVue = require('eslint-plugin-vue')
const vueEslintParser = require('vue-eslint-parser')
const js = require('@eslint/js')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

module.exports = [
  ...baseConfig,
  ...compat.extends('plugin:vue/vue3-recommended'),
  {
    plugins: {
      vitest: eslintPluginVitest,
      vue: eslintPluginVue,
    },
  },
  { ignores: ['!**/*'] },
  {
    languageOptions: {
      parser: vueEslintParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'never',
        },
      ],
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          variables: false,
          functions: false,
        },
      ],
      curly: 'error',
      'no-console': 'error',
      'prefer-template': 'error',
      'no-useless-concat': 'error',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'import/extensions': 'off',
      '@nrwl/nx/enforce-module-boundaries': 'off',
      'import/no-unresolved': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.js', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        project: ['libs/ui-kit-vue/tsconfig.*?.json'],
        extraFileExtensions: ['.vue'],
      },
    },
  },
]
