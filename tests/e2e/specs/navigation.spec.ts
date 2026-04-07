import { test, expect } from '../fixtures/test-setup';

test.beforeEach(async ({ api }) => {
  await api.resetAppState();
});

test('T25 navigates from home to admin via header', async ({ page }) => {
  await page.goto('/');
  await page.locator('header').getByRole('link', { name: 'Управление' }).click();

  await expect(page).toHaveURL(/\/admin$/);
});

test('T25 navigates from admin to booking via header', async ({ page }) => {
  await page.goto('/admin');
  await page.locator('header').getByRole('link', { name: 'Записаться' }).click();

  await expect(page).toHaveURL(/\/book$/);
});

test('T25 navigates from booking to home via logo link', async ({ page }) => {
  await page.goto('/book');
  await page.locator('header').getByRole('link', { name: 'Calendar' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible();
});
