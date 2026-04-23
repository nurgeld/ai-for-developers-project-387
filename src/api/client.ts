import type {
  EventType,
  Slot,
  Booking,
  OwnerSettings,
  CreateBookingRequest,
  CreateEventTypeRequest,
  UpdateEventTypeRequest,
  UpdateOwnerSettingsRequest,
} from './types';

const BASE = '/api';
const OWNER_API_TOKEN = import.meta.env.VITE_OWNER_API_TOKEN?.trim();

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  path: string,
  options?: {
    method?: string;
    params?: Record<string, string | undefined>;
    body?: unknown;
    headers?: Record<string, string>;
  },
): Promise<T> {
  const { method = 'GET', params, body, headers } = options ?? {};

  let url = `${BASE}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, value);
      }
    }
    const qs = searchParams.toString();
    if (qs) url = `${url}?${qs}`;
  }

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let errorData: unknown = null;
    try {
      errorData = await response.json();
    } catch {
      // not JSON
    }
    const message =
      (errorData as { message?: string })?.message ?? `HTTP ${response.status}`;
    throw new ApiError(message, response.status, errorData);
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

// ==================== Public API ====================

export function getSettings(): Promise<OwnerSettings> {
  return request('/settings');
}

export function listEventTypes(): Promise<EventType[]> {
  return request('/event-types');
}

export interface ListSlotsParams {
  eventTypeId: string;
  startDate: string;
  endDate: string;
}

export function listSlots(params: ListSlotsParams): Promise<Slot[]> {
  return request('/slots', {
    params: {
      eventTypeId: params.eventTypeId,
      startDate: params.startDate,
      endDate: params.endDate,
    },
  });
}

export function createBooking(body: CreateBookingRequest): Promise<Booking> {
  return request('/bookings', { method: 'POST', body });
}

// ==================== Owner API ====================

export function updateSettings(
  body: UpdateOwnerSettingsRequest,
): Promise<OwnerSettings> {
  return request('/owner/settings', {
    method: 'PATCH',
    body,
    headers: getOwnerAuthHeaders(),
  });
}

export function createEventType(
  body: CreateEventTypeRequest,
): Promise<EventType> {
  return request('/owner/event-types', {
    method: 'POST',
    body,
    headers: getOwnerAuthHeaders(),
  });
}

export function updateEventType(
  id: string,
  body: UpdateEventTypeRequest,
): Promise<EventType> {
  return request(`/owner/event-types/${id}`, {
    method: 'PATCH',
    body,
    headers: getOwnerAuthHeaders(),
  });
}

export function deleteEventType(id: string): Promise<void> {
  return request(`/owner/event-types/${id}`, {
    method: 'DELETE',
    headers: getOwnerAuthHeaders(),
  });
}

export interface ListBookingsParams {
  eventTypeId?: string;
  startDate?: string;
  endDate?: string;
}

export function listBookings(params?: ListBookingsParams): Promise<Booking[]> {
  return request('/owner/bookings', {
    params: params
      ? {
          eventTypeId: params.eventTypeId,
          startDate: params.startDate,
          endDate: params.endDate,
        }
      : undefined,
    headers: getOwnerAuthHeaders(),
  });
}

export function cancelBooking(id: string): Promise<void> {
  return request(`/owner/bookings/${id}`, {
    method: 'DELETE',
    headers: getOwnerAuthHeaders(),
  });
}

function getOwnerAuthHeaders(): Record<string, string> {
  if (!OWNER_API_TOKEN) {
    return {};
  }

  return {
    Authorization: `Bearer ${OWNER_API_TOKEN}`,
  };
}
