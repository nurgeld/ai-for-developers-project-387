### Hexlet tests and linter status:
[![Actions Status](https://github.com/nurgeld/ai-for-developers-project-387/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/nurgeld/ai-for-developers-project-387/actions)

# Booking System

A calendar-based booking application for event scheduling. The system supports two roles: calendar owner and guests.

## Overview

**Calendar Owner** can:
- Create event types (e.g., "Знакомство" — 15 min, "Консультация" — 30 min)
- Update and delete event types
- View upcoming bookings across all event types
- Configure work hours (e.g., 09:00–18:00)
- Cancel bookings

**Guests** can:
- Browse available event types with name, description, and duration
- View a calendar with available and booked slots
- Book a free slot by providing name and email

## Key Rules

- **No overlap**: Two bookings cannot occupy the same time slot, even for different event types
- **Slot grid**: Slots are generated on a 15 or 30 minute grid based on the event type duration
- **Work hours**: Slots only appear within configured `workDayStart`–`workDayEnd`
- **Future only**: Only future slots are returned to guests
- **No registration**: Guests book without creating an account
- **Orphan bookings**: Deleting an event type does not delete existing bookings of that type

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Mantine UI, TanStack Router, TanStack Query
- **Backend**: Python 3.12, FastAPI, Pydantic, Poetry
- **API Contract**: TypeSpec (`api/main.tsp`)
- **Testing**: pytest, Playwright E2E

## Getting Started

### Frontend

```bash
npm install
npm run dev          # Start development server (with real backend on port 8000)
npm run dev:mock     # Start with Prism mock API (port 4010, read-only)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend

```bash
cd backend
poetry install
export OWNER_API_TOKEN=replace_with_strong_random_token
export ALLOWED_ORIGINS=http://localhost:5173
poetry run uvicorn app.main:app --reload
```

`OWNER_API_TOKEN` is required and protects all `/api/owner/*` endpoints via Bearer auth.
`ALLOWED_ORIGINS` accepts a comma-separated allowlist for CORS origins.

### Backend Tests

```bash
cd backend
poetry run pytest
```

### E2E Tests

End-to-end tests use Playwright and cover all user scenarios (30 tests total):

```bash
# Run all E2E tests (auto-starts/stops services)
npm run test:e2e

# Run with UI mode for debugging
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Install Playwright browsers
npm run test:e2e:install
```

### MCP Servers

The project includes MCP (Model Context Protocol) servers for enhanced AI tooling:

- **Playwright MCP** (`@playwright/mcp`) - Browser automation tools
- **Chrome DevTools MCP** (`chrome-devtools-mcp`) - Chrome debugging integration

Start manually:
```bash
make mcp-playwright    # Start Playwright MCP
make mcp-chrome        # Start Chrome DevTools MCP
```

Or configure in your IDE (configured in `.opencode/mcp.json` for OpenCode).

### Render Deployment Status

Check the deployment status of your Render service `nurgeldy-calendar-booking`.

**Environment setup**:
```bash
export RENDER_API_KEY=rnd_your_api_key_here
```

**Usage**:
```bash
# Check status and wait for deployment to complete (max 5 min)
make check-render

# One-shot check (returns JSON for CI/CD)
make check-render-quick
```

**Exit codes**: `0` = Deployed ✅, `1` = Failed ❌, `2` = Timeout ⏱️, `3` = Not found 🔍, `4` = API key not set

### Using Makefile

```bash
make stop            # Stop all services (vite, prism, uvicorn)
make restart         # Stop all and start with real backend
make restart-mock    # Stop all and start with mock API (background)
make test-e2e        # Run E2E tests with auto-start/stop
make test-e2e-ui     # Run E2E tests with UI mode
make mcp-playwright  # Start Playwright MCP server
make mcp-chrome      # Start Chrome DevTools MCP server
make mock-api        # Start Prism mock server only
```

## API

The API contract is defined in `api/main.tsp` using TypeSpec and is the **single source of truth** for all endpoints.

### Workflow

1. Edit `api/main.tsp` (TypeSpec)
2. Run `npm run compile:api` to generate OpenAPI spec
3. Run `npm run generate:types` to generate TypeScript types in `src/api/generated.ts`

### Public Endpoints (`/api`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/settings` | Get owner profile (name, avatar, work hours) |
| GET | `/event-types` | List all event types |
| GET | `/slots?eventTypeId=&startDate=&endDate=` | List available and booked slots |
| POST | `/bookings` | Create a booking |

### Owner Endpoints (`/api/owner`)

| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/settings` | Update owner settings |
| POST | `/event-types` | Create event type (15 or 30 min only) |
| PATCH | `/event-types/{id}` | Update event type (name, description only) |
| DELETE | `/event-types/{id}` | Delete event type (204) |
| GET | `/bookings` | List bookings (future only, sorted ASC) |
| DELETE | `/bookings/{id}` | Cancel booking (204) |

All owner endpoints require `Authorization: Bearer <OWNER_API_TOKEN>`.

### Error Responses

| Status | Error Code | Description |
|--------|-----------|-------------|
| 400 | `INVALID_SLOT_TIME` | Slot time doesn't match grid or is outside work hours |
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 401 | `UNAUTHORIZED` | Missing or invalid Authorization header |
| 403 | `FORBIDDEN` | Invalid owner token |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `SLOT_ALREADY_BOOKED` | Slot overlaps with existing booking |
| 409 | `DUPLICATE_DURATION` | Event type with this duration already exists |

## Backend Architecture

The backend follows a layered architecture with clear separation of concerns:

```
backend/app/
├── main.py            # FastAPI app factory (create_app)
├── models.py          # Pydantic request/response models
├── storage.py         # In-memory storage with seed data
├── dependencies.py    # FastAPI dependency injection (get_storage)
├── errors.py          # Unified error handling and exception types
├── services.py        # Business logic (validation, slot generation, booking rules)
├── time_utils.py      # Time parsing and UTC utilities
└── routers/           # HTTP route handlers (thin layer)
    ├── settings.py
    ├── event_types.py
    ├── slots.py
    ├── bookings.py
    └── owner_settings.py
```

- **Routers** handle HTTP concerns only (parsing, status codes, response models)
- **Services** contain all business rules and validation
- **Storage** is injected via `Depends(get_storage)`, making it easy to substitute in tests
- **Errors** are unified through `ApiException` and mapped to contract-compliant responses

## Project Structure

```
src/
├── api/          # API client, types, and OpenAPI spec
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── pages/        # Page components (route components)
└── router.tsx    # TanStack Router

backend/
├── app/          # FastAPI application
│   ├── models.py
│   ├── storage.py
│   ├── dependencies.py
│   ├── errors.py
│   ├── services.py
│   ├── time_utils.py
│   └── routers/
└── tests/        # Backend tests
    ├── conftest.py
    ├── test_services.py
    └── test_api.py

tests/e2e/
├── specs/        # E2E test specifications (Playwright)
├── fixtures/     # Test fixtures and helpers
├── playwright.config.ts
└── scenarios.md  # E2E test scenarios documentation

api/
└── main.tsp      # TypeSpec API contract (source of truth)

.opencode/
├── mcp.json      # MCP server configuration
└── tools/        # OpenCode custom tools
```
