const { join } = require("path")
const baseConfig = require("../../../.tailwind/tailwind.config")

module.exports = {
  presets: [baseConfig],
  content: [join(__dirname, "../src/**/!(*.stories|*.spec).{ts,tsx,html}")],
  theme: {
    extend: {
      boxShadow: {
        container: `0px 8px 28px -6px rgba(24, 39, 75, 0.1), 0px 18px 88px -4px rgba(24, 39, 75, 0.1);`,
      },
    },
  },
}
