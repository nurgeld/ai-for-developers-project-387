import {
  expect,
  test as base,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import baseDayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import 'dayjs/locale/ru.js';

baseDayjs.extend(utc);
baseDayjs.locale('ru');

const dayjs = baseDayjs;

export type DurationMinutes = 15 | 30;

export interface OwnerSettings {
  name: string;
  avatarUrl: string | null;
  workDayStart: string;
  workDayEnd: string;
}

export interface EventType {
  id: string;
  name: string;
  description: string;
  durationMinutes: DurationMinutes;
}

export interface Slot {
  startAt: string;
  endAt: string;
  isBooked: boolean;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  guestName: string;
  guestEmail: string;
  startAt: string;
  endAt: string;
  createdAt: string;
}

interface ErrorPayload {
  error?: string;
  message?: string;
  details?: string[];
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  params?: Record<string, string | undefined>;
  data?: unknown;
  ownerAuth?: boolean;
}

export interface SlotLookupResult {
  date: string;
  eventType: EventType;
  slot: Slot;
}

export interface TestApi {
  getSettings(): Promise<OwnerSettings>;
  updateSettingsViaAPI(data: Partial<OwnerSettings>): Promise<OwnerSettings>;
  getEventTypes(): Promise<EventType[]>;
  createEventTypeViaAPI(data: Omit<EventType, 'id'>): Promise<EventType>;
  updateEventTypeViaAPI(id: string, data: Partial<Pick<EventType, 'name' | 'description'>>): Promise<EventType>;
  deleteEventTypeViaAPI(id: string): Promise<void>;
  deleteAllEventTypes(): Promise<void>;
  listSlots(params: { eventTypeId: string; startDate: string; endDate: string }): Promise<Slot[]>;
  getBookings(): Promise<Booking[]>;
  createBookingViaAPI(data: { eventTypeId: string; guestName: string; guestEmail: string; startAt: string }): Promise<Booking>;
  cancelBookingViaAPI(id: string): Promise<void>;
  cancelAllBookings(): Promise<void>;
  ensureDefaultEventTypes(): Promise<EventType[]>;
  resetAppState(): Promise<void>;
  findAvailableSlot(options?: { durationMinutes?: DurationMinutes; daysAhead?: number }): Promise<SlotLookupResult>;
  bookFirstAvailableSlot(options?: { durationMinutes?: DurationMinutes; guestName?: string; guestEmail?: string }): Promise<SlotLookupResult & { booking: Booking }>;
}

const DEFAULT_OWNER_SETTINGS: OwnerSettings = {
  name: 'Tota',
  avatarUrl: null,
  workDayStart: '09:00',
  workDayEnd: '18:00',
};

const DEFAULT_EVENT_TYPES: Array<Omit<EventType, 'id'>> = [
  {
    name: 'Встреча 15 минут',
    description: 'Короткая встреча для быстрого обсуждения',
    durationMinutes: 15,
  },
  {
    name: 'Встреча 30 минут',
    description: 'Стандартная встреча для детального обсуждения',
    durationMinutes: 30,
  },
];

const OWNER_API_TOKEN = process.env.OWNER_API_TOKEN ?? process.env.VITE_OWNER_API_TOKEN ?? 'dev-owner-token';

class TestApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'TestApiError';
    this.status = status;
    this.data = data;
  }
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function buildUrl(apiBaseUrl: string, path: string, params?: Record<string, string | undefined>): string {
  const url = new URL(`${normalizeBaseUrl(apiBaseUrl)}${path}`);

  if (!params) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function parseResponseBody(response: Awaited<ReturnType<APIRequestContext['fetch']>>): Promise<unknown> {
  if (response.status() === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function apiRequest<T>(
  request: APIRequestContext,
  apiBaseUrl: string,
  path: string,
  options?: RequestOptions,
): Promise<T> {
  const response = await request.fetch(buildUrl(apiBaseUrl, path, options?.params), {
    method: options?.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options?.data !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options?.ownerAuth ? { Authorization: `Bearer ${OWNER_API_TOKEN}` } : {}),
    },
    data: options?.data,
    failOnStatusCode: false,
  });

  const data = await parseResponseBody(response);

  if (!response.ok()) {
    const payload = (data && typeof data === 'object' ? data : null) as ErrorPayload | null;
    throw new TestApiError(
      payload?.message ?? `HTTP ${response.status()}`,
      response.status(),
      data,
    );
  }

  return data as T;
}

function toDateString(value: string): string {
  return dayjs.utc(value).format('YYYY-MM-DD');
}

function createApiHelpers(request: APIRequestContext, apiBaseUrl: string): TestApi {
  return {
    async getSettings() {
      return apiRequest<OwnerSettings>(request, apiBaseUrl, '/settings');
    },

    async updateSettingsViaAPI(data) {
      return apiRequest<OwnerSettings>(request, apiBaseUrl, '/owner/settings', {
        method: 'PATCH',
        ownerAuth: true,
        data: {
          ...data,
          avatarUrl: data.avatarUrl ?? '',
        },
      });
    },

    async getEventTypes() {
      return apiRequest<EventType[]>(request, apiBaseUrl, '/event-types');
    },

    async createEventTypeViaAPI(data) {
      return apiRequest<EventType>(request, apiBaseUrl, '/owner/event-types', {
        method: 'POST',
        ownerAuth: true,
        data,
      });
    },

    async updateEventTypeViaAPI(id, data) {
      return apiRequest<EventType>(request, apiBaseUrl, `/owner/event-types/${id}`, {
        method: 'PATCH',
        ownerAuth: true,
        data,
      });
    },

    async deleteEventTypeViaAPI(id) {
      await apiRequest<void>(request, apiBaseUrl, `/owner/event-types/${id}`, {
        method: 'DELETE',
        ownerAuth: true,
      });
    },

    async deleteAllEventTypes() {
      const eventTypes = await this.getEventTypes();

      for (const eventType of eventTypes) {
        await this.deleteEventTypeViaAPI(eventType.id);
      }
    },

    async listSlots(params) {
      return apiRequest<Slot[]>(request, apiBaseUrl, '/slots', {
        params,
      });
    },

    async getBookings() {
      return apiRequest<Booking[]>(request, apiBaseUrl, '/owner/bookings', {
        ownerAuth: true,
      });
    },

    async createBookingViaAPI(data) {
      return apiRequest<Booking>(request, apiBaseUrl, '/bookings', {
        method: 'POST',
        data,
      });
    },

    async cancelBookingViaAPI(id) {
      await apiRequest<void>(request, apiBaseUrl, `/owner/bookings/${id}`, {
        method: 'DELETE',
        ownerAuth: true,
      });
    },

    async cancelAllBookings() {
      const bookings = await this.getBookings();

      for (const booking of bookings) {
        await this.cancelBookingViaAPI(booking.id);
      }
    },

    async ensureDefaultEventTypes() {
      const current = await this.getEventTypes();

      for (const template of DEFAULT_EVENT_TYPES) {
        const existing = current.find((eventType) => eventType.durationMinutes === template.durationMinutes);

        if (!existing) {
          await this.createEventTypeViaAPI(template);
          continue;
        }

        if (existing.name !== template.name || existing.description !== template.description) {
          await this.updateEventTypeViaAPI(existing.id, {
            name: template.name,
            description: template.description,
          });
        }
      }

      return this.getEventTypes();
    },

    async resetAppState() {
      await this.cancelAllBookings();
      await this.ensureDefaultEventTypes();
      await this.updateSettingsViaAPI(DEFAULT_OWNER_SETTINGS);
    },

    async findAvailableSlot(options) {
      const duration = options?.durationMinutes ?? 15;
      const daysAhead = options?.daysAhead ?? 14;
      const eventType = (await this.getEventTypes()).find((item) => item.durationMinutes === duration);

      if (!eventType) {
        throw new Error(`Event type with duration ${duration} was not found`);
      }

      for (let dayOffset = 0; dayOffset <= daysAhead; dayOffset += 1) {
        const date = dayjs().add(dayOffset, 'day').format('YYYY-MM-DD');
        const slots = await this.listSlots({
          eventTypeId: eventType.id,
          startDate: date,
          endDate: date,
        });
        const slot = slots.find((candidate) => !candidate.isBooked);

        if (slot) {
          return { date, eventType, slot };
        }
      }

      throw new Error(`No free slot found for ${duration}-minute event type`);
    },

    async bookFirstAvailableSlot(options) {
      const lookup = await this.findAvailableSlot({
        durationMinutes: options?.durationMinutes,
      });
      const booking = await this.createBookingViaAPI({
        eventTypeId: lookup.eventType.id,
        guestName: options?.guestName ?? 'Тест Пользователь',
        guestEmail: options?.guestEmail ?? 'test@example.com',
        startAt: lookup.slot.startAt,
      });

      return {
        ...lookup,
        booking,
      };
    },
  };
}

export function formatSlotRange(slot: Pick<Slot, 'startAt' | 'endAt'>): string {
  return `${dayjs.utc(slot.startAt).format('HH:mm')} - ${dayjs.utc(slot.endAt).format('HH:mm')}`;
}

// Use the same format as BookingCard.tsx: DD MMMM YYYY, HH:mm (e.g., "07 апреля 2026, 16:00")
export function formatBookingCardTime(slot: Pick<Slot, 'startAt'>): string {
  return dayjs.utc(slot.startAt).format('D MMMM YYYY, HH:mm');
}

export function formatCalendarDayLabel(isoDate: string): string {
  return dayjs.utc(isoDate).format('D MMMM YYYY');
}

export function getSlotStatusButton(page: Page, slot: Pick<Slot, 'startAt' | 'endAt'>, status: 'Свободно' | 'Занято') {
  const start = dayjs.utc(slot.startAt).format('HH:mm');
  const end = dayjs.utc(slot.endAt).format('HH:mm');

  return page.getByRole('button', {
    name: new RegExp(`${start}\\s*-\\s*${end}\\s*${status}`),
  });
}

export function getCalendarDayButton(page: Page, isoDate: string) {
  return page.locator(
    `button[aria-label="${formatCalendarDayLabel(isoDate)}"]:not([data-outside]):not([data-hidden])`,
  );
}

export async function selectCalendarDate(page: Page, isoDate: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const dayButton = getCalendarDayButton(page, isoDate).first();

    if (await dayButton.count()) {
      await dayButton.click();
      return;
    }

    await page.locator('button[data-direction="next"]').click();
  }

  throw new Error(`Calendar day ${isoDate} was not found`);
}

type BrowserIssueFixtures = {
  api: TestApi;
};

export const test = base.extend<BrowserIssueFixtures>({
  page: async ({ page }, use) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const requestFailures: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    page.on('requestfailed', (request) => {
      const failure = request.failure();
      requestFailures.push(
        `${request.method()} ${request.url()} :: ${failure?.errorText ?? 'unknown error'}`,
      );
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);

    const expectedConsolePatterns = [
      'Failed to load resource',
      'the server responded with a status of 4',
    ];

    const unexpectedConsoleErrors = consoleErrors.filter((msg) =>
      !expectedConsolePatterns.some((pattern) => msg.includes(pattern)),
    );

    const expectedRequestPatterns = [
      'net::ERR_ABORTED',
    ];

    const unexpectedRequestFailures = requestFailures.filter((msg) =>
      !expectedRequestPatterns.some((pattern) => msg.includes(pattern)),
    );

    expect.soft(unexpectedConsoleErrors, 'Unexpected browser console errors').toEqual([]);
    expect.soft(pageErrors, 'Unexpected uncaught browser errors').toEqual([]);
    expect.soft(unexpectedRequestFailures, 'Unexpected failed network requests').toEqual([]);
  },

  api: async ({ request }, use, testInfo) => {
    const apiBaseUrl = String(testInfo.config.metadata.apiURL ?? 'http://127.0.0.1:8000/api');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(createApiHelpers(request, apiBaseUrl));
  },
});

export { expect };
export { DEFAULT_EVENT_TYPES, DEFAULT_OWNER_SETTINGS, TestApiError, toDateString };
