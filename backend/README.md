# Inference backend

Express API for account synchronization, application API keys, and multi-model query orchestration. It runs on Bun, uses PostgreSQL through Prisma, and listens on port **5000**.

See the [project overview](../README.md) for the complete setup flow and the [frontend README](../frontend/README.md) for the website and developer console.

## Local setup

Requirements: Bun and a reachable PostgreSQL database. Account routes also need a Clerk application; query execution needs the backend inference credentials.

Run from `backend/`:

```powershell
bun install
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/inference
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

Generate the Prisma client, apply the existing migrations, and start the API:

```powershell
bunx prisma generate
bunx prisma migrate deploy
bun run dev
```

`bun run dev` starts `src/server.ts` with file watching. Bun loads `.env` for this command. Check `GET http://localhost:5000/health`; the response is `{ "status": "ok" }`.

Configure Clerk session claims to include the signed-in user's email in the `email` claim. The authentication middleware uses it when initializing a user's local profile. Use the same Clerk application for the backend and frontend. Provider configuration is loaded when a valid query executes, rather than for account and health requests.

## API routes

### Request path

Account requests pass through Clerk session verification and local user synchronization. Query requests verify a platform API key and resolve its owner. Both paths then apply the shared minute and daily limiters before reaching their controllers. Query validation runs before the orchestrator loads inference configuration.

### Endpoint reference

| Method | Path | Authentication | Result |
| --- | --- | --- | --- |
| GET | `/health` | Public | Health status |
| GET | `/api/v1/users/me` | Clerk session bearer token | Current profile (`id`, `email`) |
| GET | `/api/v1/api-keys` | Clerk session bearer token | Stored key metadata (`id`, `userId`, `createdAt`) |
| POST | `/api/v1/api-keys` | Clerk session bearer token | New key (`id`, `key`), HTTP 201 |
| DELETE | `/api/v1/api-keys/:id` | Clerk session bearer token | Revoke an owned key; HTTP 404 if absent or not owned |
| POST | `/api/v1/queries` | Platform API key bearer token | Original query and selected answer |

For both authentication types, send `Authorization: Bearer <TOKEN>`. Clerk sessions manage accounts and keys; platform keys authenticate query requests. The authenticated identity supplies the user ID, so query clients should not include it in the body.

### API keys

Each account can store **three API keys**. The backend generates the secret and stores its SHA-256 hash. Only key creation returns the raw secret; listing returns metadata. Revocation removes the record, invalidates the credential, and frees a slot.

The enforced limit is three, although the controller's current `MAX_LIMIT_EXCEEDED` error message still says five. The frontend uses the enforced limit and normalizes that error text.

### Query contract

```http
POST /api/v1/queries
Authorization: Bearer <PLATFORM_API_KEY>
Content-Type: application/json
```

```json
{
  "query": "Identify the failure modes in this implementation.",
  "language": "javascript",
  "code": "function first(items) { return items[0].name; }",
  "url": "https://example.com/docs"
}
```

`query` is required and must contain non-whitespace text. `language`, `code`, and `url` are optional; omit unused fields. A supplied URL must be valid. `query` and `language` are trimmed. URLs are passed as reference context; their contents are not fetched.

Successful response:

```json
{
  "success": true,
  "message": "Query processed successfully",
  "data": {
    "conversationId": "<server-generated-uuid>",
    "query": {
      "query": "Identify the failure modes in this implementation.",
      "language": "javascript",
      "code": "function first(items) { return items[0].name; }",
      "url": "https://example.com/docs"
    },
    "response": "<selected answer text>"
  }
}
```

The endpoint returns one complete JSON response. Answers use Markdown by default and preserve the selected candidate's format. The API does not return candidate responses, user IDs, scores, or model rankings. Each request creates a new conversation identifier; persisted history and conversation continuation are not implemented.

## Orchestration and evaluation

Candidate calls run sequentially:

| Candidate | Model identifier | Backend service |
| --- | --- | --- |
| GPT-OSS 20B | `openai/gpt-oss-20b` | Groq |
| GPT-OSS 120B | `openai/gpt-oss-120b` | Groq |
| Nemotron 3 Ultra | `nvidia/nemotron-3-ultra-550b-a55b:free` | OpenRouter |

A separate evaluation step checks candidates against the original query for correctness, relevance, completeness, and requested format. It selects an acceptable candidate unchanged rather than merging or rewriting answers. Failed, blank, or mismatched candidates are passed to the evaluator for exclusion. If no candidate is acceptable, its instructed response is `No acceptable candidate answer is available.` inside a successful response. Evaluation failures return HTTP 500.

Provider credentials stay in the backend. OpenRouter streaming is consumed internally; the public query endpoint does not stream tokens to clients.

## Rate limiting

`src/middlewares/rateLimit/rateLimitMiddleware.ts` exports two shared `express-rate-limit` instances:

| Middleware | Window | Limit per user |
| --- | --- | --- |
| `minuteLimiter` | 60 seconds | 10 requests |
| `dailyLimiter` | 24 hours | 100 requests |

The middleware runs after authentication on profile, API-key management, and query routes. Both instances use the verified `req.userId`, so changing routes or using another key for the same account does not create another allowance. These are fixed counting windows, not rolling windows or calendar-day resets.

Successful and failed controller requests count. Authentication failures, public health checks, and CORS preflight do not reach the limiters. The minute limiter runs first: requests it rejects never reach the daily limiter. Requests rejected by the daily limiter have already passed through the minute counter.

Exceeding a limit returns HTTP **429**:

```json
{
  "success": false,
  "status": 429,
  "message": "Too many requests. Please try again later."
}
```

Wait for the number of seconds in the `Retry-After` response header before retrying. That header describes the limiter that rejected the request; the other limit may still apply afterward. Standard draft-8 rate-limit headers are enabled and legacy `X-RateLimit-*` headers are disabled. CORS exposes `Retry-After` to browser clients.

Counters use the default in-memory store and reset on process restart. Multiple backend replicas need shared storage to enforce a deployment-wide per-user limit.

## Source layout

| Path | Responsibility |
| --- | --- |
| `src/server.ts` | Start the HTTP listener on port 5000 |
| `src/app.ts` | Express setup, CORS, body parsing, and route mounting |
| `src/routes/` | Account, API-key, and query routes with middleware order |
| `src/middlewares/auth/` | Clerk session verification and local account initialization |
| `src/middlewares/apiKey/` | Platform-key verification and owner resolution |
| `src/middlewares/rateLimit/` | Shared per-user minute and daily limiters |
| `src/controllers/` | Request validation, service calls, and HTTP responses |
| `src/services/` | Account persistence, key lifecycle, orchestration, and inference calls |
| `src/utils/` | Validation schemas and internal types |
| `prisma/` | PostgreSQL schema and committed migrations |
| `integration/` | Integration-example checks and service/database test scenarios |

## Errors and CORS

| Status | Meaning |
| --- | --- |
| 400 | Invalid request or query fields; schema issues appear in `errors` when available |
| 401 | Missing or invalid Clerk session or platform API key, including revoked keys |
| 403 | API-key creation limit reached (`MAX_LIMIT_EXCEEDED`) |
| 404 | API key absent or not owned by the caller |
| 429 | Per-minute or daily request limit exceeded |
| 500 | Authentication service, database, or query-processing failure |

CORS runs before authentication. Default allowed origins are `http://localhost:3000`, `http://localhost:3001`, and `http://localhost:3002`. Override `CORS_ORIGINS` with comma-separated exact origins without trailing slashes. Add the frontend's deployed origin when hosting separately.

## Checks

Run from `backend/`:

```powershell
bunx tsc --noEmit
bun test src/middlewares/rateLimit/rateLimitMiddleware.test.ts src/routes/apiKey/apiKeyRoutes.test.ts
bun test src/utils/validation/user/userValidation.test.ts
bun test integration/queryDocs.test.ts
```

The route tests mock database, Clerk verification, and inference calls while exercising the real HTTP routes and rate limiters. They do not validate live credentials or model availability.

`bun test` runs the complete suite. The current `integration/groqCompletion.test.ts` still mocks a default configuration export, while the service imports the named `groq` export; this test needs updating. The opt-in database lifecycle test (`RUN_DATABASE_TESTS=1`) also still assumes five keys, so update it to the enforced three-key limit before using it as a passing integration check.
