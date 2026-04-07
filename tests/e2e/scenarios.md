# E2E Test Scenarios — Calendar Booking App

> Integration tests covering end-to-end user journeys via Playwright.
> Each test is **atomic**, **independent**, and follows **Given-When-Then** structure.
> Tests are designed for automation with Playwright MCP and Chrome DevTools MCP.

---

## Selector Strategy

No `data-testid` attributes exist in the codebase. All selectors use:
- **Roles**: `getByRole('button', { name: '...' })`, `getByRole('textbox', { name: '...' })`
- **Text content**: `getByText('...')`, `getByRole('heading', { name: '...' })`
- **Labels**: `getByLabel('...')`
- **CSS (fallback)**: Mantine class selectors for DatePicker day cells

---

## Test Fixtures (API Helpers)

Each test that needs setup uses API helpers (not other tests) as prerequisites:

| Helper | Method | Purpose |
|--------|--------|---------|
| `seedEventTypes()` | `GET /api/event-types` | Ensure default 15/30 min types exist |
| `createBookingViaAPI(data)` | `POST /api/bookings` | Create a booking without UI |
| `cancelBookingViaAPI(id)` | `DELETE /api/owner/bookings/{id}` | Clean up a booking |
| `getEventTypes()` | `GET /api/event-types` | Read event types, return IDs |
| `getSettings()` | `GET /api/settings` | Read current owner settings |
| `updateSettingsViaAPI(data)` | `PATCH /api/owner/settings` | Set owner settings before test |

---

## Tests

### T01 — Landing page renders and navigates to booking

**Priority**: Critical
**File**: `specs/booking.spec.ts`

```
Given:  пользователь открывает страницу `/`
When:   страница загрузилась
Then:   виден заголовок "Calendar"
And:    видна кнопка "Записаться"
And:    виден раздел "Возможности" со списком из 3 пунктов
```

**Selectors**:
- `getByRole('heading', { name: 'Calendar', level: 1 })`
- `getByRole('button', { name: 'Записаться' })`
- `getByText('Возможности')`

**Chrome DevTools MCP checks**:
- No console errors
- No failed network requests

---

### T02 — Landing page "Записаться" navigates to event types

**Priority**: Critical
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на странице `/`
When:   нажимает кнопку "Записаться"
Then:   URL меняется на `/book`
And:    виден заголовок "Выберите тип события"
And:    виден OwnerProfile с именем владельца
And:    видны карточки типов событий (минимум 1)
```

**Selectors**:
- `getByRole('button', { name: 'Записаться' }).click()`
- `expect(page).toHaveURL(/\/book$/)`
- `getByRole('heading', { name: 'Выберите тип события', level: 2 })`

---

### T03 — Event types page shows cards and navigates to booking

**Priority**: Critical
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на странице `/book`
And:    seed data загружен (есть типы событий 15 и 30 мин)
When:   нажимает на карточку типа события (любую)
Then:   URL меняется на `/book/{eventTypeId}`
And:    виден заголовок "Запись на встречу"
And:    видны 3 колонки: "Выбрать дату", summary, "Выбрать время"
```

**Selectors**:
- `locator('.mantine-Card-root').first().click()` (first event type card)
- `expect(page).toHaveURL(/\/book\/.+/)`
- `getByRole('heading', { name: 'Запись на встречу', level: 2 })`
- `getByRole('heading', { name: 'Выбрать дату', level: 4 })`
- `getByRole('heading', { name: 'Выбрать время', level: 4 })`

---

### T04 — Calendar date selection loads available slots

**Priority**: High
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на странице `/book/{eventTypeId}`
When:   выбирает сегодняшнюю дату в календаре
Then:   в колонке "Статус слотов" появляются кнопки со временем
And:    каждая кнопка содержит текст "Свободно" или "Занято"
And:    кнопка "Продолжить" остаётся заблокированной (disabled)
```

**Selectors**:
- DatePicker day cell: click button containing today's day number (not disabled)
- `getByRole('button', { name: /Свободно/ })` — at least one visible
- `getByRole('button', { name: 'Продолжить' })` — check `disabled` attribute

**Playwright MCP note**: Mantine DatePicker renders day cells as `<button>` elements.
Select by finding a button containing the day number that is not `aria-disabled`.

---

### T05 — Slot selection enables "Продолжить"

**Priority**: High
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на странице `/book/{eventTypeId}`
And:    дата выбрана, слоты загружены
When:   нажимает на первый свободный слот ("Свободно")
Then:   кнопка "Продолжить" становится активной (не disabled)
And:    в summary отображается выбранное время в формате "HH:mm - HH:mm"
```

**Selectors**:
- `getByRole('button', { name: /Свободно/ }).first().click()`
- `getByRole('button', { name: 'Продолжить' })` — verify NOT disabled
- `getByText(/\d{2}:\d{2} - \d{2}:\d{2}/)` — in summary panel

---

### T06 — Booking form validates input

**Priority**: Medium
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на странице `/book/{eventTypeId}`
And:    дата и слот выбраны
When:   нажимает "Продолжить"
Then:   появляется форма с полями "Имя" и "Email"
And:    кнопка "Подтвердить" видна
```

**Selectors**:
- `getByRole('button', { name: 'Продолжить' }).click()`
- `getByRole('textbox', { name: 'Имя' })` — visible
- `getByRole('textbox', { name: 'Email' })` — visible
- `getByRole('button', { name: 'Подтвердить' })` — visible

---

### T07 — Booking form rejects invalid input

**Priority**: Medium
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на шаге формы бронирования
When:   вводит 1 символ в поле "Имя"
And:    вводит "abc" в поле "Email"
And:    пытается отправить форму (нажимает "Подтвердить")
Then:   видна ошибка "Минимум 2 символа" под полем "Имя"
And:    видна ошибка "Некорректный email" под полем "Email"
And:    booking НЕ создан (нет success-экрана)
```

**Selectors**:
- `getByRole('textbox', { name: 'Имя' }).fill('А')`
- `getByRole('textbox', { name: 'Email' }).fill('abc')`
- `getByRole('button', { name: 'Подтвердить' }).click()`
- `getByText('Минимум 2 символа')` — visible
- `getByText('Некорректный email')` — visible

---

### T08 — Booking form accepts valid input and shows success

**Priority**: Critical
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на шаге формы бронирования
And:    слот выбран и свободен
When:   вводит валидное имя (2+ символа) в поле "Имя"
And:    вводит валидный email в поле "Email"
And:    нажимает "Подтвердить"
Then:   виден текст "Бронь подтверждена!"
And:    видна кнопка "Забронировать еще"
```

**Selectors**:
- `getByRole('textbox', { name: 'Имя' }).fill('Тест Пользователь')`
- `getByRole('textbox', { name: 'Email' }).fill('test@example.com')`
- `getByRole('button', { name: 'Подтвердить' }).click()`
- `getByText('Бронь подтверждена. До встречи!')` — visible
- `getByRole('button', { name: 'Забронировать еще' })` — visible

**Chrome DevTools MCP checks**:
- Network tab: `POST /api/bookings` returns 201
- No console errors

---

### T09 — "Забронировать еще" returns to event types

**Priority**: Medium
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на экране успеха (после успешного бронирования)
When:   нажимает "Забронировать еще"
Then:   URL меняется на `/book`
And:    виден заголовок "Выберите тип события"
```

**Selectors**:
- `getByRole('button', { name: 'Забронировать еще' }).click()`
- `expect(page).toHaveURL(/\/book$/)`
- `getByRole('heading', { name: 'Выберите тип события', level: 2 })`

---

### T10 — "Назад" returns to event types from calendar

**Priority**: Medium
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на странице `/book/{eventTypeId}` (шаг календаря)
When:   нажимает "Назад"
Then:   URL меняется на `/book`
And:    виден заголовок "Выберите тип события"
```

**Selectors**:
- `getByRole('button', { name: 'Назад' }).click()`
- `expect(page).toHaveURL(/\/book$/)`

---

### T11 — "Изменить" returns to calendar from form

**Priority**: Medium
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на шаге формы бронирования
When:   нажимает "Изменить"
Then:   возвращается на шаг календаря (форма скрыта)
And:    видна кнопка "Продолжить"
And:    выбранный слот остаётся подсвечен
```

**Selectors**:
- `getByRole('button', { name: 'Изменить' }).click()`
- `getByRole('button', { name: 'Продолжить' })` — visible
- Form fields "Имя" / "Email" — NOT visible

---

### T12 — Slot conflict: slot taken by another user before confirmation

**Priority**: High
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на странице `/book/{eventTypeId}`
And:    выбрана дата и свободный слот
And:    пользователь перешёл на шаг формы
And:    заполнены валидные имя и email
When:   тот же слот бронируется через API (`POST /api/bookings`)
And:    пользователь нажимает "Подтвердить"
Then:   пользователь возвращается на шаг календаря
And:    видна ошибка "Выбранный слот уже занят. Выберите другое время."
And:    ранее выбранный слот отображается как "Занято" (disabled)
```

**Implementation notes** (deterministic, no race condition):
1. Выбрать дату и слот, перейти к форме, заполнить данные
2. **Синхронно** вызвать `POST /api/bookings` через API-хелпер с тем же слотом
3. Дождаться ответа API (201) — слот гарантированно занят
4. Нажать "Подтвердить" в UI
5. Проверить ошибку

**Chrome DevTools MCP checks**:
- Network tab: first `POST /api/bookings` (API helper) returns 201
- Network tab: second `POST /api/bookings` (UI submit) returns 409 `SLOT_ALREADY_BOOKED`

---

### T13 — Admin page shows bookings tab by default

**Priority**: High
**File**: `specs/admin-bookings.spec.ts`

```
Given:  через API создано бронирование (`POST /api/bookings`)
When:   пользователь открывает `/admin`
Then:   активна вкладка "Бронирования"
And:    видна карточка бронирования с именем гостя
And:    видна карточка с email гостя
And:    видна карточка со временем слота
And:    видна карточка с типом события
And:    видна кнопка "Отменить"
```

**Selectors**:
- `page.goto('/admin')`
- `getByRole('tab', { name: 'Бронирования' })` — active/selected
- `getByText('Тест Пользователь')` — guest name from API-created booking
- `getByRole('button', { name: 'Отменить' })` — visible

---

### T14 — Admin cancels a booking

**Priority**: High
**File**: `specs/admin-bookings.spec.ts`

```
Given:  через API создано бронирование
And:    пользователь на странице `/admin`
And:    видна карточка бронирования
When:   нажимает "Отменить" на карточке
Then:   карточка бронирования исчезает из списка
And:    виден текст "Нет предстоящих событий" (если других бронирований нет)
```

**Selectors**:
- `getByRole('button', { name: 'Отменить' }).click()`
- `expect(getByText('Тест Пользователь')).not.toBeVisible()`
- `getByText('Нет предстоящих событий')` — visible (if no other bookings)

**Chrome DevTools MCP checks**:
- Network tab: `DELETE /api/owner/bookings/{id}` returns 204

---

### T15 — Admin bookings list is empty when no bookings exist

**Priority**: Low
**File**: `specs/admin-bookings.spec.ts`

```
Given:  нет активных бронирований (все отменены через API)
When:   пользователь открывает `/admin`
Then:   активна вкладка "Бронирования"
And:    виден текст "Нет предстоящих событий"
```

---

### T16 — Admin updates owner settings

**Priority**: Medium
**File**: `specs/admin-settings.spec.ts`

```
Given:  пользователь на странице `/admin`
When:   переключается на вкладку "Настройки"
And:    меняет имя в поле "Имя" на "Новое Имя"
And:    меняет "Начало рабочего дня" на "10:00"
And:    меняет "Конец рабочего дня" на "19:00"
And:    нажимает "Сохранить"
Then:   виден текст "Сохранено" (зелёный)
```

**Selectors**:
- `page.goto('/admin')`
- `getByRole('tab', { name: 'Настройки' }).click()`
- `getByRole('textbox', { name: 'Имя' }).fill('Новое Имя')`
- `getByRole('textbox', { name: 'Начало рабочего дня' }).fill('10:00')`
- `getByRole('textbox', { name: 'Конец рабочего дня' }).fill('19:00')`
- `getByRole('button', { name: 'Сохранить' }).click()`
- `getByText('Сохранено')` — visible, green color

---

### T17 — Admin settings persist after page reload

**Priority**: Medium
**File**: `specs/admin-settings.spec.ts`

```
Given:  настройки владельца обновлены (имя = "Новое Имя", часы = 10:00-19:00)
When:   пользователь перезагружает страницу `/admin`
And:    переключается на вкладку "Настройки"
Then:   поле "Имя" содержит "Новое Имя"
And:    поле "Начало рабочего дня" содержит "10:00"
And:    поле "Конец рабочего дня" содержит "19:00"
```

**Selectors**:
- `page.reload()`
- `getByRole('tab', { name: 'Настройки' }).click()`
- `getByRole('textbox', { name: 'Имя' })` — value is "Новое Имя"
- `getByRole('textbox', { name: 'Начало рабочего дня' })` — value is "10:00"
- `getByRole('textbox', { name: 'Конец рабочего дня' })` — value is "19:00"

---

### T18 — Admin settings form validates work hours format

**Priority**: Low
**File**: `specs/admin-settings.spec.ts`

```
Given:  пользователь на вкладке "Настройки" в форме настроек
When:   вводит "99:99" в поле "Начало рабочего дня"
And:    нажимает "Сохранить"
Then:   видна ошибка валидации (форма не отправлена)
```

---

### T19 — Admin creates a new event type

**Priority**: Medium
**File**: `specs/admin-event-types.spec.ts`

```
Given:  пользователь на вкладке "Настройки"
And:    секция "Типы событий" видна
When:   нажимает "Создать"
Then:   открывается модалка "Новый тип события"
And:    видны поля "Название", "Описание", "Длительность"
And:    видна кнопка "Создать" в модалке
```

**Selectors**:
- `getByRole('tab', { name: 'Настройки' }).click()`
- `getByText('Типы событий')` — visible
- `getByRole('button', { name: 'Создать' }).click()`
- `getByRole('heading', { name: 'Новый тип события', level: 2 })` — or modal title
- `getByRole('textbox', { name: 'Название' })` — visible
- `getByRole('textbox', { name: 'Описание' })` — visible
- `getByRole('combobox', { name: 'Длительность' })` — visible (Mantine Select)

---

### T20 — Admin successfully creates event type via modal

**Priority**: Medium
**File**: `specs/admin-event-types.spec.ts`

```
Given:  модалка "Новый тип события" открыта
When:   вводит "Тестовая встреча" в поле "Название"
And:    вводит "Описание тестовой встречи" в поле "Описание"
And:    выбирает "15 минут" в поле "Длительность"
And:    нажимает "Создать" в модалке
Then:   модалка закрывается
And:    в списке появляется "Тестовая встреча"
And:    видна длительность "15 мин"
```

**Selectors**:
- `getByRole('textbox', { name: 'Название' }).fill('Тестовая встреча')`
- `getByRole('textbox', { name: 'Описание' }).fill('Описание тестовой встречи')`
- Select duration: click combobox, then click option "15 минут"
- `getByRole('button', { name: 'Создать' }).click()` (inside modal)
- `getByText('Тестовая встреча')` — visible in list
- `getByText('15 мин')` — visible

---

### T21 — Admin edits an event type inline

**Priority**: Medium
**File**: `specs/admin-event-types.spec.ts`

```
Given:  в списке типов событий есть элемент с кнопкой "Изменить"
When:   нажимает "Изменить" на первом типе события
Then:   поля "Название" и "Описание" становятся редактируемыми
And:    видна кнопка "Сохранить"
And:    видна кнопка "Отмена"
```

**Selectors**:
- `getByRole('button', { name: 'Изменить' }).first().click()`
- `getByRole('textbox', { name: 'Название' })` — visible (edit mode)
- `getByRole('button', { name: 'Сохранить' })` — visible
- `getByRole('button', { name: 'Отмена' })` — visible

---

### T22 — Admin saves edited event type

**Priority**: Medium
**File**: `specs/admin-event-types.spec.ts`

```
Given:  тип события в режиме редактирования
When:   меняет название на "Обновлённое название"
And:    нажимает "Сохранить"
Then:   режим редактирования закрывается
And:    в списке видно "Обновлённое название"
```

---

### T23 — Admin deletes an event type

**Priority**: Medium
**File**: `specs/admin-event-types.spec.ts`

```
Given:  в списке типов событий есть хотя бы 2 элемента
When:   нажимает "Удалить" на последнем типе события
Then:   этот тип события исчезает из списка
```

**Note**: Удалять можно только если тип не последний (бэкенд требует минимум 1 тип).
Тест должен проверять наличие 2+ типов перед удалением.

---

### T24 — Admin cannot create event type with duplicate duration

**Priority**: Medium
**File**: `specs/admin-event-types.spec.ts`

```
Given:  уже существует тип события с длительностью 15 минут
And:    модалка "Новый тип события" открыта
When:   заполняет форму и выбирает "15 минут" в поле "Длительность"
And:    нажимает "Создать"
Then:   модалка НЕ закрывается
And:    видна ошибка (сообщение об ошибке от API)
```

**Chrome DevTools MCP checks**:
- Network tab: `POST /api/owner/event-types` returns 409 `DUPLICATE_DURATION`

---

### T25 — Header navigation works from all pages

**Priority**: Low
**File**: `specs/navigation.spec.ts`

```
Given:  пользователь на странице `/`
When:   нажимает "Управление" в хедере
Then:   URL меняется на `/admin`
```

```
Given:  пользователь на странице `/admin`
When:   нажимает "Записаться" в хедере
Then:   URL меняется на `/book`
```

```
Given:  пользователь на странице `/book`
When:   нажимает "Calendar" в хедере
Then:   URL меняется на `/`
```

---

### T26 — Past dates are disabled in calendar

**Priority**: Low
**File**: `specs/booking.spec.ts`

```
Given:  пользователь на странице `/book/{eventTypeId}`
When:   открывает предыдущий месяц в календаре (кнопка "Previous month")
Then:   все дни предыдущего месяца заблокированы (disabled)
And:    невозможно кликнуть на прошедшую дату
```

**Selectors**:
- DatePicker: click "Previous month" button (aria-label)
- Day cells from past month: verify `aria-disabled="true"` or `disabled` attribute

---

### T27 — Booked slots are disabled in slot list

**Priority**: High
**File**: `specs/booking.spec.ts`

```
Given:  через API создано бронирование на конкретный слот
When:   пользователь выбирает дату этого бронирования в календаре
Then:   в списке слотов забронированный слот отображается как "Занято"
And:    кнопка "Занято" заблокирована (disabled)
And:    невозможно выбрать забронированный слот
```

**Selectors**:
- `getByRole('button', { name: /Занято/ })` — visible
- Verify the "Занято" button has `disabled` attribute

---

### T28 — Empty event types page shows appropriate message

**Priority**: Low
**File**: `specs/booking.spec.ts`

```
Given:  все типы событий удалены через API (или список пуст)
When:   пользователь открывает `/book`
Then:   виден текст "Нет доступных типов событий"
```

---

## Priority Summary

| ID | Test | Priority | File |
|----|------|----------|------|
| T01 | Landing page renders | **Critical** | booking |
| T02 | "Записаться" navigates to `/book` | **Critical** | booking |
| T03 | Event type card navigates to booking | **Critical** | booking |
| T04 | Calendar date selection loads slots | High | booking |
| T05 | Slot selection enables "Продолжить" | High | booking |
| T06 | Booking form appears | Medium | booking |
| T07 | Form rejects invalid input | Medium | booking |
| T08 | Form accepts valid input, shows success | **Critical** | booking |
| T09 | "Забронировать еще" returns to `/book` | Medium | booking |
| T10 | "Назад" returns to `/book` | Medium | booking |
| T11 | "Изменить" returns to calendar | Medium | booking |
| T12 | Slot conflict handling | High | booking |
| T13 | Admin shows bookings | High | admin-bookings |
| T14 | Admin cancels booking | High | admin-bookings |
| T15 | Admin empty bookings list | Low | admin-bookings |
| T16 | Admin updates settings | Medium | admin-settings |
| T17 | Settings persist after reload | Medium | admin-settings |
| T18 | Settings work hours validation | Low | admin-settings |
| T19 | Admin opens create event type modal | Medium | admin-event-types |
| T20 | Admin creates event type | Medium | admin-event-types |
| T21 | Admin enters edit mode | Medium | admin-event-types |
| T22 | Admin saves edited event type | Medium | admin-event-types |
| T23 | Admin deletes event type | Medium | admin-event-types |
| T24 | Duplicate duration error | Medium | admin-event-types |
| T25 | Header navigation | Low | navigation |
| T26 | Past dates disabled | Low | booking |
| T27 | Booked slots disabled | High | booking |
| T28 | Empty event types message | Low | booking |

---

## Prerequisites

- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- Seed data loaded (default event types: 15min and 30min)
- Tests run against the real application (not mocked)
- Each test manages its own state via API helpers — no inter-test dependencies

## Test File Structure

```
tests/e2e/
├── scenarios.md                  # This file
├── fixtures/
│   └── test-setup.ts             # API helpers, page fixtures, seed management
├── specs/
│   ├── booking.spec.ts           # T01-T12, T26-T28
│   ├── admin-bookings.spec.ts    # T13-T15
│   ├── admin-settings.spec.ts    # T16-T18
│   ├── admin-event-types.spec.ts # T19-T24
│   └── navigation.spec.ts        # T25
└── playwright.config.ts          # Playwright configuration
```

## Design Principles Applied

1. **Atomicity**: Each test verifies exactly one behavior. One reason to fail.
2. **Independence**: No test depends on another. Prerequisites are set up via API helpers.
3. **Determinism**: No race conditions. API calls complete before UI actions.
4. **Given-When-Then**: Every test has explicit preconditions, actions, and verifications.
5. **Observable behavior**: Tests verify what the user sees, not internal state.
6. **Selector stability**: Uses roles and labels (accessible selectors), not CSS classes where possible.
