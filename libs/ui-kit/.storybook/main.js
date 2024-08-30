const path = require("path")

const postcssRule = {
  test: /\.css$/,
  use: [
    {
      loader: "postcss-loader",
      options: {
        postcssOptions: {
          config: path.resolve(__dirname, "../.tailwind/postcss.config.js"),
        },
        // implementation: require.resolve("postcss")
      },
    },
  ],
}

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-postcss",
  ],
  framework: "@storybook/vue3",
  webpackFinal: async (config) => {
    // apply any global webpack configs that might have been specified in .storybook/main.js
    let finalConfig = config

    // add your own webpack tweaks if needed
    finalConfig.module.rules = [...config.module.rules, postcssRule]

    return finalConfig
  },
}
