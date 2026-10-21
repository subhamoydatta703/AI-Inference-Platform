import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { createPlatformApiKey, deletePlatformApiKey, getPlatformApiKeys, getPlatformProfile } from "../app/lib/api";

const originalBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
afterEach(() => {
  mock.restore();
  if (originalBackendUrl === undefined)
    delete process.env.NEXT_PUBLIC_BACKEND_URL;
  else process.env.NEXT_PUBLIC_BACKEND_URL = originalBackendUrl;
});

describe("authenticated API-key lifecycle", () => {
  test("loads the backend key list using the authenticated GET route", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:5000/";
    const stored = { id: "old-key", userId: "user_test", createdAt: "2026-10-17T00:00:00.000Z" };
    const request = spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ success: true, data: [stored] }));
    expect(await getPlatformApiKeys("token")).toEqual([stored]);
    expect(request).toHaveBeenCalledWith("http://localhost:5000/api/v1/api-keys", expect.objectContaining({ method: "GET", headers: { Authorization: "Bearer token" }, cache: "no-store" }));
    request.mockResolvedValue(Response.json({ success: true, data: null }));
    await expect(getPlatformApiKeys("token")).rejects.toThrow("invalid key list");
  });
  test("creates a backend key with a Clerk token and no invented fields", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:5000/";
    const key = { id: "key-id", key: "backend-generated-secret" };
    const request = spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, data: key }, { status: 201 }),
    );
    expect(await createPlatformApiKey("session-token")).toEqual(key);
    expect(request).toHaveBeenCalledWith("http://localhost:5000/api/v1/api-keys", expect.objectContaining({
      method: "POST",
      headers: { Authorization: "Bearer session-token" },
      cache: "no-store",
    }));
  });

  test("deletes by the backend ID rather than sending the secret", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:5000";
    const request = spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, message: "API key deleted successfully" }),
    );
    await deletePlatformApiKey("session-token", "key/id");
    expect(request).toHaveBeenCalledWith("http://localhost:5000/api/v1/api-keys/key%2Fid", expect.objectContaining({
      method: "DELETE",
      headers: { Authorization: "Bearer session-token" },
    }));
  });

  test("does not send mutations without a token or deletion ID", async () => {
    const request = spyOn(globalThis, "fetch");
    await expect(createPlatformApiKey("")).rejects.toThrow("Please sign in again");
    await expect(deletePlatformApiKey("", "key-id")).rejects.toThrow("Please sign in again");
    await expect(deletePlatformApiKey("token", "")).rejects.toThrow("ID is required");
    expect(request).not.toHaveBeenCalled();
  });

  test("uses the enforced three-key limit despite the backend's stale error text", async () => {
    const request = spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: false, code: "MAX_LIMIT_EXCEEDED", message: "You have reached the maximum limit of 5 API keys." }, { status: 403 }),
    );
    await expect(createPlatformApiKey("token")).rejects.toThrow("maximum limit of 3 API keys");
    request.mockResolvedValue(Response.json({ success: false, message: "API key not found" }, { status: 404 }));
    await expect(deletePlatformApiKey("token", "missing")).rejects.toThrow("API key not found");
  });

  test("rejects false success and malformed creation payloads", async () => {
    const request = spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ success: true, data: null }));
    await expect(createPlatformApiKey("token")).rejects.toThrow("invalid key");
    request.mockResolvedValue(Response.json({ success: false, message: "Internal server error" }));
    await expect(createPlatformApiKey("token")).rejects.toThrow("Internal server error");
  });
});

describe("direct authenticated profile requests", () => {
  test("preserves backend profile initialization errors so users can resolve them", async () => {
    const message = "No email address found in session token. Please ensure session token claims are configured in Clerk.";
    spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: false, message }, { status: 400 }),
    );
    await expect(getPlatformProfile("session-token")).rejects.toThrow(message);
  });

  test("calls the configured backend with a Clerk bearer token", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:5000/";
    const profile = { id: "user_test", email: "developer@example.com" };
    const fetchMock = spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, data: profile }),
    );
    expect(await getPlatformProfile("test-session-token")).toEqual(profile);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/v1/users/me",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-session-token" },
        cache: "no-store",
      }),
    );
  });

  test("does not send an unauthenticated profile request", async () => {
    const fetchMock = spyOn(globalThis, "fetch");
    await expect(getPlatformProfile("")).rejects.toThrow(
      "Please sign in again",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("explains rejected sessions and backend connection failures", async () => {
    const fetchMock = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 }),
    );
    await expect(getPlatformProfile("test-token")).rejects.toThrow(
      "session could not be verified",
    );
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(getPlatformProfile("test-token")).rejects.toThrow(
      "Make sure the backend is running",
    );
  });

  test("rejects malformed success responses", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, data: {} }),
    );
    await expect(getPlatformProfile("test-token")).rejects.toThrow(
      "invalid profile",
    );
  });
});
