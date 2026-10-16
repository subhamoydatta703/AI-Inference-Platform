import { auth } from "@clerk/nextjs/server";

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    !process.env.CLERK_SECRET_KEY
  ) {
    return Response.json(
      { message: "Account connection is not configured yet." },
      { status: 503 },
    );
  }
  const { userId, getToken } = await auth();
  if (!userId)
    return Response.json(
      { message: "Sign in to view your account." },
      { status: 401 },
    );
  const token = await getToken();
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL || "http://localhost:5000"}/api/v1/users/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    const payload = await response.json();
    if (!response.ok)
      return Response.json(
        {
          message:
            response.status === 401
              ? "Your session could not be verified. Please sign in again."
              : "Could not load your profile. Please try again.",
        },
        { status: response.status },
      );
    return Response.json(payload, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      {
        message: "The account service is unavailable. Please try again later.",
      },
      { status: 502 },
    );
  }
}
