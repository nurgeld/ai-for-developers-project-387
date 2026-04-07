import { test, expect } from '../fixtures/test-setup';
import { formatBookingCardTime } from '../fixtures/test-setup';

test.beforeEach(async ({ api }) => {
  await api.resetAppState();
});

test('T13 shows bookings tab content by default', async ({ page, api }) => {
  const lookup = await api.bookFirstAvailableSlot({
    guestName: 'Тест Пользователь',
    guestEmail: 'test@example.com',
  });

  await page.goto('/admin');

  await expect(page.getByRole('tab', { name: 'Бронирования' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(lookup.booking.guestName)).toBeVisible();
  await expect(page.getByText(lookup.booking.guestEmail)).toBeVisible();
  await expect(page.getByText(formatBookingCardTime(lookup.slot))).toBeVisible();
  await expect(page.getByText(lookup.booking.eventTypeName)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отменить' })).toBeVisible();
});

test('T14 cancels a booking from admin', async ({ page, api }) => {
  const lookup = await api.bookFirstAvailableSlot({
    guestName: 'Тест Пользователь',
    guestEmail: 'test@example.com',
  });

  await page.goto('/admin');

  await page.getByRole('button', { name: 'Отменить' }).click();

  await expect(page.getByText(lookup.booking.guestName)).toHaveCount(0);
  await expect(page.getByText('Нет предстоящих событий')).toBeVisible();
});

test('T15 shows empty bookings state when there are no bookings', async ({ page }) => {
  await page.goto('/admin');

  await expect(page.getByRole('tab', { name: 'Бронирования' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Нет предстоящих событий')).toBeVisible();
});
