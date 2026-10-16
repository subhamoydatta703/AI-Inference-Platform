import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { getPlatformProfile } from "../app/lib/api";

const originalBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
afterEach(() => {
  mock.restore();
  if (originalBackendUrl === undefined)
    delete process.env.NEXT_PUBLIC_BACKEND_URL;
  else process.env.NEXT_PUBLIC_BACKEND_URL = originalBackendUrl;
});

describe("direct authenticated profile requests", () => {
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
