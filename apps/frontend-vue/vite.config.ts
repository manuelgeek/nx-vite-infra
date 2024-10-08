import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'

export default defineConfig({
  plugins: [vue(), nxViteTsPaths()],
  // build: {
  //   rollupOptions: {
  //     external: [
  //       '@nx-vite-vue/ui-kit-vue',
  //     ],
  //   },
  // },
})
