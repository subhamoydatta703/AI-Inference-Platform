# backend

## Request limits

Authenticated API routes share a per-user allowance of 10 requests per rolling minute and 100 requests per rolling 24 hours. The middleware runs after Clerk or platform-key authentication, using the verified user ID; using another key for the same account does not bypass the limits. Profile, key management, and query requests all count, including requests whose controllers return errors. Rejected authentication, health checks, CORS preflight, and rate-limited requests do not consume the allowance.

Exceeding either limit returns HTTP 429 with `{ success: false, code: "RATE_LIMIT_EXCEEDED", message, retryAfter }`. The `Retry-After` header and `retryAfter` body field give the wait in seconds until both limits allow a request. Browser clients can read the header through CORS.

Counters are kept in memory per backend process and reset on restart. Multiple replicas need a shared store such as Redis to enforce a single deployment-wide allowance.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
# CORS

Clerk authentication uses `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`. The middleware also accepts the existing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` variable as a fallback, so the current development configuration can verify sessions.

The API allows browser requests from `http://localhost:3000`, `http://localhost:3001`, and `http://localhost:3002` by default, including credentials and the `Authorization` header. CORS middleware runs before authentication and handles preflight requests.

Override the allowed origins with a comma-separated environment variable, using exact origins without trailing slashes:

```env
CORS_ORIGINS=https://your-frontend.example.com,http://localhost:3000
```

## API routes

- `GET /health`: public health check.
- `GET /api/v1/users/me`: current profile.
- `GET /api/v1/api-keys`: list the current user's stored key metadata (`id`, `userId`, `createdAt`), without hashes or secrets.
- `POST /api/v1/api-keys`: create a key, returning `{ success: true, data: { id, key } }` (201). At most 5 keys per account (403 with `MAX_LIMIT_EXCEEDED`). Copy the raw key immediately; only its hash is stored.
- `DELETE /api/v1/api-keys/:id`: delete a key belonging to the current user (200), or 404 if absent or owned by another user.
- `POST /api/v1/queries`: validate and execute a query through the current Groq orchestrator. Body: `{ query: string, language?: string, code?: string, url?: string }`. `query` must contain non-whitespace text; `url` must be valid when supplied. Requires a platform API key in `Authorization: Bearer <API_KEY>` and server-side `GROQ_API_KEY`. The key owner supplies `userId`; do not send it in the body. Returns `{ success: true, message, data: { conversationId, query: { query, language, code, url }, response } }`.

Account and API-key-management routes require a Clerk session bearer token and synchronize the local user through `authMiddleware`. Query routes use `apiKeyMiddleware` to verify platform keys and attach their owner's `userId`. Clerk middleware is scoped to account and key-management routes. Key counts are calculated from stored records, so deletion frees a slot without a separate counter update. Create a platform key while signed in, then send its raw secret with each query. Revoking a key removes its database record, so it can no longer authenticate queries.

Query execution calls `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, and `qwen/qwen3.8-27b` sequentially through Groq, then evaluates their answers with `openai/gpt-oss-120b`. The API returns the original query, conversation ID, and final answer, without user IDs or model rankings. All model calls must succeed; failures abort the request. Each request generates a new conversation ID. Conversation history and URL fetching are not implemented. Invalid query fields return 400 with Zod issues in `errors`; missing, invalid, or revoked keys return 401; verification-service and inference failures return 500. Groq configuration loads only when a valid authenticated query is executed, so account and health routes can start without provider credentials.
