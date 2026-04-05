# E2E Test Scenarios — Calendar Booking App

> Integration tests covering end-to-end user journeys via Playwright.
> Tests verify that frontend and backend work together through the real browser.

---

## Scenario 1: Full Guest Booking Flow (Critical)

**Route**: `/` → `/book` → `/book/:eventTypeId` → success

**Description**: A guest books an appointment from start to finish — the primary user journey of the application.

### Steps

1. Open the landing page `/`
2. Verify the page contains the CTA button "Записаться"
3. Click "Записаться" → navigate to `/book`
4. Verify the event types page loads with owner profile and event type cards
5. Click an event type card (e.g. "Знакомство" or "Консультация") → navigate to `/book/:eventTypeId`
6. Verify the booking page renders with 3 columns: summary, calendar, slot list
7. Select a date in the calendar (non-past)
8. Verify available time slots appear in the slot list
9. Click a free ("Свободно") time slot
10. Verify the "Продолжить" button becomes enabled
11. Click "Продолжить" → booking form appears
12. Fill in `guestName` (min 2 chars) and `guestEmail` (valid email)
13. Click "Подтвердить запись"
14. Verify success message: "Бронь подтверждена. До встречи!"
15. Click "Забронировать еще" → navigate back to `/book`

### Assertions

- All route transitions occur correctly
- "Продолжить" button is disabled until a slot is selected
- Form validation blocks submission with invalid data
- `POST /api/bookings` returns 201
- Success screen renders with correct confirmation message
- "Забронировать еще" navigates to `/book`

---

## Scenario 2: Slot Conflict Handling (High)

**Description**: If a slot gets booked by another user while the current user is filling the form, the app detects the conflict and returns the user to the calendar step.

### Steps

1. Navigate to `/book/:eventTypeId`
2. Select a date and a free time slot
3. Click "Продолжить" to reach the booking form
4. Fill in name and email
5. **Before submitting** — use the API to book the same slot (`POST /api/bookings`)
6. Click "Подтвердить запись"
7. Verify the user is redirected back to the calendar step
8. Verify an error message is displayed about the slot being unavailable

### Assertions

- The final availability check detects the conflict
- `POST /api/bookings` returns 409 `SLOT_ALREADY_BOOKED`
- User is returned to the calendar step with an error
- Slot cache is invalidated (the conflicting slot shows as booked)

---

## Scenario 3: Admin — View & Cancel Bookings (High)

**Route**: `/admin`

**Description**: The owner views upcoming bookings and cancels one.

### Steps

1. Complete a booking via Scenario 1 (prerequisite)
2. Navigate to `/admin`
3. Verify the "Бронирования" tab shows the booking card
4. Verify the booking card displays: guest name, email, slot time, event type name
5. Click "Отменить" on the booking card
6. Verify the booking card is removed from the list

### Assertions

- `GET /api/owner/bookings` returns the booking
- Booking card renders with correct guest and slot details
- `DELETE /api/owner/bookings/{id}` returns 204
- UI updates to reflect the cancellation (booking removed from list)

---

## Scenario 4: Admin — Update Owner Settings (Medium)

**Route**: `/admin` → Settings tab

**Description**: The owner updates their profile name and working hours.

### Steps

1. Navigate to `/admin`
2. Switch to the "Настройки" tab
3. In the Owner Settings form, change the owner name
4. Change work day start and/or end times (e.g. `09:00` → `10:00`)
5. Click "Сохранить"
6. Verify a success notification appears
7. Refresh the page
8. Verify the updated settings persist

### Assertions

- `PATCH /api/owner/settings` returns 200
- Success feedback is shown in the UI
- Settings persist after page reload (`GET /api/settings` returns updated values)

---

## Scenario 5: Admin — CRUD Event Types (Medium)

**Route**: `/admin` → Settings tab → Event Type Manager

**Description**: The owner creates, edits, and deletes event types.

### Steps

### 5a. Create Event Type

1. Navigate to `/admin`, "Настройки" tab
2. Click "Создать" to open the creation modal
3. Fill in name, description, and select duration (15 or 30 min)
4. Click "Создать" in the modal
5. Verify the new event type appears in the list

### 5b. Edit Event Type

1. Click "Изменить" on an existing event type
2. Change the name and/or description inline
3. Verify the changes are saved and reflected in the UI

### 5c. Delete Event Type

1. Click "Удалить" on an event type
2. Verify the event type is removed from the list

### 5d. Duplicate Duration Validation

1. Attempt to create a new event type with a duration that already exists
2. Verify an error is shown (409 `DUPLICATE_DURATION`)

### Assertions

- `POST /api/owner/event-types` creates the type and it appears in the list
- `PATCH /api/owner/event-types/{id}` updates the type inline
- `DELETE /api/owner/event-types/{id}` removes the type (204)
- Creating a type with a duplicate duration returns 409 and shows an error

---

## Scenario 6: Booking Form Validation (Medium)

**Description**: The booking form validates user input before submission.

### Steps

1. Navigate to `/book/:eventTypeId`
2. Select a date and a free time slot
3. Click "Продолжить" to reach the booking form
4. Attempt to submit with empty name → verify error
5. Enter a 1-character name → verify error (min 2 chars required)
6. Enter an invalid email (e.g. "abc") → verify error
7. Enter a valid name (2+ chars) and valid email → verify the "Подтвердить запись" button is enabled
8. Submit successfully

### Assertions

- Empty name triggers validation error
- Name shorter than 2 characters triggers validation error
- Invalid email format triggers validation error
- Form cannot be submitted with invalid data
- Valid data enables submission and completes the booking

---

## Priority Summary

| # | Scenario | Priority |
|---|----------|----------|
| 1 | Full Guest Booking Flow | **Critical** |
| 2 | Slot Conflict Handling | High |
| 3 | Admin — View & Cancel Bookings | High |
| 4 | Admin — Update Owner Settings | Medium |
| 5 | Admin — CRUD Event Types | Medium |
| 6 | Booking Form Validation | Medium |

---

## Prerequisites

- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- Seed data loaded (default event types: 15min and 30min)
- Tests run against the real application (not mocked)

## Test Structure Plan

```
tests/e2e/
├── scenarios.md              # This file
├── fixtures/
│   └── test-setup.ts         # Shared fixtures (page, API helpers, seed data)
├── specs/
│   ├── booking.spec.ts       # Scenario 1 + 2 + 6
│   ├── admin-bookings.spec.ts # Scenario 3
│   ├── admin-settings.spec.ts # Scenario 4
│   └── admin-event-types.spec.ts # Scenario 5
└── playwright.config.ts      # Playwright configuration
```
