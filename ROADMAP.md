# Roadmap and Backlog

This document captures the prioritized development plan for the booking application.

## Principles

- Prioritize production reliability before new UX features.
- Keep API contract, implementation, and tests aligned.
- Move from in-memory behavior to persistent, deployment-safe operation.

## P0 — Critical

### 1) Reconnect Render auto-deploy to new repository

Issue title: `chore: reconnect Render auto-deploy to the new GitHub repository`

Acceptance criteria:
- Render service is connected to `https://github.com/nurgeld/ai-for-developers-project-387`.
- Auto-deploy on push to `main` is enabled.
- A push to `main` triggers and completes deploy successfully.
- Deployment process is documented in `README.md`.

### 2) Add production healthcheck and post-deploy smoke verification

Issue title: `chore: add production healthcheck and post-deploy smoke verification`

Acceptance criteria:
- A health endpoint exists and is used by Render health checks.
- Post-deploy smoke verifies `/`, `/api/settings`, `/api/event-types`.
- Failed health check marks deploy as failed.

Dependencies:
- Depends on P0.1.

### 3) Replace in-memory storage with Postgres

Issue title: `feat: replace in-memory storage with persistent Postgres storage`

Acceptance criteria:
- Booking, event types, and owner settings are persisted in Postgres.
- Data survives app restart and deploy.
- Seed defaults are dev/test-only.
- `DATABASE_URL` is supported for local and Render environments.

### 4) Add DB migrations

Issue title: `chore: add database migrations and environment setup`

Acceptance criteria:
- Migration tooling is configured.
- Initial migration creates required schema.
- Migration workflow for local and production is documented.
- Deploy applies migrations safely.

Dependencies:
- Depends on P0.3.

### 5) Add CI for lint/build/backend tests

Issue title: `ci: add GitHub Actions pipeline for lint, build and backend tests`

Acceptance criteria:
- `npm run lint`, `npm run build`, and backend `pytest` run on push/PR.
- Failures block merge.
- Checks are visible in GitHub status.

### 6) Add E2E smoke in CI

Issue title: `ci: add smoke e2e job for booking flow`

Acceptance criteria:
- CI runs a minimal Playwright smoke suite.
- Smoke covers landing page, booking flow entry, successful booking.
- Job is stable and documented.

Dependencies:
- Depends on P0.5.

## P1 — Important

### 7) Protect admin UI and owner API with authentication

Issue title: `feat: protect admin UI and owner API with authentication`

Acceptance criteria:
- `/admin` requires authentication.
- `/api/owner/*` returns `401/403` when unauthorized.
- Auth flow and local setup are documented.

### 8) Normalize API contract and HTTP semantics

Issue title: `fix: normalize API contract and HTTP semantics`

Acceptance criteria:
- Contract/docs/tests/backend use consistent response codes for create operations.
- Python version references are consistent across docs/runtime/config.
- `pyproject.toml`, `requirements.txt`, Docker runtime are aligned.

### 9) Improve client-side validation in admin settings

Issue title: `fix: strengthen client-side validation and error UX in admin settings`

Acceptance criteria:
- Invalid times and invalid ranges are blocked in UI.
- Validation messages are clear and user-friendly.
- Success state handling remains correct after failed submits.

### 10) Add operational logging and basic monitoring

Issue title: `feat: add operational logging and basic error monitoring`

Acceptance criteria:
- Booking create/cancel and server errors are logged in structured format.
- Logs are useful in Render diagnostics.
- Operational notes are documented.

### 11) Add admin filters for bookings

Issue title: `feat: add filtering for owner bookings by date and event type in admin UI`

Acceptance criteria:
- Admin can filter by event type and date range.
- Booking list and schedule view share consistent filtering behavior.
- Filter state persists in URL query params.

## P2 — Product Growth

### 12) Blocked dates and vacations

Issue title: `feat: support blocked dates, vacations and manual time-off`

Acceptance criteria:
- Owner can block dates/time ranges.
- Public slot list excludes blocked periods.
- Admin can manage exceptions.

### 13) Email notifications

Issue title: `feat: send booking confirmation and cancellation emails`

Acceptance criteria:
- Confirmation email is sent after booking.
- Cancellation email is sent after cancel.
- Email delivery failures do not break booking transaction.

### 14) Guest self-service cancellation/rescheduling

Issue title: `feat: allow guest self-service cancellation and rescheduling`

Acceptance criteria:
- Guest receives secure action link.
- Guest can cancel/reschedule within defined security policy.
- Token expiration/abuse protection is enforced.

Dependencies:
- Depends on P2.13.

### 15) Multiple event types with same duration

Issue title: `feat: allow multiple event types with the same duration`

Acceptance criteria:
- Multiple event types can share the same duration.
- No-overlap booking rule still holds.
- Contract/backend/UI/tests are updated consistently.

### 16) Export bookings to CSV/ICS

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
6. P0.6
7. P1.7
8. P1.8
9. P1.9
10. P1.10
11. P1.11
12. P2.12
13. P2.13
14. P2.14
15. P2.15
16. P2.16

## Next Sprint Recommendation

- P0.1 Reconnect Render auto-deploy
- P0.2 Add healthcheck and smoke verification
- P0.3 Move to Postgres persistence
- P0.5 Add CI pipeline (lint/build/pytest)
