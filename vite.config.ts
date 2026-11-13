import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/litesheet/', // GitHub Pages serves the site under /litesheet/
  plugins: [svelte()],
  build: { rollupOptions: { input: ['index.html', 'design.html'] } },
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
})
