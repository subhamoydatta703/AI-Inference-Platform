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

All `/api/v1` routes above require a Clerk session bearer token and synchronize the local user through `authMiddleware`. Query execution is not implemented. Key counts are calculated from stored records, so deletion frees a slot without a separate counter update. API keys are not Clerk session tokens.
