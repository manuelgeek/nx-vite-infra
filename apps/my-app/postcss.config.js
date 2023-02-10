const { join } = require('path');
const baseConfig = require('../../.tailwind/postcss.config');

module.exports = {
  ...baseConfig,
  plugins: {
    autoprefixer: {},
    tailwindcss: {
      config: join(__dirname, 'tailwind.config.js'),
    },
  },
}
