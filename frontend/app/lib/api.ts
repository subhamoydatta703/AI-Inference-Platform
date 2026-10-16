export interface PlatformProfile {
  id: string;
  email: string;
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
