import type { ApiClient, EventType, Slot, Booking, AvailabilityPeriod, CreateEventTypeRequest, CreateBookingRequest, CreateAvailabilityRequest } from './types';

const BASE_URL = '/api';

export const apiClient: ApiClient = {
  eventTypes: {
    create: async (body: CreateEventTypeRequest): Promise<EventType> => {
      const response = await fetch(`${BASE_URL}/event-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to create event type');
      return response.json();
    },
    list: async (): Promise<EventType[]> => {
      const response = await fetch(`${BASE_URL}/event-types`);
      if (!response.ok) throw new Error('Failed to fetch event types');
      return response.json();
    },
  },
  slots: {
    list: async ({ eventTypeId, start, end }: { eventTypeId: string; start?: string; end?: string }): Promise<Slot[]> => {
      const params = new URLSearchParams({ eventTypeId });
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      const response = await fetch(`${BASE_URL}/slots?${params}`);
      if (!response.ok) throw new Error('Failed to fetch slots');
      return response.json();
    },
  },
  bookings: {
    create: async (body: CreateBookingRequest): Promise<Booking> => {
      const response = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to create booking');
      return response.json();
    },
    list: async ({ start, end }: { start?: string; end?: string } = {}): Promise<Booking[]> => {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      const response = await fetch(`${BASE_URL}/bookings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
  },
  availability: {
    create: async (body: CreateAvailabilityRequest): Promise<AvailabilityPeriod> => {
      const response = await fetch(`${BASE_URL}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to create availability');
      return response.json();
    },
    list: async ({ eventTypeId }: { eventTypeId: string }): Promise<AvailabilityPeriod[]> => {
      const response = await fetch(`${BASE_URL}/availability?eventTypeId=${eventTypeId}`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    },
  },
};
