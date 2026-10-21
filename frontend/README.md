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

The current flow is query with optional language/code/URL -> API-key authentication and schema validation -> orchestration -> three candidate model answers through Groq and OpenRouter -> evaluation -> final answer. Users do not choose models. Candidate calls run sequentially: GPT-OSS 20B and GPT-OSS 120B through Groq, then nvidia/nemotron-3-ultra-550b-a55b:free through OpenRouter. GPT-OSS 120B evaluates the candidates and selects the best acceptable answer unchanged. Failed or blank candidates are excluded by the evaluator; an evaluation failure aborts the request with 500. If none are acceptable, a successful response contains the text No acceptable candidate answer is available.

Queries and optional code/documentation context are sent by the integrating backend through HTTP. The website has no query workspace, playground, or browser submission form. There are no simulated answers, invented activity metrics, example API keys, or assumed configured model names. Existing browser-local demo keys are ignored.

The API keys page calls GET /api/v1/api-keys, POST /api/v1/api-keys, and DELETE /api/v1/api-keys/:id with a Clerk session token to create and revoke real backend keys (up to 3 per account). Use these platform keys as Bearer credentials for queries from your backend. The page loads stored key metadata and refreshes it after mutations. A successful revoke is checked against the refreshed list. Raw secrets stay in memory only during the current page session; existing keys can be revoked after refresh but cannot be retrieved because the backend stores only hashes. The frontend never generates credentials. The model panel describes the current backend configuration; history remains unavailable.

Integration docs have exactly two language tabs: Python and TypeScript. Both examples call the live POST /api/v1/queries route using a platform API key (INFERENCE_API_KEY) as an Authorization Bearer token. Sign in with Clerk only to create/manage keys; query clients do not need a Clerk session. Send query plus optional language, code, and url fields. The response contains data.conversationId, data.query (the original query and optional context), and data.response (the final evaluated answer). User IDs, candidate answers, and model rankings are not included. Each request creates a new conversation; history and follow-up context are not persisted. A URL is passed as context without fetching its contents. The Express backend requires GROQ_API_KEY and OPENROUTER_API_KEY; provider secrets never enter frontend code. Invalid query fields return 400, missing/invalid/revoked keys return 401, and verification-service or inference failures return 500.

For the copyable client examples, `INFERENCE_BASE_URL` is the platform Express backend origin: `http://localhost:5000` locally, or the deployed backend origin such as `https://your-service.onrender.com`. Do not include `/api/v1/queries` or use the frontend origin. Set this and `INFERENCE_API_KEY` in the calling application's server environment. The TypeScript example requires `zod` (`npm install zod` or `bun add zod`); schemas validate configuration, request data, and the unknown JSON response before exposing inferred types. No Zod dependency is needed by the frontend to display the example.

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

Browser checks cover desktop/mobile layout, retired query-link handling, Python/TypeScript code copying against the current query contract, signed-out API-key access, configured model information, unavailable history, ignored legacy mock keys, account navigation, and legacy links. Tests use port 3100, cleared authentication keys, and an isolated .next-tests build directory so an existing dev server can stay running.

See DESIGN.md for the Figma reference, visual decisions, routes, and integration boundaries.
