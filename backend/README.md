# backend

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
- `POST /api/v1/queries`: validate and execute a query through the current Groq orchestrator. Body: `{ query: string, language?: string, code?: string, url?: string }`. `query` must contain non-whitespace text; `url` must be valid when supplied. Requires a platform API key in `Authorization: Bearer <API_KEY>` and server-side `GROQ_API_KEY`. The key owner supplies `userId`; do not send it in the body. Returns `{ success: true, message, data: { userId, query: { conversationId, query, language, code, url }, response } }`.

Account and API-key-management routes require a Clerk session bearer token and synchronize the local user through `authMiddleware`. Query routes use `apiKeyMiddleware` to verify platform keys and attach their owner's `userId`. Clerk middleware is scoped to account and key-management routes. Key counts are calculated from stored records, so deletion frees a slot without a separate counter update. Create a platform key while signed in, then send its raw secret with each query. Revoking a key removes its database record, so it can no longer authenticate queries.

Query execution currently calls `openai/gpt-oss-20b` through Groq. Each request generates a new conversation ID. Conversation history, multi-model execution, independent evaluation, and URL fetching are not implemented. Invalid query fields return 400 with Zod issues in `errors`; missing, invalid, or revoked keys return 401; verification-service and inference failures return 500. Groq configuration loads only when a valid authenticated query is executed, so account and health routes can start without provider credentials.
