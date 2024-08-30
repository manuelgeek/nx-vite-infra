/** @type {import('tailwindcss').Config} */

import { tailwindTheme } from "./tailwind.theme"

module.exports = {
  container: {
    center: true,
  },
  theme: {
    extend: tailwindTheme,
  },
  variants: {
    extend: {},
  },
  important: true,
  plugins: [],
}
