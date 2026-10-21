"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AccountButton, AccountSettings } from "./account";
import { ApiKeys } from "./api-keys";
import { useAuthAvailable } from "./auth-availability";
import { Brand, Icon, type IconName } from "./icons";
import { IntegrationDocs } from "./integration-docs";
import { orchestrationStages } from "../lib/integration";

const sections = [
  {
    id: "overview",
    title: "Overview",
    icon: "grid",
    description: "Your account, integration, and platform availability.",
  },
  {
    id: "keys",
    title: "API keys",
    icon: "key",
    description:
      "Connect your backend to the platform with an application API key.",
  },
  {
    id: "models",
    title: "Platform models",
    icon: "cube",
    description:
      "The models behind the platform. Routing is handled automatically.",
  },
  {
    id: "history",
    title: "Usage & history",
    icon: "chart",
    description: "Your evaluated queries and real platform activity.",
  },
  {
    id: "account",
    title: "Account",
    icon: "settings",
    description: "Your signed-in identity and synchronized platform profile.",
  },
  {
    id: "docs",
    title: "Integration docs",
    icon: "book",
    description:
      "Connect your backend using Python or TypeScript and a shared HTTP API.",
  },
] as const;
type Section = (typeof sections)[number]["id"];
const legacySections: Record<string, Section> = {
  playground: "docs",
  workspace: "docs",
  usage: "history",
  settings: "account",
};
function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
function readSection(): Section {
  const id = window.location.hash.slice(1);
  return (
    legacySections[id] ||
    (sections.some((item) => item.id === id) ? (id as Section) : "overview")
  );
}

export default function Console() {
  const section = useSyncExternalStore(
    subscribe,
    readSection,
    () => "overview" as Section,
  );
  const authAvailable = useAuthAvailable();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const active = sections.find((item) => item.id === section)!;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      )
        return;
      const input = document.querySelector<HTMLInputElement>(
        ".global-search input",
      );
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        input?.offsetParent
      ) {
        event.preventDefault();
        input.focus();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  function go(id: Section) {
    window.location.hash = id;
    setMobileOpen(false);
    setSearch("");
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast("Copied to clipboard");
    } catch {
      setToast("Clipboard unavailable. Select and copy the text manually.");
    }
  }

  return (
    <div className="console-shell orchestration-console">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${mobileOpen ? "is-open" : ""}`}
        aria-label="Console navigation"
      >
        <div className="sidebar-brand">
          <Link href="/" aria-label="Inference home">
            <Brand />
          </Link>
          <button
            className="icon-button mobile-only"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <button className="workspace-switch" onClick={() => go("account")}>
          <span className="workspace-avatar">
            <Icon name="shield" size={17} />
          </span>
          <span>
            <strong>Developer console</strong>
            <small>Orchestration & evaluation</small>
          </span>
          <Icon name="down" size={14} />
        </button>
        <span className="nav-label">PLATFORM</span>
        <nav>
          {sections.slice(0, 4).map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`nav-item ${section === item.id ? "active" : ""}`}
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => {
                setMobileOpen(false);
                setSearch("");
              }}
            >
              <Icon name={item.icon} />
              {item.title}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="preview-card">
            <span className="eyebrow">ONE REQUEST. EVALUATED INSIGHT.</span>
            <strong>Your backend, connected.</strong>
            <p>
              Python and TypeScript examples for the current query API.
            </p>
            <button className="text-button" onClick={() => go("docs")}>
              Read integration docs <Icon name="arrow" size={15} />
            </button>
          </div>
          {sections.slice(4).map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`nav-item ${section === item.id ? "active" : ""}`}
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <Icon name={item.icon} />
              {item.title}
            </a>
          ))}
          <div className="sidebar-footer">
            <Icon name="cube" size={18} />
            <div>
              <strong>Inference platform</strong>
              <small>Automatic model orchestration</small>
            </div>
            <Link href="/" aria-label="Go to website">
              <Icon name="external" size={16} />
            </Link>
          </div>
        </div>
      </aside>
      <div className="console-body">
        <header className="console-topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <span className="desktop-only">Platform</span>
            <Icon name="chevron" size={13} />
            <strong>{active.title}</strong>
          </div>
          <div className="topbar-actions">
            <div className="global-search">
              <Icon name="search" size={16} />
              <input
                aria-label="Search console pages"
                placeholder="Find a page…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>/</kbd>
              {search && (
                <div className="search-results">
                  {sections
                    .filter((item) =>
                      item.title.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((item) => (
                      <button key={item.id} onClick={() => go(item.id)}>
                        <Icon name={item.icon} />
                        {item.title}
                        <Icon name="arrow" size={14} />
                      </button>
                    ))}
                  {!sections.some((item) =>
                    item.title.toLowerCase().includes(search.toLowerCase()),
                  ) && <p>No pages found</p>}
                </div>
              )}
            </div>
            <AccountButton />
          </div>
        </header>
        <main className="console-main" id="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">ORCHESTRATION & EVALUATION</div>
              <h1>{active.title}</h1>
              <p>{active.description}</p>
            </div>
            {section === "overview" && (
              <button className="button primary" onClick={() => go("keys")}>
                <Icon name="key" size={16} />
                Manage API keys
              </button>
            )}
          </div>
          {section === "overview" && (
            <>
              <div className="capability-grid">
                <Capability
                  icon="shield"
                  title="Account access"
                  status={authAvailable ? "Available" : "Not configured"}
                  available={authAvailable}
                  text={
                    authAvailable
                      ? "Sign in with Clerk and load your backend profile."
                      : "Configure Clerk to connect your account."
                  }
                />
                <Capability
                  icon="cube"
                  title="Query inference"
                  status="Implemented"
                  available
                  text="Three model answers are evaluated into one final response, authenticated with your platform key."
                />
                <Capability
                  icon="key"
                  title="API-key service"
                  status="Available"
                  available
                  text="Create and revoke up to 5 API keys per account."
                />
              </div>
              <section className="panel platform-flow">
                <PanelTitle
                  title="How your query becomes an insight"
                  subtitle="The platform validates your request, gathers model answers, and evaluates them."
                />
                <Pipeline />
                <div className="panel-footnote">
                  <Icon name="clock" size={16} />
                  Provider credentials and quota must cover all three candidate
                  model calls and the evaluation call.
                </div>
              </section>
              <div className="overview-entry-grid">
                <section className="panel overview-entry">
                  <Icon name="key" size={25} />
                  <h2>Manage application access.</h2>
                  <p>
                    Create and revoke application keys with your signed-in
                    account. Use a platform key to authenticate query requests.
                  </p>
                  <button className="button" onClick={() => go("keys")}>
                    View API keys <Icon name="arrow" size={16} />
                  </button>
                </section>
                <section className="panel overview-entry">
                  <Icon name="code" size={25} />
                  <h2>Integrate from your own backend.</h2>
                  <p>
                    Use the current HTTP contract in Python and TypeScript.
                    Send a query and optional code with a platform API key.
                  </p>
                  <button className="button" onClick={() => go("docs")}>
                    Read integration docs <Icon name="arrow" size={16} />
                  </button>
                </section>
              </div>
              <section className="panel activity-empty">
                <Icon name="chart" size={24} />
                <div>
                  <h2>Activity will appear here</h2>
                  <p>
                    Usage and history will show your actual query activity once
                    those services are connected.
                  </p>
                </div>
                <button className="text-button" onClick={() => go("history")}>
                  View availability <Icon name="arrow" size={15} />
                </button>
              </section>
            </>
          )}
          {section === "keys" && <ApiKeys />}
          {section === "models" && (
            <>
              <ServiceNotice
                title="Three candidate models and one evaluation step"
                text="Groq hosts GPT-OSS 20B, GPT-OSS 120B, and Qwen 3.8 27B. GPT-OSS 120B also evaluates the collected answers. The API returns a final answer, not a winning model."
              />
              <section className="panel">
                <PanelTitle
                  title="Models used by the platform"
                  subtitle="Informational only. Users do not choose a model."
                />
                <div className="empty-state">
                  <span className="empty-icon">
                    <Icon name="cube" size={27} />
                  </span>
                  <h2>GPT-OSS 20B</h2>
                  <p>
                    Provider: Groq · Model: openai/gpt-oss-20b
                    <br />
                    One of three candidate models used for each query.
                    <br />
                    Other candidates: openai/gpt-oss-120b and qwen/qwen3.8-27b.
                    <br />
                    Evaluation: openai/gpt-oss-120b.
                  </p>
                </div>
                <div className="panel-footnote">
                  <Icon name="shield" size={16} />This reflects the current backend
                  configuration. Provider availability depends on backend credentials and quota.
                </div>
              </section>
              <section className="panel platform-flow">
                <PanelTitle title="Automatic orchestration" />
                <Pipeline />
              </section>
            </>
          )}
          {section === "history" && (
            <>
              <ServiceNotice
                title="Usage and query history are not connected"
                text="Request history and usage metrics are not available yet. Your query activity will appear here when those services are connected."
              />
              <section className="panel">
                <PanelTitle
                  title="Query history"
                  subtitle="Persistent conversation history is not implemented yet."
                />
                <div className="empty-state">
                  <span className="empty-icon">
                    <Icon name="clock" size={27} />
                  </span>
                  <h2>No history data available</h2>
                  <p>
                    Completed queries and usage metrics will appear here once
                    connected.
                    <br />
                    Usage cannot be reported while the history service is
                    unavailable.
                  </p>
                  <button className="button" onClick={() => go("keys")}>
                    Manage API keys <Icon name="arrow" size={16} />
                  </button>
                </div>
              </section>
            </>
          )}
          {section === "account" && (
            <section className="panel settings-panel">
              <PanelTitle
                title="Your platform profile"
                subtitle="Real account data from the backend, authenticated with Clerk."
              />
              <div className="settings-content">
                <AccountSettings />
              </div>
            </section>
          )}
          {section === "docs" && (
            <IntegrationDocs copy={(value) => void copy(value)} />
          )}
          <footer className="console-footer">
            <span>Queries in. Evaluated insights out.</span>
            <span>Python · TypeScript · HTTP</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={17} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function PanelTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
function Capability({
  icon,
  title,
  status,
  available = false,
  text,
}: {
  icon: IconName;
  title: string;
  status: string;
  available?: boolean;
  text: string;
}) {
  return (
    <section className="panel capability">
      <div>
        <Icon name={icon} size={21} />
        <span className={`tag ${available ? "available" : ""}`}>{status}</span>
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}
function ServiceNotice({ title, text }: { title: string; text: string }) {
  return (
    <div className="availability-notice">
      <Icon name="clock" size={19} />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}
export function Pipeline({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={`orchestration-pipeline ${compact ? "compact" : ""}`}>
      {orchestrationStages.map((stage, index) => (
        <li key={stage.title}>
          <span className="pipeline-icon">
            <Icon name={stage.icon} size={20} />
          </span>
          <span className="pipeline-step">0{index + 1}</span>
          <h3>{stage.title}</h3>
          <p>{stage.description}</p>
          {index < orchestrationStages.length - 1 && (
            <Icon name="arrow" size={17} />
          )}
        </li>
      ))}
    </ol>
  );
}
