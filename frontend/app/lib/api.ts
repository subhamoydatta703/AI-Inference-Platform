export interface PlatformProfile {
  id: string;
  email: string;
}

export interface CreatedApiKey {
  id: string;
  key: string;
}

export interface PlatformApiKey {
  id: string;
  userId: string;
  createdAt: string;
}

async function apiKeyRequest(token: string, path: string, method: "GET" | "POST" | "DELETE", signal?: AbortSignal) {
  if (!token)
    throw new Error("Your session is unavailable. Please sign in again.");
  const backendUrl = (
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
  ).replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${backendUrl}/api/v1/api-keys${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error("Could not reach the API-key service. Check your keys before retrying.");
  }
  if (response.status === 401)
    throw new Error("Your session could not be verified. Please sign in again.");
  const result = await response.json();
  if (!response.ok || result.success !== true)
    throw new Error(result.message || "The API-key request failed. Please try again.");
  return result;
}

export async function getPlatformApiKeys(token: string, signal?: AbortSignal): Promise<PlatformApiKey[]> {
  const result = await apiKeyRequest(token, "", "GET", signal);
  if (!Array.isArray(result.data) || !result.data.every((item: PlatformApiKey) =>
    item && typeof item.id === "string" && typeof item.userId === "string" && typeof item.createdAt === "string"
  )) throw new Error("The API-key service returned an invalid key list. Please try again.");
  // Only retain metadata. The backend never returns stored hashes or raw secrets.
  return result.data.map(({ id, userId, createdAt }: PlatformApiKey) => ({ id, userId, createdAt }));
}

export async function createPlatformApiKey(token: string): Promise<CreatedApiKey> {
  const result = await apiKeyRequest(token, "", "POST");
  if (typeof result.data?.id !== "string" || typeof result.data?.key !== "string")
    throw new Error("The API-key service returned an invalid key. Check your keys before retrying.");
  return result.data;
}

export async function deletePlatformApiKey(token: string, id: string): Promise<void> {
  if (!id) throw new Error("API Key ID is required");
  await apiKeyRequest(token, `/${encodeURIComponent(id)}`, "DELETE");
}

export async function getPlatformProfile(
  token: string,
  signal?: AbortSignal,
): Promise<PlatformProfile> {
  if (!token)
    throw new Error("Your session is unavailable. Please sign in again.");
  const backendUrl = (
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
  ).replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${backendUrl}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(
      "Could not reach the account service. Make sure the backend is running and allows this frontend origin.",
    );
  }
  if (response.status === 401)
    throw new Error(
      "Your session could not be verified. Please sign in again.",
    );
  if (!response.ok)
    throw new Error(
      "The account service could not load your profile. Please try again.",
    );
  const result = await response.json();
  if (
    !result.success ||
    typeof result.data?.id !== "string" ||
    typeof result.data?.email !== "string"
  ) {
    throw new Error(
      "The account service returned an invalid profile. Please try again.",
    );
  }
  return result.data;
}
