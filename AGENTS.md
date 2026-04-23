# Agent Guidelines

## Engineering Principles

- Fix root causes, not symptoms
- Don't modify code you didn't change
- Extend existing models before adding new ones
- YAGNI & DRY

---

## Commands

```bash
make stop            # Stop all services
make restart         # Start backend (8000) + frontend (5173)
make dev             # Frontend dev server
make build           # TS compile + Vite build
make lint            # ESLint
make test-backend    # Run backend pytest
make test-e2e        # Run Playwright E2E tests
make test-e2e-ui     # Run Playwright E2E tests with UI mode
make compile-api     # TypeSpec → OpenAPI
make generate-types  # OpenAPI → TS types
make mcp-playwright  # Start Playwright MCP server
make mcp-chrome      # Start Chrome DevTools MCP server
make check-render    # Check Render deploy status (wait for completion)
make check-render-quick - Check Render deploy status (one-shot, JSON)
```

---

## Custom Tool: Seed Test Data

**Location**: `.opencode/tools/seed-test-data.ts`

Populates the Calendar API with test data:
- Updates owner settings (name, work hours)
- Creates/updates event types (15min "Знакомство", 30min "Консультация")
- Creates one test booking for the current day

**Usage** (via opencode tool system):
```
@seed-test-data baseUrl="http://localhost:8000"
```

**Options**: `ownerName`, `force`, `bookingGuestName`, `bookingGuestEmail`, `bookingDurationMinutes`, `ensureBookingForToday`

**Standalone script**: `scripts/run-seed.js` — run with `node scripts/run-seed.js`

---

## Render Deployment Check

Check the deployment status of your Render service `nurgeldy-calendar-booking`.

**Environment setup**:
```bash
export RENDER_API_KEY=rnd_your_api_key_here
# Optional: export RENDER_SERVICE_NAME=your-service-name
```

**Usage**:
```bash
# Check status and wait for deployment to complete (max 5 min)
make check-render

# One-shot check (returns JSON for CI/CD)
make check-render-quick

# Via OpenCode IDE
@render-deploy-check wait=true timeout=300
```

**Exit codes**:
- `0` = Deployed successfully ✅
- `1` = Deployment failed ❌
- `2` = Timeout waiting for deploy ⏱️
- `3` = Service not found 🔍
- `4` = API key not set
- `5` = API error

**Output formats**:
- `make check-render`: Human-readable text with emojis and details
- `make check-render-quick`: Machine-readable JSON for CI/CD pipelines

---

## MCP Servers

Configured in `.opencode/mcp.json`:

- **playwright** (`@playwright/mcp@latest`) - Browser automation tools
- **chrome-devtools** (`chrome-devtools-mcp@latest`) - Chrome debugging integration

**Usage**:
```bash
make mcp-playwright    # Start Playwright MCP
make mcp-chrome        # Start Chrome DevTools MCP
```

For OpenCode IDE: Configuration is automatically loaded from `.opencode/mcp.json`.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Mantine UI, TanStack Router, TanStack Query
- **Backend**: Python/FastAPI (port 8000, in-memory storage)
- **API Contract**: TypeSpec (`api/main.tsp`)
- **Mock API**: Prism on port 4010

---

## API Endpoints

### Public (`/api`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/settings` | Owner profile |
| GET | `/event-types` | List event types |
| GET | `/slots?eventTypeId=&startDate=&endDate=` | Slots for period |
| POST | `/bookings` | Create booking |

### Owner (`/api/owner`)
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/settings` | Update owner settings |
| POST | `/event-types` | Create event type |
| PATCH | `/event-types/{id}` | Update event type |
| DELETE | `/event-types/{id}` | Delete event type |
| GET | `/bookings` | List bookings (future only, sorted ASC) |
| DELETE | `/bookings/{id}` | Cancel booking (204) |

### Key Rules
- Slots: 15 or 30 min grid within `workDayStart`–`workDayEnd`
- Overlap rule: no two bookings at same time, even different types → 409
- `eventTypeName` is a snapshot at creation time (survives type deletion)
- Seed data on startup: "Встреча 15 минут" + "Встреча 30 минут"
- Defaults: `workDayStart="09:00"`, `workDayEnd="18:00"`
- No auth; single owner profile

### Error Codes
- 409: `SLOT_ALREADY_BOOKED`, `DUPLICATE_DURATION`
- 400: `INVALID_SLOT_TIME`, `VALIDATION_ERROR`
- 404: `NOT_FOUND`

---

## Code Style

- TypeScript strict mode; no `any`
- Named exports; PascalCase components; `use` prefix for hooks
- 2 spaces, 100 char lines, semicolons required
- Import order: React → UI libs → internal → types
- Functional components with hooks; early returns for loading/error
- Query keys: `['settings']`, `['eventTypes']`, `['slots', ...]`, `['owner', 'bookings', ...]`

---

## File Structure

```
src/
├── api/              # client.ts, types.ts, generated.ts, openapi.json
├── components/       # booking/, admin/, layout/
├── hooks/            # useQuery/useMutation hooks
├── pages/            # HomePage, EventTypesPage, BookingPage, AdminPage
├── router.tsx        # TanStack Router
├── App.tsx           # MantineProvider + QueryClient + RouterProvider
└── main.tsx
backend/app/
├── main.py           # FastAPI app factory (create_app)
├── models.py         # Pydantic request/response models
├── storage.py        # In-memory storage with seed data
├── dependencies.py   # FastAPI DI (get_storage)
├── errors.py         # Unified error handling
├── services.py       # Business logic layer
├── time_utils.py     # Time parsing and UTC utilities
├── routers/          # settings, event_types, slots, bookings, owner_settings
└── tests/            # pytest: conftest.py, test_services.py, test_api.py
tests/e2e/
├── scenarios.md      # E2E user scenario specifications
├── fixtures/         # Shared test fixtures
├── specs/            # Playwright test specs
└── playwright.config.ts
.opencode/
├── mcp.json          # MCP server configuration
└── tools/
    ├── seed-test-data.ts # Custom tool for test data
    └── render-deploy-check.ts # MCP tool for Render deploy status
scripts/
├── run-seed.js       # Standalone seed script
└── run-render-check.js   # Standalone CLI script for Render deploy check
```

---

## Git

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Never commit unless explicitly asked
