"use client";

import {
  ClerkFailed,
  ClerkLoading,
  SignInButton,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { useAuthAvailable } from "./auth-availability";
import { getPlatformProfile, type PlatformProfile } from "../lib/api";

export function AccountButton() {
  const authAvailable = useAuthAvailable();
  if (!authAvailable)
    return (
      <span className="avatar" title="Account is not configured">
        PW
      </span>
    );
  return <ConnectedAccountButton />;
}

function ConnectedAccountButton() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded)
    return (
      <>
        <ClerkLoading>
          <span className="button small" role="status">
            Loading sign-in…
          </span>
        </ClerkLoading>
        <ClerkFailed>
          <span className="error-message" role="alert">
            Sign-in service unavailable
          </span>
        </ClerkFailed>
      </>
    );
  return isSignedIn ? (
    <UserButton />
  ) : (
    <SignInButton mode="modal">
      <button className="button small">
        Sign in <Icon name="arrow" size={14} />
      </button>
    </SignInButton>
  );
}

export function AccountSettings() {
  const authAvailable = useAuthAvailable();
  if (!authAvailable)
    return (
      <div className="notice">
        <Icon name="shield" />
        <div>
          <strong>Account connection is not configured</strong>
          <p>
            Authentication will be available when this workspace is connected to
            Clerk.
          </p>
        </div>
      </div>
    );
  return <ConnectedAccountSettings />;
}

function ConnectedAccountSettings() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    userId: string;
    attempt: number;
    profile: PlatformProfile | null;
    error: string;
  } | null>(null);
  const currentResult =
    result?.userId === userId && result?.attempt === attempt ? result : null;
  const profile = currentResult?.profile;
  const error = currentResult?.error;
  const loading = Boolean(isSignedIn && !currentResult);

  useEffect(() => {
    if (!isSignedIn || !userId) return;
    const controller = new AbortController();
    async function loadProfile() {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        const profile = await getPlatformProfile(
          token || "",
          controller.signal,
        );
        if (!controller.signal.aborted)
          setResult({ userId: userId!, attempt, profile, error: "" });
      } catch (err) {
        if (!controller.signal.aborted)
          setResult({
            userId: userId!,
            attempt,
            profile: null,
            error:
              err instanceof Error
                ? err.message
                : "Could not load your profile.",
          });
      }
    }
    void loadProfile();
    return () => controller.abort();
  }, [isSignedIn, userId, getToken, attempt]);

  if (!isLoaded)
    return (
      <>
        <ClerkLoading>
          <p className="muted" role="status">
            Loading account…
          </p>
        </ClerkLoading>
        <ClerkFailed>
          <p className="error-message" role="alert">
            The sign-in service is unavailable. Please try again later.
          </p>
        </ClerkFailed>
      </>
    );
  if (!isSignedIn)
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <Icon name="shield" size={26} />
        </span>
        <h3>Your workspace starts here</h3>
        <p>Sign in to connect your account to the platform.</p>
        <SignInButton mode="modal">
          <button className="button primary">
            Sign in to your account <Icon name="arrow" size={16} />
          </button>
        </SignInButton>
      </div>
    );
  return (
    <>
      <div className="settings-row">
        <div>
          <label>Email address</label>
          <p>{user.primaryEmailAddress?.emailAddress}</p>
        </div>
        <UserButton />
      </div>
      <div className="settings-row">
        <div>
          <label>Platform profile</label>
          <p className="muted">
            {loading
              ? "Connecting your signed-in account…"
              : profile
                ? "Your account is synchronized with the inference platform."
                : "Your Clerk login is active. Retry connecting your platform profile."}
          </p>
        </div>
        <button
          className="button"
          disabled={loading}
          onClick={() => setAttempt((value) => value + 1)}
        >
          {loading
            ? "Connecting…"
            : profile
              ? "Refresh profile"
              : "Retry connection"}
          <Icon name="arrow" size={16} />
        </button>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {profile && (
        <div className="notice success">
          <Icon name="check" />
          <div>
            <strong>Account connected</strong>
            <p>{profile.email}</p>
            <code>{profile.id}</code>
          </div>
        </div>
      )}
    </>
  );
}
