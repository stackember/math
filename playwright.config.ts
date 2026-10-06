import { defineConfig, devices } from "@playwright/test"

/** Окремий порт, щоб не конфліктувати з `npm run dev` (3000). */
const PORT = 3100

/**
 * E2E-тести проти продакшн-збірки: спершу `npm run build`, потім `npm run test:e2e`
 * (`npm run verify` робить обидва кроки).
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "uk-UA",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /layout\.spec\.ts/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
