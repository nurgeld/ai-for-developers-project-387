import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test-setup';

test.beforeEach(async ({ api }) => {
  await api.resetAppState();
});

async function openSettingsTab(page: Page) {
  await page.goto('/admin');
  await page.getByRole('tab', { name: 'Настройки' }).click();
  await expect(page.getByText('Типы событий')).toBeVisible();
}

async function openCreateModal(page: Page) {
  await page.getByRole('button', { name: 'Создать' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Новый тип события')).toBeVisible();
}



test('T19 opens create event type modal', async ({ page }) => {
  await openSettingsTab(page);
  await openCreateModal(page);

  await expect(page.getByLabel('Название')).toBeVisible();
  await expect(page.getByLabel('Описание')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Длительность' })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Создать' })).toBeVisible();
});

test('T20 successfully creates an event type when target duration is free', async ({ page, api }) => {
  const eventType15 = (await api.getEventTypes()).find((eventType) => eventType.durationMinutes === 15);

  if (!eventType15) {
    throw new Error('Expected default 15-minute event type to exist');
  }

  await api.deleteEventTypeViaAPI(eventType15.id);

  await openSettingsTab(page);
  await openCreateModal(page);

  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/owner/event-types') && response.request().method() === 'POST',
  );

  await page.getByLabel('Название').fill('Тестовая встреча');
  await page.getByLabel('Описание').fill('Описание тестовой встречи');
  await page.getByRole('dialog').getByRole('button', { name: 'Создать' }).click();

  await expect((await createResponse).status()).toBe(200);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Тестовая встреча')).toBeVisible();
  await expect(page.getByText('15 мин')).toBeVisible();
});

test('T21 enters inline edit mode for an event type', async ({ page }) => {
  await openSettingsTab(page);
  await page.getByRole('button', { name: 'Изменить' }).first().click();

  const inlineEditArea = page.locator('form').filter({ hasText: 'Название' }).first();
  await expect(inlineEditArea.getByRole('textbox', { name: 'Название' })).toBeVisible();
  await expect(inlineEditArea.getByRole('button', { name: 'Сохранить' })).toBeVisible();
  await expect(inlineEditArea.getByRole('button', { name: 'Отмена' })).toBeVisible();
});

test('T22 saves edited event type inline', async ({ page }) => {
  await openSettingsTab(page);
  await page.getByRole('button', { name: 'Изменить' }).first().click();

  const inlineEditArea = page.locator('form').filter({ hasText: 'Название' }).first();

  const saveResponse = page.waitForResponse(
    (response) => response.url().includes('/api/owner/event-types/') && response.request().method() === 'PATCH',
  );

  await inlineEditArea.getByRole('textbox', { name: 'Название' }).fill('Обновлённое название');
  await inlineEditArea.getByRole('button', { name: 'Сохранить' }).click();

  await expect((await saveResponse).status()).toBe(200);
  await expect(inlineEditArea.getByRole('textbox', { name: 'Название' })).toHaveCount(0);
  await expect(page.getByText('Обновлённое название')).toBeVisible();
});

test('T23 deletes one event type when at least two exist', async ({ page, api }) => {
  const eventTypes = await api.getEventTypes();

  if (eventTypes.length < 2) {
    throw new Error('Expected at least two event types before delete test');
  }

  const deletedName = eventTypes[eventTypes.length - 1].name;

  await openSettingsTab(page);

  const deleteResponse = page.waitForResponse(
    (response) => response.url().includes('/api/owner/event-types/') && response.request().method() === 'DELETE',
  );

  await page.getByRole('button', { name: 'Удалить' }).last().click();

  await expect((await deleteResponse).status()).toBe(204);
  await expect(page.getByText(deletedName)).toHaveCount(0);
});

test('T24 keeps modal open on duplicate duration error', async ({ page }) => {
  await openSettingsTab(page);
  await openCreateModal(page);

  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/owner/event-types') && response.request().method() === 'POST',
  );

  await page.getByLabel('Название').fill('Дубликат 15 минут');
  await page.getByLabel('Описание').fill('Проверка конфликта по длительности');
  await page.getByRole('dialog').getByRole('button', { name: 'Создать' }).click();

  await expect((await createResponse).status()).toBe(409);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByText(/Тип события с такой длительностью уже существует/i)).toBeVisible();
});
