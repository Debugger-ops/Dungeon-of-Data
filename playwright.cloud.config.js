import { defineConfig } from '@playwright/test'

// End-to-end tests for the cloud features against an in-memory fake Supabase (see tests/e2e-cloud/fakeSupabase.js).
// The app is built with fake keys into dist-cloud so the normal build stays untouched.
export default defineConfig({
  testDir: 'tests/e2e-cloud',
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-cloud' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4174',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  webServer: {
    command: 'VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=test-anon-key npx vite build --outDir dist-cloud && npx vite preview --outDir dist-cloud --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
