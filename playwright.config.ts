import { defineConfig, devices } from '@playwright/test';

const PORTA = 3000;
const BASE = process.env.BASE_URL ?? `http://127.0.0.1:${PORTA}`;

const servidorLocal = {
  command: 'npm run build && npm run start',
  url: BASE,
  reuseExistingServer: !process.env.CI,
  timeout: 180_000,
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  ...(process.env.CI === undefined ? {} : { workers: 2 }),
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Com BASE_URL apontando para um ambiente já publicado, o Playwright não
  // sobe servidor nenhum: testa o que está no ar.
  ...(process.env.BASE_URL === undefined ? { webServer: servidorLocal } : {}),
});
