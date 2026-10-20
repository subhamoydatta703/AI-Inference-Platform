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
const verifyKey = mock(async (key: string): Promise<{ success: boolean; data?: { userId: string } | null; message?: string }> =>
  key === "test-platform-key"
    ? { success: true, data: { userId: "key-owner" } }
    : { success: false, data: null },
);
const clerkRequests: string[] = [];
const runQuery = mock(async (userId: string, query: Record<string, unknown>) => ({
  userId,
  query: { ...query, conversationId: "generated-conversation" },
  response: "Model answer",
}));
mock.module("../../services/orchestrator/orchestratorService", () => ({
  OrchestratorService: class {
    run = runQuery;
  },
}));

// Isolate HTTP wiring from Clerk's network verification and the database.
mock.module("@clerk/express", () => ({
  clerkMiddleware: () => (req: Request, _res: Response, next: NextFunction) => {
    clerkRequests.push(req.originalUrl);
    next();
  },
}));
mock.module("../../middlewares/auth/authMiddleware", () => ({
  authMiddleware: (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
    if (req.headers.authorization !== "Bearer test-session")
      return res.status(401).json({ success: false, message: "Unauthorized" });
    req.userId = "user-test";
    next();
  },
}));
mock.module("../../services/apiKey/apiKeyService", () => ({ createApiKeyService: createKey, deleteApiKeyService: deleteKey, listApiKeysService: listKeys, verifyApiKeyService: verifyKey }));
mock.module("../../controllers/user/userController", () => ({
  getUserByIdController: (_req: Request, res: Response) => res.json({ success: true, data: { id: "user-test", email: "test@example.com" } }),
}));

let server: Server;
let baseUrl: string;
const headers = { Authorization: "Bearer test-session" };
const queryHeaders = { Authorization: "Bearer test-platform-key", "Content-Type": "application/json" };

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
  test("protects query execution with API-key authentication", async () => {
    const response = await fetch(`${baseUrl}/api/v1/queries`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Explain this" }),
    });
    expect(response.status).toBe(401);
    expect(verifyKey).not.toHaveBeenCalled();
    expect(runQuery).not.toHaveBeenCalled();
  });

  test("rejects empty and malformed bearer credentials before verification", async () => {
    for (const authorization of ["Bearer", "Bearer   ", "Basic test-platform-key"]) {
      const response = await fetch(`${baseUrl}/api/v1/queries`, {
        method: "POST", headers: { ...queryHeaders, Authorization: authorization },
        body: JSON.stringify({ query: "Explain this" }),
      });
      expect(response.status).toBe(401);
    }
    expect(verifyKey).not.toHaveBeenCalled();
    expect(runQuery).not.toHaveBeenCalled();
  });

  test("rejects invalid, revoked, and Clerk session tokens on query routes", async () => {
    for (const key of ["invalid-key", "revoked-key", "test-session"]) {
      const response = await fetch(`${baseUrl}/api/v1/queries`, {
        method: "POST", headers: { ...queryHeaders, Authorization: `Bearer ${key}` },
        body: JSON.stringify({ query: "Explain this" }),
      });
      expect(response.status).toBe(401);
      expect(verifyKey).toHaveBeenLastCalledWith(key);
    }
    expect(runQuery).not.toHaveBeenCalled();
    expect(clerkRequests).not.toContain("/api/v1/queries");
  });

  test("does not proceed when verification has no key owner", async () => {
    verifyKey.mockResolvedValueOnce({ success: true, data: null });
    const response = await fetch(`${baseUrl}/api/v1/queries`, {
      method: "POST", headers: queryHeaders, body: JSON.stringify({ query: "Explain" }),
    });
    expect(response.status).toBe(401);
    expect(runQuery).not.toHaveBeenCalled();
  });

  test("reports verification service failures as server errors", async () => {
    for (const failure of ["returned", "thrown"]) {
      if (failure === "returned") verifyKey.mockResolvedValueOnce({ success: false, message: "Internal server error" });
      else verifyKey.mockRejectedValueOnce(new Error("private-database-detail"));
      const response = await fetch(`${baseUrl}/api/v1/queries`, {
        method: "POST", headers: queryHeaders, body: JSON.stringify({ query: "Explain" }),
      });
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ success: false, message: "Internal server error" });
    }
    expect(runQuery).not.toHaveBeenCalled();
  });

  test("rejects missing or invalid query data before calling the orchestrator", async () => {
    for (const body of [undefined, {}, { query: "   " }, { query: 123 }, { query: "Explain", url: "invalid" }]) {
      const response = await fetch(`${baseUrl}/api/v1/queries`, {
        method: "POST", headers: queryHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ success: false });
    }
    expect(runQuery).not.toHaveBeenCalled();
  });

  test("passes validated context and the authenticated identity to query inference", async () => {
    const query = { query: "Explain this code", language: "javascript", code: "  return 1;\n", url: "https://example.com" };
    const response = await fetch(`${baseUrl}/api/v1/queries`, {
      method: "POST", headers: queryHeaders,
      body: JSON.stringify({ ...query, query: `  ${query.query}  `, userId: "forged-user" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(runQuery).toHaveBeenCalledWith("key-owner", query);
    expect(await response.json()).toEqual({
      success: true, message: "Query processed successfully",
      data: { userId: "key-owner", query: { ...query, conversationId: "generated-conversation" }, response: "Model answer" },
    });
  });

  test("handles orchestration failures without exposing provider details", async () => {
    runQuery.mockRejectedValueOnce(new Error("private-provider-detail"));
    const response = await fetch(`${baseUrl}/api/v1/queries`, {
      method: "POST", headers: queryHeaders,
      body: JSON.stringify({ query: "Explain this" }),
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, message: "Internal Server Error" });
  });

  test("keeps health and the authenticated profile route available", async () => {
    expect(await (await fetch(`${baseUrl}/health`)).json()).toEqual({ status: "ok" });
    expect((await fetch(`${baseUrl}/api/v1/users/me`, { headers })).status).toBe(200);
    expect(clerkRequests).toContain("/api/v1/users/me");
  });

  test("protects creation and deletion before calling services", async () => {
    expect((await fetch(`${baseUrl}/api/v1/api-keys`)).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/v1/api-keys`, { method: "POST" })).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/v1/api-keys/key-id`, { method: "DELETE" })).status).toBe(401);
    expect(createKey).not.toHaveBeenCalled();
    expect(deleteKey).not.toHaveBeenCalled();
    expect(listKeys).not.toHaveBeenCalled();
    expect((await fetch(`${baseUrl}/api/v1/api-keys`, { headers: queryHeaders })).status).toBe(401);
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
