const { createGlobPatternsForDependencies } = require('@nx/react/tailwind')
const { join } = require('path')

const baseConfig = require('../../.tailwind/tailwind.config')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
      // TODO: add ui-kit-react
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  presets: [baseConfig],
  theme: {
    extend: {},
  },
  plugins: [],
}
