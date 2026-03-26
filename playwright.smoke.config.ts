import { defineConfig, devices } from '@playwright/test';

const deploymentUrl = process.env.SMOKE_BASE_URL;

if (!deploymentUrl) {
  throw new Error('Missing SMOKE_BASE_URL. Set it to the Vercel deployment URL you want to verify.');
}

export default defineConfig({
  testDir: './smoke',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: deploymentUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
