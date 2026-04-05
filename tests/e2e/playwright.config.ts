import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from '@playwright/test';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, '..', '..');

export default defineConfig({
  testDir: resolve(currentDir, 'specs'),
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: resolve(rootDir, 'test-results'),
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: resolve(rootDir, 'playwright-report') }]]
    : [['list'], ['html', { open: 'never', outputFolder: resolve(rootDir, 'playwright-report') }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:5173',
    headless: process.env.PW_HEADFUL === '1' ? false : true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 960 },
  },
  metadata: {
    apiURL: process.env.API_URL ?? 'http://127.0.0.1:8000/api',
    runtime: process.env.TEST_ENV_MODE ?? 'local-linux',
  },
});
