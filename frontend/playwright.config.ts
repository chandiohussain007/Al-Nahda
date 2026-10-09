import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command:
      'cmd /c "set NEXT_PUBLIC_API_URL=http://127.0.0.1:3001 && set NEXT_PUBLIC_GOOGLE_CLIENT_ID=demo-client-id && npm run dev -- --hostname 127.0.0.1 --port 3000"',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
