# Roadmap and Backlog

This document captures the current prioritized development plan for the booking application.

## Principles

- Prioritize reliability and operability before feature expansion.
- Keep API contract, backend, frontend, and tests synchronized.
- Eliminate deployment risks caused by in-memory state and manual checks.

## Completed recently (removed from backlog)

- Render post-deploy smoke workflow exists for `/`, `/api/settings`, `/api/event-types`.
- Owner API endpoints are protected by bearer token validation (`401/403` behavior is covered by tests).
- Booking filters by `eventTypeId`, `startDate`, `endDate` are implemented in owner API and client layer.

## P0 — Critical

### 1) Add explicit health endpoint and wire it into platform health checks

Issue title: `chore: add production health endpoint and platform health checks`

Acceptance criteria:
- A dedicated endpoint (for example `/health`) returns service health status.
- Render health check uses this endpoint instead of implicit root checks.
- Failure status is visible in deploy diagnostics and blocks unhealthy deploys.

### 2) Replace in-memory storage with Postgres

Issue title: `feat: replace in-memory storage with persistent Postgres storage`

Acceptance criteria:
- Bookings, event types, and owner settings are persisted in Postgres.
- Data survives app restart and deploy.
- Seed defaults are dev/test-only.
- `DATABASE_URL` is supported for local and Render environments.

### 3) Add DB migrations

Issue title: `chore: add database migrations and environment setup`

Acceptance criteria:
- Migration tooling is configured.
- Initial migration creates required schema.
- Migration workflow for local and production is documented.
- Deploy applies migrations safely.

Dependencies:
- Depends on P0.2.

### 4) Add CI for lint/build/backend tests

Issue title: `ci: add GitHub Actions pipeline for lint, build and backend tests`

Acceptance criteria:
- `npm run lint`, `npm run build`, and backend `pytest` run on push/PR.
- Failures block merge.
- Checks are visible in GitHub status.

### 5) Add E2E smoke in CI

Issue title: `ci: add smoke e2e job for booking flow`

Acceptance criteria:
- CI runs a minimal Playwright smoke suite.
- Smoke covers landing page, booking flow entry, successful booking.
- Job is stable and documented.

Dependencies:
- Depends on P0.4.

## P1 — Important

### 6) Protect `/admin` route on frontend (API protection is already in place)

Issue title: `feat: add admin UI auth gate`

Acceptance criteria:
- `/admin` requires explicit authentication state/token presence.
- Unauthorized users see clear access-denied or redirect behavior.
- Auth setup for local/dev is documented.

### 7) Normalize API contract and runtime configuration consistency

Issue title: `fix: normalize API contract and runtime semantics`

Acceptance criteria:
- Contract/docs/tests/backend use consistent response codes for create operations.
- Python version references are consistent across docs/runtime/config.
- `pyproject.toml`, `requirements.txt`, and deploy runtime settings are aligned.

### 8) Improve client-side validation in admin settings

Issue title: `fix: strengthen client-side validation and error UX in admin settings`

Acceptance criteria:
- Invalid `HH:mm` values and invalid ranges (`start >= end`) are blocked in UI.
- Validation messages are clear and user-friendly.
- Success state handling remains correct after failed submits.

### 9) Add operational logging and basic monitoring

Issue title: `feat: add operational logging and basic error monitoring`

Acceptance criteria:
- Booking create/cancel and server errors are logged in structured format.
- Logs are useful in Render diagnostics.
- Operational notes are documented.

### 10) Expose booking filters in admin UI

Issue title: `feat: add booking filters in admin UI using existing API support`

Acceptance criteria:
- Admin can filter bookings by event type and date range from the interface.
- Booking list and schedule view use consistent filtering behavior.
- Filter state persists in URL query params.

## P2 — Product Growth

### 11) Blocked dates and vacations

Issue title: `feat: support blocked dates, vacations and manual time-off`

Acceptance criteria:
- Owner can block dates/time ranges.
- Public slot list excludes blocked periods.
- Admin can manage exceptions.

### 12) Email notifications

Issue title: `feat: send booking confirmation and cancellation emails`

Acceptance criteria:
- Confirmation email is sent after booking.
- Cancellation email is sent after cancel.
- Email delivery failures do not break booking transaction.

### 13) Guest self-service cancellation/rescheduling

Issue title: `feat: allow guest self-service cancellation and rescheduling`

Acceptance criteria:
- Guest receives secure action link.
- Guest can cancel/reschedule within defined security policy.
- Token expiration/abuse protection is enforced.

Dependencies:
- Depends on P2.12.

### 14) Multiple event types with same duration

Issue title: `feat: allow multiple event types with the same duration`

Acceptance criteria:
- Multiple event types can share the same duration.
- No-overlap booking rule still holds.
- Contract/backend/UI/tests are updated consistently.

### 15) Export bookings to CSV/ICS

Issue title: `feat: export bookings to CSV and calendar formats`

Acceptance criteria:
- Admin can export filtered bookings to CSV.
- Calendar export format is supported (ICS or equivalent).
- Export behavior is documented.

## Suggested Execution Order

1. P0.1
2. P0.2
3. P0.3
4. P0.4
5. P0.5
6. P1.6
7. P1.7
8. P1.8
9. P1.9
10. P1.10
11. P2.11
12. P2.12
13. P2.13
14. P2.14
15. P2.15

## Next Sprint Recommendation

- P0.1 Add explicit health endpoint and Render healthcheck wiring.
- P0.2 Move to Postgres persistence.
- P0.3 Add migration flow.
- P0.4 Add CI pipeline (lint/build/pytest).
