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

## Security hardening plan (OWASP cheat sheets)

Selected checklists most relevant to the current architecture:

1. [REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
2. [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
3. [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

Small implementation plan:

- REST Security baseline: enforce strict CORS policy, rate limiting for public booking endpoints, and secure headers.
- Input Validation baseline: centralize validation rules for booking payloads (email/name/date-time), normalize error responses, and add boundary/abuse test cases.
- Secrets baseline: move owner token and related sensitive config to managed secrets, define token rotation process, and document emergency key revoke flow.

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

### 11) Apply REST API security baseline (OWASP REST Security)

Issue title: `security: harden REST API surface using OWASP REST Security checklist`

Acceptance criteria:
- CORS is explicitly allowlisted per environment (no wildcard in production).
- Basic rate limiting is enabled for public write endpoints (`POST /api/bookings`).
- Security headers and content-type handling are validated in API responses.
- Security-focused API tests cover CORS/rate-limit behavior.

### 12) Strengthen input validation and abuse resistance (OWASP Input Validation)

Issue title: `security: enforce centralized input validation and abuse test coverage`

Acceptance criteria:
- Validation constraints are consistent across API contract, backend models, and frontend forms.
- Email, name, and date/time fields are validated for length, format, and edge cases.
- Invalid payloads return predictable error schema without leaking internals.
- Negative tests cover malformed payloads and boundary values.

### 13) Introduce secrets lifecycle controls (OWASP Secrets Management)

Issue title: `security: implement secret management and token rotation playbook`

Acceptance criteria:
- Owner API token is loaded from managed environment secret, never from source defaults.
- Token rotation runbook is documented and verified in non-prod.
- Emergency revoke/replace steps are documented for incident handling.
- Configuration docs clearly separate required vs optional secrets.

## P2 — Product Growth

### 14) Blocked dates and vacations

Issue title: `feat: support blocked dates, vacations and manual time-off`

Acceptance criteria:
- Owner can block dates/time ranges.
- Public slot list excludes blocked periods.
- Admin can manage exceptions.

### 15) Email notifications

Issue title: `feat: send booking confirmation and cancellation emails`

Acceptance criteria:
- Confirmation email is sent after booking.
- Cancellation email is sent after cancel.
- Email delivery failures do not break booking transaction.

### 16) Guest self-service cancellation/rescheduling

Issue title: `feat: allow guest self-service cancellation and rescheduling`

Acceptance criteria:
- Guest receives secure action link.
- Guest can cancel/reschedule within defined security policy.
- Token expiration/abuse protection is enforced.

Dependencies:
- Depends on P2.15.

### 17) Multiple event types with same duration

Issue title: `feat: allow multiple event types with the same duration`

Acceptance criteria:
- Multiple event types can share the same duration.
- No-overlap booking rule still holds.
- Contract/backend/UI/tests are updated consistently.

### 18) Export bookings to CSV/ICS

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
7. P1.11
8. P1.13
9. P1.7
10. P1.8
11. P1.12
12. P1.9
13. P1.10
14. P2.14
15. P2.15
16. P2.16
17. P2.17
18. P2.18

## Sprint Queue Recommendation

### Sprint N+1 (platform stabilization)

- P0.2 Move to Postgres persistence.
- P0.3 Add migration flow.
- P0.4 Add CI pipeline (lint/build/pytest).

### Sprint N+2 (security baseline + admin access)

- P0.5 Add E2E smoke in CI.
- P1.6 Protect `/admin` route on frontend.
- P1.11 Apply REST API security baseline.
- P1.13 Introduce secrets lifecycle controls.

### Sprint N+3 (quality hardening)

- P0.1 Add explicit health endpoint and Render healthcheck wiring.
- P1.7 Normalize API contract/runtime consistency.
- P1.8 Improve admin settings client-side validation.
- P1.12 Strengthen input validation and abuse resistance.
- P1.9 Add operational logging and basic monitoring.
- P1.10 Expose booking filters in admin UI.
