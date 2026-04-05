# Playwright E2E

## What is included

- Playwright config in `tests/e2e/playwright.config.ts`
- Shared API/browser fixtures in `tests/e2e/fixtures/test-setup.ts`
- Spec files for booking, admin, and navigation flows
- Single-worker execution because backend state is global and in-memory
- MCP example config in `tests/e2e/opencode.mcp.example.json`

## Install

1. Install npm dependencies:

```bash
npm install
```

2. Install Chromium for Playwright:

```bash
npm run test:e2e:install
```

3. If WSL is missing system libraries, install browser dependencies too:

```bash
npm run test:e2e:install:deps
```

This step requires `sudo`. If it fails, install the missing Ubuntu packages manually and rerun.

## Run

Full local run with restart/cleanup:

```bash
make test-e2e
```

Manual run against already started services:

```bash
make restart
npm run test:e2e
```

Headed mode:

```bash
npm run test:e2e:headed
```

## Environment

- `BASE_URL`: frontend URL, default `http://127.0.0.1:5173`
- `API_URL`: backend API base, default `http://127.0.0.1:8000/api`
- `PW_HEADFUL=1`: launch headed browser
- `TEST_ENV_MODE`: optional label stored in Playwright metadata

Example:

```bash
BASE_URL="http://localhost:5173" API_URL="http://localhost:8000/api" npm run test:e2e
```

## WSL2 Notes

- The Playwright suite runs Linux Chromium inside WSL.
- `playwright install --with-deps` is the reliable setup path for a fresh WSL image, but it needs `sudo`.
- If you mainly want browser diagnostics against Windows Chrome, use the MCP servers below. They are separate from the Playwright test runner.

## MCP Setup

Example config is stored in `tests/e2e/opencode.mcp.example.json`.

Use it as the basis for your local MCP client config and adjust command paths/flags if your environment needs a specific Chrome executable.
