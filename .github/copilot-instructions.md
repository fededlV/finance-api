# Copilot Instructions for MisFinanzas API

## Build, test, and lint commands

- Install deps: `npm install`
- Run locally (Cloudflare Worker): `npm run dev`
- Typecheck (strict TS): `npm run typecheck`
- Deploy: `npm run deploy`
- Regenerate Cloudflare binding types: `npm run cf-typegen`

There is no automated test runner or lint script configured in `package.json` currently.

Single-test equivalent used in this repo:

- Health check: `curl -X GET http://127.0.0.1:8787/health`

D1 setup commands used by this project:

- Create schema (local): `npx wrangler d1 execute misfinanzas-db-local --file=src/db/schema.sql`
- Seed sample data (local): `npx wrangler d1 execute misfinanzas-db-local --file=src/db/seed.sql`

## High-level architecture

- Runtime is **Cloudflare Workers** with **Hono**. Entry point is `src/index.ts`.
- Request flow is: **route handler** (`src/routes/*`) -> optional **validateBody** middleware (`src/middlewares/validate.middleware.ts`) -> **service layer** (`src/services/*`) -> **D1 SQL**.
- `validateBody` parses JSON and stores parsed input in `c.set('validatedBody', ...)`; routes read it via `c.get('validatedBody')`.
- `AppError` in `src/middlewares/error.middleware.ts` is the domain error mechanism; global `app.onError(errorHandler)` converts it to `{ error, details? }` responses.
- Most endpoints return `{ data: ... }`; `/resumen` endpoints are intentionally different and return the object directly.
- SQL is split by concern:
  - CRUD services (`gastos`, `ahorros`, `periodos`, `presupuestos`, `categorias`) use direct D1 queries.
  - `src/services/resumen.service.ts` performs aggregate/reporting queries (including `db.batch` for grouped reads).

## Key conventions (repo-specific)

- Monetary values (`monto`, `dinero_inicial`, `monto_limite`) are handled as **integer cents** (value * 100), even though D1 columns are `REAL`.
- Error contract conventions:
  - App/domain errors: `{ error: string, details?: unknown }` with meaningful 4xx/5xx status.
  - Validation errors use Zod flatten output via `AppError('Error de validacion.', 422, error.flatten())`.
  - Invalid path/query IDs are treated as 400 using route-local positive-integer parsing.
- Route modules keep HTTP concerns (params/status/response shape), while services own SQL and DB constraint mapping (e.g., UNIQUE/FOREIGN KEY/CHECK -> 409/400).
- Patch operations require at least one field; empty patch payloads return 400 (validated in schemas and/or services).
- `GET /periodos/actual` auto-creates the current period using **UTC month/year** and handles unique-race conflicts by re-querying.
