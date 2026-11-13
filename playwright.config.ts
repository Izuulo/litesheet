import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:4173/litesheet/' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm preview --strictPort',
    url: 'http://localhost:4173/litesheet/',
    reuseExistingServer: !process.env.CI,
  },
})
