import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import type { NextFunction, Request, Response } from "express";
import type { Server } from "node:http";

const createKey = mock(async (_userId: string): Promise<{ success: boolean; data: { id: string; key: string } | null; message: string }> => ({
  success: true, data: { id: "key-id", key: "generated-secret" }, message: "",
}));
const deleteKey = mock(async (_userId: string, _id: string) => ({ success: true, message: "API key deleted successfully" }));
const listKeys = mock(async (_userId: string): Promise<{ success: boolean; data: { id: string; userId: string; createdAt: string }[] | null; message?: string }> => ({
  success: true, data: [{ id: "key-id", userId: "user-test", createdAt: "2026-10-17T00:00:00.000Z" }],
}));

// Isolate HTTP wiring from Clerk's network verification and the database.
mock.module("@clerk/express", () => ({
  clerkMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));
mock.module("../../middlewares/auth/authMiddleware", () => ({
  authMiddleware: (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
    if (req.headers.authorization !== "Bearer test-session")
      return res.status(401).json({ success: false, message: "Unauthorized" });
    req.userId = "user-test";
    next();
  },
}));
mock.module("../../services/apiKey/apiKeyService", () => ({ createApiKeyService: createKey, deleteApiKeyService: deleteKey, listApiKeysService: listKeys }));
mock.module("../../controllers/user/userController", () => ({
  getUserByIdController: (_req: Request, res: Response) => res.json({ success: true, data: { id: "user-test", email: "test@example.com" } }),
}));

let server: Server;
let baseUrl: string;
const headers = { Authorization: "Bearer test-session" };

beforeAll(async () => {
  const { default: app } = await import("../../app");
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test server address");
  baseUrl = `http://localhost:${address.port}`;
});
afterAll(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

describe("mounted API routes", () => {
  test("keeps health and the authenticated profile route available", async () => {
    expect(await (await fetch(`${baseUrl}/health`)).json()).toEqual({ status: "ok" });
    expect((await fetch(`${baseUrl}/api/v1/users/me`, { headers })).status).toBe(200);
  });

  test("protects creation and deletion before calling services", async () => {
    expect((await fetch(`${baseUrl}/api/v1/api-keys`)).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/v1/api-keys`, { method: "POST" })).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/v1/api-keys/key-id`, { method: "DELETE" })).status).toBe(401);
    expect(createKey).not.toHaveBeenCalled();
    expect(deleteKey).not.toHaveBeenCalled();
    expect(listKeys).not.toHaveBeenCalled();
  });

  test("lists stored key metadata for the authenticated identity without caching", async () => {
    const response = await fetch(`${baseUrl}/api/v1/api-keys`, { headers });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ success: true, data: [{ id: "key-id", userId: "user-test", createdAt: "2026-10-17T00:00:00.000Z" }] });
    expect(listKeys).toHaveBeenCalledWith("user-test");
    listKeys.mockResolvedValueOnce({ success: false, data: null, message: "Internal server error" });
    expect((await fetch(`${baseUrl}/api/v1/api-keys`, { headers })).status).toBe(500);
  });

  test("allows browser preflight before authentication", async () => {
    const response = await fetch(`${baseUrl}/api/v1/api-keys`, { method: "OPTIONS", headers: {
      Origin: "http://localhost:3000", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization",
    } });
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  });

  test("creates keys for the authenticated identity", async () => {
    const response = await fetch(`${baseUrl}/api/v1/api-keys`, { method: "POST", headers });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true, data: { id: "key-id", key: "generated-secret" } });
    expect(createKey).toHaveBeenCalledWith("user-test");
  });

  test("reports key limits and creation service failures accurately", async () => {
    createKey.mockResolvedValueOnce({ success: false, data: null, message: "MAX_LIMIT_EXCEEDED" });
    const limited = await fetch(`${baseUrl}/api/v1/api-keys`, { method: "POST", headers });
    expect(limited.status).toBe(403);
    expect(await limited.json()).toMatchObject({ code: "MAX_LIMIT_EXCEEDED" });
    createKey.mockResolvedValueOnce({ success: false, data: null, message: "Internal server error" });
    const failed = await fetch(`${baseUrl}/api/v1/api-keys`, { method: "POST", headers });
    expect(failed.status).toBe(500);
    expect(await failed.json()).toMatchObject({ success: false });
  });

  test("deletes by key ID scoped to the authenticated user", async () => {
    const response = await fetch(`${baseUrl}/api/v1/api-keys/key-id`, { method: "DELETE", headers });
    expect(response.status).toBe(200);
    expect(deleteKey).toHaveBeenCalledWith("user-test", "key-id");
    deleteKey.mockResolvedValueOnce({ success: false, message: "API key not found" });
    expect((await fetch(`${baseUrl}/api/v1/api-keys/missing`, { method: "DELETE", headers })).status).toBe(404);
    deleteKey.mockResolvedValueOnce({ success: false, message: "Internal server error" });
    expect((await fetch(`${baseUrl}/api/v1/api-keys/key-id`, { method: "DELETE", headers })).status).toBe(500);
  });
});
