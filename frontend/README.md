# Inference frontend

A responsive Next.js 16 SaaS frontend adapted from the user-selected Figmaland dark startup layout. The public website is at / and the developer console is at /console.

## Run locally

From frontend:

```powershell
bun install
bun run dev
```

Open http://localhost:3000. The console is at http://localhost:3000/console.

## Authentication and backend

Browser sign-in requires only NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY from the same Clerk application used by the backend. Set NEXT_PUBLIC_BACKEND_URL to your Express backend origin (defaults to http://localhost:5000). Keep CLERK_SECRET_KEY in backend/.env; the frontend does not need it for browser sign-in or direct profile requests. Optional Next.js server-side authentication and the /api/me proxy still require a frontend server secret.

Run the Express backend separately using bun run dev from backend. It needs its existing DATABASE_URL and Clerk credentials configured and its Prisma migrations applied. Sign in using the header button, then visit Console > Account. The frontend automatically obtains a Clerk session token and calls /api/v1/users/me directly on the backend. CORS must allow the frontend origin. A Retry connection button is available if the backend is unavailable.

The general browser tests run with Clerk disabled. The separate test:auth check uses your configured publishable key to open the real Clerk sign-in UI without a frontend secret; it does not submit credentials. A complete sign-in and database synchronization require an interactive account.

## Product flow and availability

The intended flow is query and optional source-code/documentation context -> orchestration across models -> independent evaluation -> final insight. Users do not choose models.

Queries and optional code/documentation context are sent by the integrating backend through HTTP. The website has no query workspace, playground, or browser submission form. There are no simulated answers, invented activity metrics, example API keys, or assumed configured model names. Existing browser-local demo keys are ignored.

API keys are a core integration requirement. Create, list, and revoke operations remain unavailable until the backend key service exists; the frontend never generates pretend credentials. Platform models and history show read-only unavailable states.

Integration docs have exactly two language tabs: Python and TypeScript. Both examples show backend HTTP requests, server-side API-key authentication, optional context, response handling, and errors. POST /api/v1/queries and its response shape are explicitly a proposed contract, not an implemented API. The existing live GET /api/v1/users/me uses a Clerk session token.

## Checks

```powershell
bun run lint
bun run build
bunx playwright install chromium
bun run test:e2e
bun run test:unit
bun run test:auth
```

If the frontend is already running, point the real-Clerk UI check to it instead of starting another dev server:

```powershell
$env:AUTH_TEST_BASE_URL = 'http://localhost:3002'
bun run test:auth
```

Browser checks cover desktop/mobile layout, retired query-link handling, Python/TypeScript code copying, unavailable API-key/model/history services, ignored legacy mock keys, account navigation, and legacy links. Tests use port 3100, cleared authentication keys, and an isolated .next-tests build directory so an existing dev server can stay running.

See DESIGN.md for the Figma reference, visual decisions, routes, and integration boundaries.
