"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPlatformApiKey, deletePlatformApiKey, getPlatformApiKeys, type PlatformApiKey } from "../lib/api";
import { useAuthAvailable } from "./auth-availability";
import { Icon } from "./icons";

export function ApiKeys() {
  const authAvailable = useAuthAvailable();
  return authAvailable ? <ConnectedApiKeys /> : <KeyPanel />;
}

function ConnectedApiKeys() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  // Remount on identity changes so keys can never appear in another account.
  return isLoaded && isSignedIn && userId
    ? <AccountKeys key={userId} userId={userId} />
    : <KeyPanel />;
}

function AccountKeys({ userId }: { userId: string }) {
  const { getToken } = useAuth();
  const [keys, setKeys] = useState<PlatformApiKey[]>([]);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [synced, setSynced] = useState(false);
  const [action, setAction] = useState<string | null>("load");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pending = useRef(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const token = (await getToken()) || "";
    if (signal?.aborted) return;
    const stored = await getPlatformApiKeys(token, signal);
    if (signal?.aborted) return;
    return stored;
  }, [getToken]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal).then((stored) => {
      if (!controller.signal.aborted && stored) {
        setKeys(stored);
        setSynced(true);
      }
    }).catch((error) => {
      if (!controller.signal.aborted) {
        setSynced(false);
        setError(error instanceof Error ? error.message : "Could not load API keys.");
      }
    }).finally(() => {
      if (!controller.signal.aborted) setAction(null);
    });
    return () => controller.abort();
  }, [refresh]);

  async function mutate(nextAction: string, operation: () => Promise<void>, revokedId?: string) {
    if (pending.current) return;
    pending.current = true;
    setAction(nextAction);
    setError("");
    setCopiedId(null);
    let message = "";
    try {
      await operation();
    } catch (error) {
      message = error instanceof Error ? error.message : "The API-key request failed.";
    }
    // Reconcile even failed or timed-out mutations with the actual stored keys.
    if (nextAction !== "copy") {
      try {
        const stored = await refresh();
        if (!stored) throw new Error("Missing stored key list");
        setKeys(stored);
        setSynced(true);
        if (revokedId && stored?.some((key) => key.id === revokedId)) {
          message ||= "The key is still stored in the backend. Revocation could not be confirmed. Please retry.";
        } else if (revokedId) {
          setSecrets((current) => {
            const remaining = { ...current };
            delete remaining[revokedId];
            return remaining;
          });
        }
      } catch {
        setSynced(false);
        message = [message, "Could not refresh stored keys. Retry loading before creating another key."].filter(Boolean).join(" ");
      }
    }
    setError(message);
    pending.current = false;
    setAction(null);
  }

  return <KeyPanel
    keys={keys.map((key) => ({ ...key, key: secrets[key.id] }))}
    userId={userId}
    action={action}
    copiedId={copiedId}
    error={error}
    synced={synced}
    retry={() => void mutate("load", async () => {})}
    create={() => void mutate("create", async () => {
      const created = await createPlatformApiKey((await getToken()) || "");
      setSecrets((current) => ({ ...current, [created.id]: created.key }));
    })}
    revoke={(id) => void mutate(`delete:${id}`, async () => {
      await deletePlatformApiKey((await getToken()) || "", id);
    }, id)}
    copy={(id, value) => void mutate("copy", async () => {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
    })}
  />;
}

function KeyPanel({ keys = [], userId, action = null, copiedId = null, error = "", synced = false, retry, create, revoke, copy }: {
  keys?: (PlatformApiKey & { key?: string })[];
  synced?: boolean;
  retry?: () => void;
  userId?: string;
  action?: string | null;
  copiedId?: string | null;
  error?: string;
  create?: () => void;
  revoke?: (id: string) => void;
  copy?: (id: string, value: string) => void;
}) {
  const busy = action !== null;
  return <>
    <div className="availability-notice">
      <Icon name="clock" size={19} />
      <div>
        <strong>API-key creation and revocation are available</strong>
        <p>Up to 5 keys per account. Your stored keys are loaded from the backend. Revoking a key deletes it and frees a slot. Copy new keys before leaving this page; existing secrets cannot be retrieved.</p>
      </div>
    </div>
    <section className="panel api-keys-panel" aria-busy={busy}>
      <div className="panel-heading">
        <div><h2>Application API keys</h2><p>Authenticate calls from your own backend.</p></div>
        <button className="button primary" disabled={!create || !synced || busy || keys.length >= 5} aria-describedby="keys-availability" onClick={create}>
          {action === "create" ? <span className="loading-spinner" aria-hidden="true" /> : <Icon name="plus" size={16} />}
          {action === "create" ? "Creating…" : "Create API key"}
        </button>
      </div>
      {error && <div className="error-message api-key-message" role="alert">{error}{retry && <button className="button small" disabled={busy} onClick={retry}>Retry loading keys</button>}</div>}
      <span className="sr-only" role="status">{action === "load" ? "Loading API keys…" : action === "create" ? "Creating API key…" : action?.startsWith("delete:") ? "Deleting API key…" : ""}</span>
      {keys.length ? <ul className="api-key-list" aria-label="Application API keys">
        {keys.map((item, index) => <li className="api-key-row" key={item.id}>
          <span className="api-key-icon"><Icon name="key" size={20} /></span>
          <div className="api-key-details">
            <strong>API key</strong>
            <KeySecret value={item.key} number={index + 1} />
            <p><span>User ID</span><code>{item.userId || userId}</code></p>
          </div>
          <div className="api-key-actions">
            <button className="button" disabled={busy || !item.key} title={item.key ? "Copy API key" : "Only newly created keys can be copied"} onClick={() => { if (item.key) copy?.(item.id, item.key); }} aria-label={`Copy API key ${index + 1}`}>
              <Icon name={copiedId === item.id ? "check" : "copy"} size={14} />
              {copiedId === item.id ? "Copied" : "Copy key"}
            </button>
            <button className="button" disabled={busy} onClick={() => revoke?.(item.id)} aria-label={`Revoke API key ${index + 1}`}>
              {action === `delete:${item.id}` ? <span className="loading-spinner" aria-hidden="true" /> : <Icon name="trash" size={14} />}
              {action === `delete:${item.id}` ? "Deleting…" : "Revoke"}
            </button>
          </div>
        </li>)}
      </ul> : <div className="empty-state key-empty">
        <span className="empty-icon"><Icon name="key" size={27} /></span>
        <h2>{action === "load" ? "Loading API keys…" : synced ? "No API keys yet" : "No key data available"}</h2>
        <p id="keys-availability">{create ? synced ? "Create an API key to connect your backend." : "Connecting to your stored API keys." : "Sign in to create and revoke application API keys."}</p>
        <button className="button" onClick={() => { window.location.hash = "docs"; }}>Read integration docs <Icon name="arrow" size={16} /></button>
      </div>}
      {keys.length > 0 && <p className="muted api-key-message" id="keys-availability">Copy and save your keys now. They cannot be retrieved after leaving this page. Query evaluation is not available yet.</p>}
      <div className="panel-footnote"><Icon name="shield" size={16} />API keys authenticate your backend’s HTTP requests. Keep them in your server environment.</div>
    </section>
  </>;
}

function KeySecret({ value, number }: { value?: string; number: number }) {
  const [visible, setVisible] = useState(false);
  return <div className="api-key-secret">
    <code aria-label={visible ? `API key ${number}` : `API key ${number} hidden`}>
      {visible ? value : "••••••••••••••••"}
    </code>
    <button
      type="button"
      className="api-key-visibility"
      disabled={!value}
      onClick={() => setVisible((current) => !current)}
      aria-label={`${visible ? "Hide" : "Show"} API key ${number}`}
      aria-pressed={visible}
      title={!value ? "This secret was shown only when the key was created" : visible ? "Hide API key" : "Show API key"}
    >
      <Icon name={visible ? "eyeOff" : "eye"} size={16} />
    </button>
  </div>;
}
