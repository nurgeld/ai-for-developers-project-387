import { tool } from "@opencode-ai/plugin";

type DurationMinutes = 15 | 30;

interface LogEntry {
  step: string;
  status: number;
  data: unknown;
  note?: string;
}

interface OwnerSettings {
  name: string;
  avatarUrl?: string | null;
  workDayStart: string;
  workDayEnd: string;
}

interface EventType {
  id: string;
  name: string;
  description: string;
  durationMinutes: DurationMinutes;
}

interface Slot {
  startAt: string;
  endAt: string;
  isBooked: boolean;
}

interface Booking {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  guestName: string;
  guestEmail: string;
  startAt: string;
  endAt: string;
  createdAt: string;
}

interface ApiResult<T> {
  status: number;
  data: T | null;
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
}

interface PresetEventType {
  name: string;
  description: string;
  durationMinutes: DurationMinutes;
}

const PRESET_EVENT_TYPES: PresetEventType[] = [
  {
    name: "Знакомство",
    description: "Звонок ознакомительный",
    durationMinutes: 15,
  },
  {
    name: "Консультация",
    description: "Полноценная консультация",
    durationMinutes: 30,
  },
];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

function parseTime(time: string): { hour: number; minute: number } | null {
  const [h, m] = time.split(":").map((value) => Number(value));
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return null;
  }
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return { hour: h, minute: m };
}

function formatDateTime(date: string, time: string): string {
  const parsed = parseTime(time);
  if (!parsed) {
    return `${date}T09:00:00`;
  }
  return `${date}T${pad2(parsed.hour)}:${pad2(parsed.minute)}:00`;
}

function addMinutes(time: string, addMin: number): string {
  const parsed = parseTime(time);
  if (!parsed) {
    return "09:00";
  }

  const total = parsed.hour * 60 + parsed.minute + addMin;
  const normalized = Math.max(0, total);
  const hour = Math.floor((normalized % (24 * 60)) / 60);
  const minute = normalized % 60;
  return `${pad2(hour)}:${pad2(minute)}`;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function errorCode(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    return (data as ApiErrorPayload).error;
  }
  return undefined;
}

function isSuccess(status: number): boolean {
  return status === 200 || status === 201;
}

export default tool({
  description:
    "Seed test data: owner settings, event types, and one test booking for today.",

  args: {
    baseUrl: tool.schema.string().describe(
      "Base URL of running Calendar API, for example http://localhost:8000",
    ),
    ownerName: tool.schema
      .string()
      .optional()
      .describe("Owner display name for /api/owner/settings"),
    force: tool.schema
      .boolean()
      .optional()
      .describe("If true, ignore duplicate-duration conflicts and continue"),
    bookingGuestName: tool.schema
      .string()
      .optional()
      .describe("Name for test booking"),
    bookingGuestEmail: tool.schema
      .string()
      .optional()
      .describe("Email for test booking"),
    bookingDurationMinutes: tool.schema
      .number()
      .optional()
      .describe("Preferred duration for test booking: 15 or 30"),
    ensureBookingForToday: tool.schema
      .boolean()
      .optional()
      .describe("Create one test booking for the current date"),
  },

  async execute({
    baseUrl,
    ownerName = "Владелец",
    force = true,
    bookingGuestName = "Тестовый пользователь",
    bookingGuestEmail = "test@example.com",
    bookingDurationMinutes = 15,
    ensureBookingForToday = true,
  }) {
    const base = baseUrl.replace(/\/+$/, "");
    const log: LogEntry[] = [];

    const request = async <T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> => {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (response.status === 204) {
        return { status: response.status, data: null };
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        return { status: response.status, data: null };
      }

      const text = await response.text();
      let data: unknown = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      return { status: response.status, data: data as T };
    };

    const record = (step: string, status: number, data: unknown, note?: string) => {
      const entry: LogEntry = { step, status, data };
      if (note) {
        entry.note = note;
      }
      log.push(entry);
      return entry;
    };

    const fail = (message: string) => {
      return JSON.stringify(
        {
          success: false,
          summary: message,
          log,
          scheduleLimitation:
            "Owner API не хранит расписание по дням недели (только одно глобальное workDayStart/workDayEnd). " +
            "В скрипте установлено 09:00-19:00 для покрытия демонстрационного сценария.",
        },
        null,
        2,
      );
    };

    // 1) owner settings
    const settingsResp = await request<OwnerSettings>("PATCH", "/api/owner/settings", {
      name: ownerName,
      workDayStart: "09:00",
      workDayEnd: "19:00",
    });
    record("updateOwnerSettings", settingsResp.status, settingsResp.data);

    if (!isSuccess(settingsResp.status) || !settingsResp.data) {
      return fail("Не удалось обновить настройки владельца");
    }

    const settings = settingsResp.data;
    const desiredDuration = bookingDurationMinutes === 30 ? 30 : 15;

    // 2) get current event types (seed data is present in backend storage)
    const listResp = await request<EventType[]>("GET", "/api/event-types");
    record("listEventTypes", listResp.status, listResp.data);

    if (!isSuccess(listResp.status) || !Array.isArray(listResp.data)) {
      return fail("Не удалось прочитать существующие типы событий");
    }

    let eventTypes = listResp.data;

    // 3) create/update event types by duration (prevents DUPLICATE_DURATION failures)
    for (const preset of PRESET_EVENT_TYPES) {
      const existing = eventTypes.find((type) => type.durationMinutes === preset.durationMinutes);

      if (existing) {
        const shouldPatch =
          existing.name !== preset.name || existing.description !== preset.description;

        if (!force || !shouldPatch) {
          record(
            `upsertEventType:${preset.durationMinutes}`,
            200,
            existing,
            shouldPatch
              ? "Пропущено (force=false): тип с такой длительностью уже есть"
              : "Тип уже существует и совпадает с целевым",
          );
          continue;
        }

        const patchResp = await request<EventType>(
          "PATCH",
          `/api/owner/event-types/${existing.id}`,
          {
            name: preset.name,
            description: preset.description,
          },
        );

        record(`patchEventType:${preset.durationMinutes}`, patchResp.status, patchResp.data);

        if (!isSuccess(patchResp.status)) {
          return fail(`Не удалось обновить тип «${preset.name}»`);
        }

        continue;
      }

      const createResp = await request<EventType>("POST", "/api/owner/event-types", preset);
      record(`createEventType:${preset.durationMinutes}`, createResp.status, createResp.data);

      if (
        !isSuccess(createResp.status) &&
        !(force && errorCode(createResp.data) === "DUPLICATE_DURATION")
      ) {
        return fail(`Не удалось создать тип «${preset.name}»`);
      }
    }

    // 4) refresh event types after updates/creates
    const refreshedResp = await request<EventType[]>("GET", "/api/event-types");
    record("listEventTypesRefreshed", refreshedResp.status, refreshedResp.data);

    if (!isSuccess(refreshedResp.status) || !Array.isArray(refreshedResp.data)) {
      return fail("Не удалось перечитать типы после обновления");
    }

    eventTypes = refreshedResp.data;
    const bookingType = eventTypes.find((type) => type.durationMinutes === desiredDuration)
      || eventTypes[0];

    if (!bookingType) {
      return fail("Не найдено ни одного типа события после создания тестовых");
    }

    let booking: Booking | null = null;

    if (ensureBookingForToday) {
      const today = formatDate(new Date());

      const slotsResp = await request<Slot[]>(
        "GET",
        `/api/slots?eventTypeId=${encodeURIComponent(
          bookingType.id,
        )}&startDate=${today}&endDate=${today}`,
      );
      record("listSlotsToday", slotsResp.status, slotsResp.data);

      if (!isSuccess(slotsResp.status) || !Array.isArray(slotsResp.data)) {
        return fail("Не удалось загрузить слоты на текущий день");
      }

      const freeSlots = slotsResp.data.filter((slot) => !slot.isBooked).map((slot) => slot.startAt);
      const fallbackSlots = [
        formatDateTime(today, settings.workDayStart),
        formatDateTime(today, addMinutes(settings.workDayStart, bookingType.durationMinutes)),
      ];
      const candidateStarts = unique([...freeSlots, ...fallbackSlots]);

      for (const startAt of candidateStarts) {
        const bookingResp = await request<Booking>("POST", "/api/bookings", {
          eventTypeId: bookingType.id,
          guestName: bookingGuestName,
          guestEmail: bookingGuestEmail,
          startAt,
        });

        record("createTestBooking", bookingResp.status, bookingResp.data);

        if (isSuccess(bookingResp.status) && bookingResp.data) {
          booking = bookingResp.data;
          break;
        }

        if (errorCode(bookingResp.data) === "SLOT_ALREADY_BOOKED" && force) {
          continue;
        }

        return fail(
          `Не удалось создать тестовую бронь: ${
            (bookingResp.data as ApiErrorPayload | null)?.message ?? "ошибка API"
          }`,
        );
      }

      if (!booking) {
        if (force) {
          return fail(
            "Не удалось создать тестовую бронь на текущий день (все кандидаты были заняты)",
          );
        }
        return fail("Не удалось создать тестовую бронь на текущий день");
      }
    }

    return JSON.stringify(
      {
        success: true,
        summary: ensureBookingForToday
          ? "Тестовые данные загружены, создана тестовая бронь на текущий день."
          : "Тестовые данные загружены (бронь не создана по параметру).",
        scheduleLimitation:
          "API хранит только глобальные workDayStart/workDayEnd, без почасовых ограничений по дням недели.",
        createdSettings: settings,
        eventTypes,
        testBooking: booking,
        log,
      },
      null,
      2,
    );
  },
});
