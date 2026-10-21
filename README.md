# Inference

A multi-model AI platform with managed orchestration, a dedicated evaluation layer, and a developer console. Send one query with optional code or reference context; receive one selected answer through a single HTTP API.

## How it works

**Query and context → orchestration → three candidate responses → evaluation → final answer.**

The candidate models are **GPT-OSS 20B**, **GPT-OSS 120B**, and **Nemotron 3 Ultra**. Each receives the same question and supporting context. A separate evaluation step reviews correctness, relevance, completeness, and the requested format, then selects the strongest acceptable answer unchanged. When no candidate is acceptable, the response explicitly says so.

The application handles coordination and selection automatically. Integrating applications submit queries from their backends; the website provides account management, API keys, architecture information, and integration documentation.

## Repository

| Directory | Purpose | Documentation |
| --- | --- | --- |
| `backend/` | Express API, PostgreSQL/Prisma, authentication, API keys, inference, and rate limiting | [Backend README](backend/README.md) |
| `frontend/` | Next.js website and developer console | [Frontend README](frontend/README.md) |

The backend runs on Bun and uses TypeScript. The frontend uses Next.js 16, React 19, Clerk, Geist typography, and Lucide icons.

## Local setup

You need Bun, a PostgreSQL database, and a Clerk application shared by the frontend and backend. Query execution also needs the inference credentials described in the backend README. Dependencies are installed separately in each application; there is no root package script.

### 1. Start the backend

From the repository root:

```powershell
cd backend
bun install
```

Create `backend/.env` using the variables in the [backend setup guide](backend/README.md#local-setup). Configure the Clerk session's `email` claim so the backend can initialize local user profiles. Then, from `backend/`:

```powershell
bunx prisma generate
bunx prisma migrate deploy
bun run dev
```

The API listens at `http://localhost:5000`. `GET /health` returns `{ "status": "ok" }`.

### 2. Start the frontend

In a second terminal, from the repository root:

```powershell
cd frontend
bun install
```

On first setup, copy `frontend/.env.example` to `frontend/.env`. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to the publishable key from the same Clerk application and `NEXT_PUBLIC_BACKEND_URL` to `http://localhost:5000`. Then, from `frontend/`:

```powershell
bun run dev
```

Open [the website](http://localhost:3000) or [the developer console](http://localhost:3000/console). Default backend CORS origins cover frontend ports 3000, 3001, and 3002; update `CORS_ORIGINS` for other origins.

### 3. Connect your application

Sign in to the console, create an API key, and copy its secret before leaving the page. Keep it in your application's server environment. Follow the Python or TypeScript example in **Console → Integration docs** to call `POST /api/v1/queries` with `Authorization: Bearer <PLATFORM_API_KEY>`.

Clerk sessions authenticate account and key-management routes. Platform API keys authenticate query requests. Each account can store **three keys**; revoked keys stop authenticating requests and free a slot.

## Request limits

Each authenticated user shares **10 requests per minute** and **100 requests per 24 hours** across profile, API-key management, and query routes. Both limits use fixed counting windows. Different API keys belonging to the same user share the allowance.

An exceeded limit returns HTTP **429** and a `Retry-After` header. The default rate-limit store is in memory, resets on restart, and is local to each backend process. See the [rate-limit reference](backend/README.md#rate-limiting) for counter order and shared-storage considerations.

## Current capabilities

- Responsive product website and developer console with mobile navigation, searchable sections, and Python/TypeScript integration examples.
- Account synchronization, real API-key creation and revocation, and authenticated query execution.
- Three candidate responses, followed by evaluation and selection; the API returns one complete JSON response.
- Explicit empty and unavailable states for features without connected data.

Persistent query history, usage reporting, conversation continuation, and fetching reference URLs are not implemented. A URL is passed as context only; include any source text needed to answer the question. No simulated query answers or invented activity metrics are displayed.

## Development checks

Run commands from the relevant application directory:

| Application | Checks |
| --- | --- |
| Backend | `bunx tsc --noEmit`; focused route, rate-limit, validation, and integration-example tests documented in its README |
| Frontend | `bun run lint`, `bunx tsc --noEmit`, `bun run test:unit`, `bun run build`, `bun run test:e2e` |

Browser tests require Chromium (`bunx playwright install chromium` from `frontend/`). Clerk UI checks are separate from the default browser suite. The backend README identifies existing full-suite test mismatches; the frontend README explains which checks use live services.

## Further documentation

- [Backend setup, API contract, errors, and rate limits](backend/README.md)
- [Frontend setup, routes, source layout, and checks](frontend/README.md)
- [Frontend design decisions](frontend/DESIGN.md)
- [Visual verification and test limitations](frontend/design-qa.md)
