export interface EventType {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
}

export interface Slot {
  id: string;
  eventTypeId: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  startAt: string;
  endAt: string;
  guestName: string;
  guestEmail: string;
  createdAt: string;
}

export interface AvailabilityPeriod {
  id: string;
  eventTypeId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CreateEventTypeRequest {
  title: string;
  description: string;
  durationMinutes: number;
}

export interface CreateBookingRequest {
  eventTypeId: string;
  startAt: string;
  guestName: string;
  guestEmail: string;
}

export interface CreateAvailabilityRequest {
  eventTypeId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export type EventTypesClient = {
  create: (body: CreateEventTypeRequest) => Promise<EventType>;
  list: () => Promise<EventType[]>;
};

export type SlotsClient = {
  list: (params: { eventTypeId: string; start?: string; end?: string }) => Promise<Slot[]>;
};

export type BookingsClient = {
  create: (body: CreateBookingRequest) => Promise<Booking>;
  list: (params?: { start?: string; end?: string }) => Promise<Booking[]>;
};

export type AvailabilityClient = {
  create: (body: CreateAvailabilityRequest) => Promise<AvailabilityPeriod>;
  list: (params: { eventTypeId: string }) => Promise<AvailabilityPeriod[]>;
};

export interface ApiClient {
  eventTypes: EventTypesClient;
  slots: SlotsClient;
  bookings: BookingsClient;
  availability: AvailabilityClient;
}
