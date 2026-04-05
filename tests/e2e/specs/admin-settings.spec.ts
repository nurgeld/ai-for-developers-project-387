import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test-setup';

test.beforeEach(async ({ api }) => {
  await api.resetAppState();
});

async function openSettingsTab(page: Page) {
  await page.goto('/admin');
  await page.getByRole('tab', { name: 'Настройки' }).click();
  await expect(page.getByText('Настройки профиля')).toBeVisible();
}

test('T16 updates owner settings', async ({ page }) => {
  await openSettingsTab(page);

  const saveResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/owner/settings') && response.request().method() === 'PATCH',
  );

  await page.getByRole('textbox', { name: 'Имя' }).fill('Новое Имя');
  await page.getByRole('textbox', { name: 'Начало рабочего дня' }).fill('10:00');
  await page.getByRole('textbox', { name: 'Конец рабочего дня' }).fill('19:00');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect((await saveResponse).status()).toBe(200);
  await expect(page.getByText('Сохранено')).toBeVisible();
});

test('T17 keeps updated settings after page reload', async ({ page, api }) => {
  await api.updateSettingsViaAPI({
    name: 'Новое Имя',
    workDayStart: '10:00',
    workDayEnd: '19:00',
  });

  await openSettingsTab(page);
  await page.reload();
  await page.getByRole('tab', { name: 'Настройки' }).click();

  await expect(page.getByRole('textbox', { name: 'Имя' })).toHaveValue('Новое Имя');
  await expect(page.getByRole('textbox', { name: 'Начало рабочего дня' })).toHaveValue('10:00');
  await expect(page.getByRole('textbox', { name: 'Конец рабочего дня' })).toHaveValue('19:00');
});

test('T18 rejects invalid work hours on save', async ({ page }) => {
  await openSettingsTab(page);

  const saveResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/owner/settings') && response.request().method() === 'PATCH',
  );

  await page.getByRole('textbox', { name: 'Начало рабочего дня' }).fill('99:99');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect((await saveResponse).status()).toBe(400);
  await expect(page.getByText('Ошибка сохранения')).toBeVisible();
  await expect(page.getByText('Сохранено')).toHaveCount(0);
});
