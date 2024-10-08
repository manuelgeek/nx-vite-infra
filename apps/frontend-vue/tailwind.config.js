/** @type {import('tailwindcss').Config} */

const { join } = require('path')
const baseConfig = require('../../.tailwind/tailwind.config')

module.exports = {
  content: [
    join(__dirname, './src/**/!(*.stories|*.spec).{ts,js,html,vue}'),
    join(
      __dirname,
      '../../../libs/ui-kit-vue/src/**/!(*.stories|*.spec).{ts,js,vue,html}'
    ),
  ],
  presets: [baseConfig],
}
