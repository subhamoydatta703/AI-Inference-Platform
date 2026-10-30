# Inference Backend

The HTTP API and orchestration engine behind Inference. Built with **Bun, TypeScript, Express, Prisma, and PostgreSQL**, it manages developer accounts and application credentials, dispatches parallel model requests, and returns a selected answer through one query endpoint.

The service listens on **port 5000**. Clerk session tokens authenticate account operations; platform API keys authenticate inference requests. Provider credentials remain on the server.

See the [project overview](../README.md) for the complete setup flow and the [frontend README](../frontend/README.md) for the website and developer console.

## Contents

- [Local setup](#local-setup)
- [Service architecture](#service-architecture)
- [API routes](#api-routes)
- [Orchestration and evaluation](#orchestration-and-evaluation)
- [Rate limiting](#rate-limiting)
- [Source layout](#source-layout)
- [Errors and CORS](#errors-and-cors)
- [Checks](#checks)
- [Operational considerations](#operational-considerations)

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

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_PUBLISHABLE_KEY` | Shared Clerk application's publishable key |
| `CLERK_SECRET_KEY` | Server-side Clerk verification |
| `GROQ_API_KEY` | Groq candidate generation and evaluation |
| `OPENROUTER_API_KEY` | OpenRouter candidate generation |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |

Keep `.env` and provider credentials out of version control. Generate the Prisma client, apply the existing migrations, and start the API:

```powershell
bunx prisma generate
bunx prisma migrate deploy
bun run dev
```

`bun run dev` starts `src/server.ts` with file watching. Bun loads `.env` for this command. Check `GET http://localhost:5000/health`; the response is `{ "status": "ok" }`.

Configure Clerk session claims to include the signed-in user's email in the `email` claim. The authentication middleware uses it when initializing a user's local profile. Use the same Clerk application for the backend and frontend. Provider configuration is loaded when a valid query executes, rather than for account and health requests.

## Service architecture

```mermaid
flowchart TD
    Session[Clerk session token] --> Account[Profile and API-key routes]
    Key[Platform API key] --> Query[Query route]
    Account --> Identity[Verified user identity]
    Query --> Identity
    Identity --> Limits[Minute and daily rate limits]
    Limits --> AccountWork[Account and key operations]
    Limits --> Validation[Query validation]
    AccountWork --> DB[(PostgreSQL / Prisma)]
    Validation --> Queue[Orchestration queue]
    Queue --> Providers[Parallel Groq and OpenRouter calls]
    Providers --> Select[Candidate selection and evaluation]
    Select --> Output[Complete JSON response]
```

Authentication resolves the account before the shared rate limiters run. Account operations use PostgreSQL; valid queries enter a process-local orchestration queue before contacting inference providers.

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
  "url": "https://example.com/docs",
  "responseType": "text"
}
```

`query` is required and must contain non-whitespace text. `language`, `code`, `url`, and `responseType` are optional; omit unused fields. A supplied URL must be valid. `query` and `language` are trimmed. URLs are passed as reference context; their contents are not fetched.

`responseType` accepts `text` (default) or `json`. In text mode, `data.response` is a string. In JSON mode, provider and evaluation output is parsed as JSON, so `data.response` can be an object, array, string, number, boolean, or null. Describe the desired JSON structure in your query; choosing JSON mode does not enforce a schema. The parser removes Markdown code fences and returns null if parsing fails.

| Request field | Required | Validation |
| --- | --- | --- |
| `query` | Yes | Trimmed, non-empty string |
| `language` | No | Trimmed string |
| `code` | No | String |
| `url` | No | Valid URL; passed as context only |
| `responseType` | No | `text` or `json`; defaults to text in the controller |

Example text-mode response:

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
    "rawText": "<selected answer text>",
    "response": "<selected answer text>"
  }
}
```

The endpoint returns one complete JSON response. `data.rawText`, when present, contains the selected answer before JSON parsing. `data.query` omits `responseType`. Text answers may contain Markdown; JSON mode returns the parsed value. The API does not return candidate responses, user IDs, scores, or model rankings. Each request creates a new conversation identifier; persisted history and conversation continuation are not implemented.

For example, send `{"query":"Return a JSON object with a summary field.","responseType":"json"}` for structured output. A usable result could contain `data.response: {"summary":"..."}` and the corresponding JSON text in `data.rawText`.

Check `data.error` and require a non-null `data.response` before using the result, even when HTTP status is 200 and `success` is true. When all candidate calls fail or yield null/undefined answers, the current controller still returns this envelope:

```json
{
  "success": true,
  "message": "Query processed successfully",
  "data": {
    "conversationId": "<server-generated-uuid>",
    "query": { "query": "Your question" },
    "error": {}
  }
}
```

The empty error object is the serialized JavaScript `Error`; clients should not expect its message to be present. Missing answers and JSON parsing failures must be handled separately from HTTP errors.

## Orchestration and evaluation

Candidate calls run in parallel using `Promise.allSettled`:

| Candidate | Model identifier | Backend service |
| --- | --- | --- |
| GPT-OSS 20B | `openai/gpt-oss-20b` | Groq |
| GPT-OSS 120B | `openai/gpt-oss-120b` | Groq |
| Nemotron 3 Ultra | `nvidia/nemotron-3-ultra-550b-a55b:free` | OpenRouter |

Rejected calls, service errors, and null/undefined answers are excluded before selection. Empty text strings are not filtered by the orchestrator.

- No remaining candidates: return `data.error` without `data.response`; the controller currently wraps this in HTTP 200 with `success: true`.
- One remaining candidate: return its answer and raw text directly without evaluation.
- Multiple remaining candidates: evaluate them against the original query for correctness, relevance, completeness, and requested format. The evaluator is instructed to select one candidate without merging or rewriting it. Evaluation failures return HTTP 500.

If the evaluator finds no acceptable candidate, it is instructed to return `No acceptable candidate answer is available.` In text mode this is answer text; in JSON mode this non-JSON message parses to null. Clients should handle both cases.

`src/config/concurrency/concurrencyConfig.ts` limits execution to one orchestration request at a time per backend process. Other valid queries wait in the queue; the three provider calls within the active request still run in parallel. This queue is separate from the per-user request limits. Groq candidate calls and OpenRouter streaming have configured 10-second timeouts; queueing and evaluation can make the full HTTP request take longer. The integration examples use an adjustable 120-second client timeout.

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
| `src/config/concurrency/` | Process-local orchestration concurrency limit |
| `src/utils/response/jsonFormat.ts` | Parse answer text as JSON with null on failure |
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

The 7 integration-example tests execute the copyable TypeScript snippet with mocked HTTP and check strict TypeScript compatibility, authentication, text/JSON answers, raw-text preservation, missing/null answers, HTTP 200 error results, malformed data, and environment validation. They do not call inference providers.

The route tests mock database, Clerk verification, and inference calls while exercising the real HTTP routes and rate limiters. They do not validate live credentials or model availability.

`bun test` runs the complete suite. The current `integration/groqCompletion.test.ts` still mocks a default configuration export, while the service imports the named `groq` export; this test needs updating. The opt-in database lifecycle test (`RUN_DATABASE_TESTS=1`) also still assumes five keys, so update it to the enforced three-key limit before using it as a passing integration check.

## Operational considerations

| Concern | Current behavior |
| --- | --- |
| Concurrency | One active orchestration per process; candidate calls run in parallel |
| Rate-limit storage | In-memory counters; restart clears them and replicas do not share them |
| Response delivery | Complete JSON response; no public token streaming |
| Conversation state | New identifier per query; no persisted history or continuation |
| Structured output | JSON parsing without application-specific schema enforcement |
| Provider failures | Single-candidate fallback; no candidates can still produce an HTTP 200 error payload |

When hosting separately from the frontend, set exact allowed origins in `CORS_ORIGINS`. Allow enough HTTP timeout for queueing, candidate calls, and evaluation. Validate provider credentials and database connectivity in your own environment; mocked route and example checks do not establish live service readiness.

For the developer-facing experience and integration snippets, see the [frontend guide](../frontend/README.md).
