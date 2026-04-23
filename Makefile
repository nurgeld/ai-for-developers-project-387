help:
	@echo "Available commands:"
	@echo "  make dev            - Start development server"
	@echo "  make dev-mock       - Start with mock API (Prism)"
	@echo "  make build          - Build for production"
	@echo "  make lint           - Run ESLint"
	@echo "  make test-backend   - Run backend pytest"
	@echo "  make test-e2e       - Run Playwright E2E suite"
	@echo "  make test-e2e-ui    - Run Playwright E2E tests with UI mode"
	@echo "  make mcp-playwright - Start Playwright MCP server"
	@echo "  make mcp-chrome     - Start Chrome DevTools MCP server"
	@echo "  make check-render   - Check Render deploy status (wait for completion)"
	@echo "  make check-render-quick - Check Render deploy status (one-shot, JSON)"
	@echo "  make mock-api       - Start Prism mock server"
	@echo "  make compile-api    - Compile TypeSpec to OpenAPI"
	@echo "  make generate-types - Generate TS types from OpenAPI"
	@echo "  make clean          - Remove build artifacts"
	@echo "  make stop           - Stop all services (vite, prism, uvicorn)"
	@echo "  make restart        - Stop all and start with real backend"
	@echo "  make restart-mock   - Stop all and start with mock API (background)"
stop:
	-fuser -k 5173/tcp 2>/dev/null
	-fuser -k 4010/tcp 2>/dev/null
	-fuser -k 8000/tcp 2>/dev/null
	@echo "All services stopped"
restart: stop
	@echo "Starting backend on port 8000..."
	$(MAKE) --no-print-directory _start-backend
	@sleep 2
	@echo "Starting frontend on port 5173..."
	$(MAKE) --no-print-directory _start-vite-real
restart-mock: stop
	@echo "Starting Prism mock API on port 4010..."
	$(MAKE) --no-print-directory _start-mock-api
	@sleep 2
	@echo "Starting frontend on port 5173..."
	$(MAKE) --no-print-directory _start-vite-mock
check-render:
ifndef RENDER_API_KEY
	$(error RENDER_API_KEY is not set. Get it from https://dashboard.render.com/settings#api-keys)
endif
	@node scripts/run-render-check.js --wait --timeout 300
check-render-quick:
ifndef RENDER_API_KEY
	$(error RENDER_API_KEY is not set)
endif
	@node scripts/run-render-check.js --format json
_start-backend:
	cd backend && OWNER_API_TOKEN=$${OWNER_API_TOKEN:-dev-owner-token} nohup poetry run python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 > /tmp/backend.log 2>&1 &
_start-mock-api:
	nohup npx prism mock src/api/openapi.json -p 4010 > /tmp/prism.log 2>&1 &
	@echo "Prism mock API started"
_start-vite-mock:
	VITE_OWNER_API_TOKEN=$${VITE_OWNER_API_TOKEN:-$${OWNER_API_TOKEN:-dev-owner-token}} nohup npx vite --mode mock --host > /tmp/vite.log 2>&1 &
	@echo "Vite dev server started"
_start-vite-real:
	VITE_OWNER_API_TOKEN=$${VITE_OWNER_API_TOKEN:-$${OWNER_API_TOKEN:-dev-owner-token}} nohup npx vite --host > /tmp/vite.log 2>&1 &
	@echo "Vite dev server started"
dev:
	npm run dev
dev-mock:
	@echo "Starting Prism mock API on port 4010..."
	$(MAKE) --no-print-directory _start-mock-api
	@echo "Waiting for Prism to be ready..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if curl -s http://127.0.0.1:4010/api/settings > /dev/null 2>&1; then \
			echo "Prism is ready!"; \
			break; \
		fi; \
		sleep 1; \
	done
	@echo "Starting Vite dev server..."
	$(MAKE) --no-print-directory _start-vite-mock
build:
	npm run build
lint:
	npm run lint
test-backend:
	cd backend && poetry run pytest
test-e2e:
	@set -e; \
	trap '$(MAKE) --no-print-directory stop' EXIT; \
	$(MAKE) --no-print-directory restart; \
	echo "Running Playwright E2E tests..."; \
	npm run test:e2e
test-e2e-ui:
	@set -e; \
	trap '$(MAKE) --no-print-directory stop' EXIT; \
	$(MAKE) --no-print-directory restart; \
	echo "Running Playwright E2E tests with UI..."; \
	npm run test:e2e:ui
mcp-playwright:
	npx -y @playwright/mcp@latest
mcp-chrome:
	npx -y chrome-devtools-mcp@latest
mock-api:
	npm run mock:api
compile-api:
	npm run compile:api
generate-types:
	npm run generate:types
clean:
	rm -rf dist tsp-output
