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
