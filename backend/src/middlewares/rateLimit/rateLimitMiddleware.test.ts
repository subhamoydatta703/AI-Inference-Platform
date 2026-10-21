import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import express from "express";
import type { Server } from "node:http";
import type { AuthenticatedRequest } from "../auth/authMiddleware";
import { minuteLimiter, dailyLimiter } from "./rateLimitMiddleware";

let server: Server;
let baseUrl: string;
const userId = "limiter-test-user";

beforeAll(async () => {
  const app = express();
  app.get("/", (req: AuthenticatedRequest, _res, next) => {
    req.userId = req.header("X-Test-User") || userId;
    next();
  }, minuteLimiter, dailyLimiter, (_req, res) => res.json({ success: true }));
  server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test server address");
  baseUrl = `http://localhost:${address.port}`;
});

beforeEach(() => {
  for (const id of [userId, "other-limiter-test-user"]) {
    minuteLimiter.resetKey(id);
    dailyLimiter.resetKey(id);
  }
});

afterAll(() => new Promise<void>((resolve, reject) => {
  server.close(error => error ? reject(error) : resolve());
}));

describe("per-user request limits", () => {
  test("allows ten requests, then returns 429 with retry and standard headers", async () => {
    for (let i = 0; i < 10; i++) expect((await fetch(baseUrl)).status).toBe(200);
    const denied = await fetch(baseUrl);
    expect(denied.status).toBe(429);
    expect(Number(denied.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(denied.headers.has("RateLimit")).toBe(true);
    expect(denied.headers.has("X-RateLimit-Limit")).toBe(false);
    expect(await denied.json()).toEqual({
      success: false, status: 429, message: "Too many requests. Please try again later.",
    });
    expect((await fetch(baseUrl, { headers: { "X-Test-User": "other-limiter-test-user" } })).status).toBe(200);
  });

  test("blocks request 101 even when the minute allowance is refreshed", async () => {
    for (let batch = 0; batch < 10; batch++) {
      minuteLimiter.resetKey(userId);
      for (let i = 0; i < 10; i++) expect((await fetch(baseUrl)).status).toBe(200);
    }
    minuteLimiter.resetKey(userId);
    const denied = await fetch(baseUrl);
    expect(denied.status).toBe(429);
    expect(Number(denied.headers.get("Retry-After"))).toBeGreaterThan(60);
  });
});
