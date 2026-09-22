const path = require('path');
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const baseURL = process.env.SIDO2_BASE_URL || 'https://sido2-demo.example.com';
const reporters = [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]];

if (process.env.PLAYWRIGHT_JSON_SUMMARY === 'true') {
  reporters.push(['json', { outputFile: 'test-results/results.json' }]);
}

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45_000,
  workers: 1,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  reporter: reporters,
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1024 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
