import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test-setup';
import {
  formatSlotRange,
  getSlotStatusButton,
  selectCalendarDate,
} from '../fixtures/test-setup';
import type { TestApi } from '../fixtures/test-setup';

test.beforeEach(async ({ api }) => {
  await api.resetAppState();
});

async function openBookingPageForFirstAvailableSlot(
  page: Page,
  api: TestApi,
) {
  const lookup = await api.findAvailableSlot({ durationMinutes: 15 });
  await page.goto(`/book/${lookup.eventType.id}`);
  await expect(page.getByRole('heading', { name: 'Запись на звонок', level: 2 })).toBeVisible();
  return lookup;
}

async function openCalendarWithSelectedDate(
  page: Page,
  api: TestApi,
) {
  const lookup = await openBookingPageForFirstAvailableSlot(page, api);
  await selectCalendarDate(page, lookup.date);
  return lookup;
}

async function openBookingForm(
  page: Page,
  api: TestApi,
) {
  const lookup = await openCalendarWithSelectedDate(page, api);
  await getSlotStatusButton(page, lookup.slot, 'Свободно').click();
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeEnabled();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page.getByRole('textbox', { name: 'Имя' })).toBeVisible();
  return lookup;
}

test('T01 renders landing page content', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible();
  await expect(page.locator('main').getByRole('link', { name: /Записаться/ })).toBeVisible();
  await expect(page.getByText('Возможности')).toBeVisible();
  await expect(page.locator('main').getByRole('listitem')).toHaveCount(3);
});

test('T02 navigates from landing page to event types', async ({ page, api }) => {
  const settings = await api.getSettings();

  await page.goto('/');
  await page.locator('main').getByRole('link', { name: /Записаться/ }).click();

  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole('heading', { name: 'Выберите тип события', level: 2 })).toBeVisible();
  await expect(page.getByText(settings.name)).toBeVisible();
  await expect(page.getByText(/мин$/).first()).toBeVisible();
});

test('T03 opens booking page from event type card', async ({ page, api }) => {
  const eventType = (await api.getEventTypes())[0];

  await page.goto('/book');
  await page.getByText(eventType.name).click();

  await expect(page).toHaveURL(new RegExp(`/book/${eventType.id}$`));
  await expect(page.getByRole('heading', { name: 'Запись на звонок', level: 2 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Календарь', level: 4 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Статус слотов', level: 4 })).toBeVisible();
  await expect(page.getByText(eventType.name)).toBeVisible();
});

test('T04 loads slot statuses after choosing an available date', async ({ page, api }) => {
  await openCalendarWithSelectedDate(page, api);

  await expect(page.getByRole('button', { name: /Свободно|Занято/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeDisabled();
});

test('T05 enables continue after slot selection', async ({ page, api }) => {
  const lookup = await openCalendarWithSelectedDate(page, api);

  await getSlotStatusButton(page, lookup.slot, 'Свободно').click();

  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeEnabled();
  await expect(page.getByText(formatSlotRange(lookup.slot)).first()).toBeVisible();
});

test('T06 shows booking form after continue', async ({ page, api }) => {
  await openBookingForm(page, api);

  await expect(page.getByRole('textbox', { name: 'Имя' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Электронная почта' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Подтвердить запись' })).toBeVisible();
});

test('T07 rejects invalid booking form input', async ({ page, api }) => {
  await openBookingForm(page, api);

  await page.getByRole('textbox', { name: 'Имя' }).fill('А');
  await page.getByRole('textbox', { name: 'Электронная почта' }).fill('abc');
  await page.getByRole('button', { name: 'Подтвердить запись' }).click();

  await expect(page.getByText(/Минимум 2/i)).toBeVisible();
  await expect(page.getByText(/email/i)).toBeVisible();
  await expect(page.getByText('Бронь подтверждена. До встречи!')).toHaveCount(0);
});

test('T08 accepts valid booking form input and shows success', async ({ page, api }) => {
  await openBookingForm(page, api);

  const bookingResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/bookings') && response.request().method() === 'POST',
  );

  await page.getByRole('textbox', { name: 'Имя' }).fill('Тест Пользователь');
  await page.getByRole('textbox', { name: 'Электронная почта' }).fill('test@example.com');
  await page.getByRole('button', { name: 'Подтвердить запись' }).click();

  await expect((await bookingResponse).status()).toBe(200);
  await expect(page.getByText('Бронь подтверждена. До встречи!')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Забронировать еще' })).toBeVisible();
});

test('T09 returns to event types from success screen', async ({ page, api }) => {
  await openBookingForm(page, api);

  await page.getByRole('textbox', { name: 'Имя' }).fill('Тест Пользователь');
  await page.getByRole('textbox', { name: 'Электронная почта' }).fill('test@example.com');
  await page.getByRole('button', { name: 'Подтвердить запись' }).click();
  await expect(page.getByText('Бронь подтверждена. До встречи!')).toBeVisible();

  await page.getByRole('button', { name: 'Забронировать еще' }).click();

  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole('heading', { name: 'Выберите тип события', level: 2 })).toBeVisible();
});

test('T10 returns to event types from calendar step', async ({ page, api }) => {
  await openBookingPageForFirstAvailableSlot(page, api);

  await page.getByRole('button', { name: 'Назад' }).click();

  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole('heading', { name: 'Выберите тип события', level: 2 })).toBeVisible();
});

test('T11 returns from form to calendar while keeping selected time summary', async ({ page, api }) => {
  const lookup = await openBookingForm(page, api);

  await page.getByRole('button', { name: 'Изменить' }).click();

  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Имя' })).toHaveCount(0);
  await expect(page.getByText(formatSlotRange(lookup.slot)).first()).toBeVisible();
  await expect(getSlotStatusButton(page, lookup.slot, 'Свободно')).toBeVisible();
});

test('T12 handles slot conflict on final submit', async ({ page, api }) => {
  const lookup = await openCalendarWithSelectedDate(page, api);

  await getSlotStatusButton(page, lookup.slot, 'Свободно').click();
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeEnabled();
  await page.getByRole('button', { name: 'Продолжить' }).click();

  await api.createBookingViaAPI({
    eventTypeId: lookup.eventType.id,
    guestName: 'Другой Пользователь',
    guestEmail: 'other@example.com',
    startAt: lookup.slot.startAt,
  });

  await page.getByRole('textbox', { name: 'Имя' }).fill('Конфликт Тест');
  await page.getByRole('textbox', { name: 'Электронная почта' }).fill('conflict@example.com');

  await page.getByRole('button', { name: 'Подтвердить запись' }).click();

  await expect(page.getByRole('heading', { name: 'Календарь', level: 4 })).toBeVisible();
  await expect(page.getByText(/Выбранный слот уже занят/i)).toBeVisible();
  await expect(getSlotStatusButton(page, lookup.slot, 'Занято').first()).toBeDisabled();
});

test('T26 keeps past calendar navigation disabled', async ({ page, api }) => {
  await openBookingPageForFirstAvailableSlot(page, api);

  await expect(page.locator('button[data-direction="previous"]')).toBeDisabled();
});

test('T27 renders booked slots as disabled', async ({ page, api }) => {
  const lookup = await api.bookFirstAvailableSlot({
    durationMinutes: 15,
    guestName: 'Занятый Слот',
    guestEmail: 'busy@example.com',
  });

  await page.goto(`/book/${lookup.eventType.id}`);
  await selectCalendarDate(page, lookup.date);

  await expect(getSlotStatusButton(page, lookup.slot, 'Занято')).toBeDisabled();
});

test('T28 shows empty state when event types list is empty', async ({ page, api }) => {
  await api.cancelAllBookings();
  await api.deleteAllEventTypes();

  await page.goto('/book');

  await expect(page.getByText('Нет доступных типов событий')).toBeVisible();
});
