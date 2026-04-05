import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;

/**
 * # Calendar Booking API v2.0.0
 *
 * Сервис бронирования времени для звонков. Слоты длительностью 15 или 30 минут 
 * в зависимости от выбранного типа события.
 */
@service(#{ title: "Calendar Booking API" })
namespace CalendarAPI;

// ==================== Models ====================

/**
 * Тип события — определяет длительность встречи (15 или 30 минут)
 */
model EventType {
  id: string;
  /** Название типа события (например, "Встреча 15 минут", "Встреча 30 минут") */
  name: string;
  /** Описание типа события */
  description: string;
  /** Длительность в минутах — только 15 или 30 */
  durationMinutes: 15 | 30;
}

/**
 * Настройки владельца календаря (профиль и часы работы).
 * Владелец один и предзадан. В API возвращается без id, маршрут всегда /api/settings.
 * Дефолтные значения: workDayStart="09:00", workDayEnd="18:00".
 */
model OwnerSettings {
  /** Имя владельца (отображается гостям) */
  name: string;
  /** URL аватара владельца */
  avatarUrl?: string;
  /** Начало рабочего дня. Формат: HH:mm, 24-часовой, например "09:00" */
  workDayStart: string;
  /** Конец рабочего дня. Формат: HH:mm, 24-часовой, например "18:00" */
  workDayEnd: string;
}

/**
 * Слот для бронирования — временное окно для конкретного типа события
 */
model Slot {
  /** Начало слота */
  startAt: utcDateTime;
  /** Конец слота (startAt + EventType.durationMinutes) */
  endAt: utcDateTime;
  /** 
   * Занят ли слот любым бронированием.
   * Только факт занятости. В PublicAPI данные о госте не возвращаются никогда.
   */
  isBooked: boolean;
}

/**
 * Бронирование — запись гостя на выбранный слот
 */
model Booking {
  id: string;
  /** 
   * ID типа события. 
   * Может ссылаться на удалённый тип (orphan booking после DELETE /api/event-types/{id}).
   */
  eventTypeId: string;
  /** Название типа события. Сохраняется на момент создания (snapshot). */
  eventTypeName: string;
  /** Имя гостя */
  guestName: string;
  /** Email гостя */
  guestEmail: string;
  /** Начало бронирования */
  startAt: utcDateTime;
  /** Конец бронирования */
  endAt: utcDateTime;
  /** Дата создания бронирования */
  createdAt: utcDateTime;
}

// ==================== Request Models ====================

/**
 * Запрос на создание бронирования
 *
 * **Валидация startAt:**
 * - Для типа 15 минут: время должно быть кратно 15 минутам (XX:00, XX:15, XX:30, XX:45)
 * - Для типа 30 минут: время должно быть кратно 30 минутам (XX:00, XX:30)
 * - Время должно быть в рамках OwnerSettings.workDayStart - workDayEnd
 */
model CreateBookingRequest {
  /** ID выбранного типа события */
  eventTypeId: string;
  /** Имя гостя */
  guestName: string;
  /** Email гостя */
  guestEmail: string;
  /** Начало выбранного слота (строго кратно durationMinutes типа) */
  startAt: utcDateTime;
}

/**
 * Запрос на создание типа события
 *
 * **Ограничение:** нельзя создать более одного типа с duration=15
 * и более одного типа с duration=30.
 */
model CreateEventTypeRequest {
  name: string;
  description: string;
  /** Длительность — только 15 или 30 минут */
  durationMinutes: 15 | 30;
}

/**
 * Запрос на обновление типа события (частичное обновление).
 * Длительность изменить нельзя — только name и description.
 */
model UpdateEventTypeRequest {
  name?: string;
  description?: string;
}

/**
 * Запрос на обновление настроек владельца
 */
model UpdateOwnerSettingsRequest {
  name?: string;
  avatarUrl?: string;
  workDayStart?: string;
  workDayEnd?: string;
}

/**
 * Запрос на получение слотов
 */
model ListSlotsRequest {
  /** ID типа события (определяет шаг сетки слотов) */
  @query eventTypeId: string;
  /** Начало периода. Формат: YYYY-MM-DD, например 2026-03-01 */
  @query startDate: plainDate;
  /** Конец периода (дата, включительно). Формат: YYYY-MM-DD, например 2026-03-31 */
  @query endDate: plainDate;
}

/**
 * Запрос на получение бронирований
 */
model ListBookingsRequest {
  /** Фильтр по типу события */
  @query eventTypeId?: string;
  /** Фильтр: бронирования с этой даты. Формат: YYYY-MM-DD */
  @query startDate?: plainDate;
  /** Фильтр: бронирования до этой даты включительно. Формат: YYYY-MM-DD */
  @query endDate?: plainDate;
}

// ==================== Error Models ====================

/**
 * Ошибка: слот уже занят (пересечение с существующим бронированием)
 */
@error
model ConflictError {
  @statusCode _: 409;
  error: "SLOT_ALREADY_BOOKED";
  message: "Выбранный слот уже занят. Пожалуйста, выберите другое время.";
}

/**
 * Ошибка: недопустимое время слота (не кратно durationMinutes или вне рабочих часов)
 */
@error
model InvalidSlotTimeError {
  @statusCode _: 400;
  error: "INVALID_SLOT_TIME";
  message: "Недопустимое время начала слота. Время должно соответствовать сетке и быть в рамках рабочих часов.";
}

/**
 * Ошибка: тип события с такой длительностью уже существует
 */
@error
model DuplicateDurationError {
  @statusCode _: 409;
  error: "DUPLICATE_DURATION";
  message: "Тип события с такой длительностью уже существует. Разрешено только по одному типу для 15 и 30 минут.";
}

/**
 * Ошибка валидации
 */
@error
model ValidationError {
  @statusCode _: 400;
  error: "VALIDATION_ERROR";
  message: string;
  details?: string[];
}

/**
 * Ошибка: ресурс не найден
 */
@error
model NotFoundError {
  @statusCode _: 404;
  error: "NOT_FOUND";
  message: string;
}

// ==================== API Endpoints ====================

/**
 * Публичные эндпоинты — поток гостя:
 * 1. GET /api/settings — профиль владельца (имя, аватар)
 * 2. GET /api/event-types — список типов событий
 * 3. GET /api/slots?eventTypeId=...&startDate=2026-03-01&endDate=2026-03-31 — слоты на месяц (счётчики)
 * 4. GET /api/slots?eventTypeId=...&startDate=2026-03-28&endDate=2026-03-28 — слоты на выбранный день
 * 5. POST /api/bookings — создание бронирования
 */
@route("/api")
interface PublicAPI {
  /**
   * Получить настройки владельца (профиль, аватар, часы работы)
   */
  @route("/settings")
  @tag("Public")
  @get
  getSettings(): OwnerSettings;

  /**
   * Получить список доступных типов событий
   */
  @route("/event-types")
  @tag("Public")
  @get
  listEventTypes(): EventType[];

  /**
   * Получить слоты за период для выбранного типа события
   *
   * Возвращает только будущие слоты (startAt > now()).
   *
   * Используется дважды:
   * - С диапазоном на весь видимый месяц (например, 2026-03-01..2026-03-31) — для отображения 
   *   счётчика свободных слотов под каждым днём календаря
   * - С диапазоном на один день (например, 2026-03-28..2026-03-28) — для отображения 
   *   списка слотов справа
   */
  @route("/slots")
  @tag("Public")
  @get
  listSlots(...ListSlotsRequest): Slot[] | ValidationError;

  /**
   * Создать бронирование
   *
   * **Валидация:**
   * - startAt должен соответствовать сетке слотов (кратен durationMinutes)
   * - Время должно быть в рамках OwnerSettings.workDayStart - workDayEnd
   * - Не должно быть пересечений с существующими бронированиями (409 Conflict)
   *
   * **Правило занятости:**
   * На одно и то же время нельзя создать два бронирования — даже если они
   * относятся к разным типам событий.
   */
  @route("/bookings")
  @tag("Public")
  @post
  createBooking(@body body: CreateBookingRequest):
    | Booking
    | ConflictError
    | InvalidSlotTimeError
    | NotFoundError
    | ValidationError;
}

/**
 * Эндпоинты для владельца — управление настройками, типами событий и бронированиями.
 * Префикс /api/owner отделяет административные запросы от публичных.
 */
@route("/api/owner")
interface OwnerAPI {
  /**
   * Обновить настройки владельца (частичное обновление)
   */
  @route("/settings")
  @tag("Owner")
  @patch
  updateSettings(@body body: UpdateOwnerSettingsRequest): OwnerSettings | ValidationError;

  /**
   * Создать тип события
   *
   * **Ограничение:** нельзя создать более одного типа с duration=15
   * и более одного типа с duration=30.
   *
   * **Сид данных:** при первом запуске автоматически создаются:
   * - "Встреча 15 минут" (15 минут)
   * - "Встреча 30 минут" (30 минут)
   */
  @route("/event-types")
  @tag("Owner")
  @post
  createEventType(@body body: CreateEventTypeRequest):
    | EventType
    | DuplicateDurationError
    | ValidationError;

  /**
   * Обновить тип события (частичное обновление).
   * Длительность изменить нельзя после создания.
   */
  @route("/event-types/{id}")
  @tag("Owner")
  @patch
  updateEventType(@path id: string, @body body: UpdateEventTypeRequest):
    | EventType
    | NotFoundError
    | ValidationError;

  /**
   * Удалить тип события. Возвращает 204 No Content при успехе.
   *
   * **Примечание:** существующие бронирования этого типа остаются в системе
   * (orphan bookings), но новые бронирования этого типа станут невозможны.
   */
  @route("/event-types/{id}")
  @tag("Owner")
  @delete
  deleteEventType(@path id: string): { @statusCode _: 204; } | NotFoundError;

  /**
   * Получить список бронирований (с фильтрами).
   *
   * Без фильтров: возвращаются бронирования за сегодня и будущие (startAt >= startOfToday),
   * отсортированные по startAt ASC.
   *
   * Возвращает все бронирования, включая orphan (с удалёнными типами событий).
   */
  @route("/bookings")
  @tag("Owner")
  @get
  listBookings(...ListBookingsRequest): Booking[] | ValidationError;

  /**
   * Отменить бронирование. Возвращает 204 No Content при успехе.
   */
  @route("/bookings/{id}")
  @tag("Owner")
  @delete
  cancelBooking(@path id: string): { @statusCode _: 204; } | NotFoundError;
}
