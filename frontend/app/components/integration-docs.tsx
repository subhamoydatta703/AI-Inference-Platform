"use client";

import { useState } from "react";
import { Icon } from "./icons";
import {
  exampleQuery,
  integrationSnippet,
  proposedQueryPath,
  proposedResponse,
  type IntegrationLanguage,
} from "../lib/integration";

export function IntegrationDocs({ copy }: { copy: (value: string) => void }) {
  const [language, setLanguage] = useState<IntegrationLanguage>("Python");
  return (
    <div className="integration-layout">
      <section className="panel integration-main">
        <div className="integration-intro">
          <span className="eyebrow">BACKEND TO BACKEND</span>
          <h2>Connect once. Let the platform evaluate.</h2>
          <p>
            Your backend sends a query and optional code or documentation. The
            platform orchestrates the models, evaluates their answers, and
            returns a final insight.
          </p>
        </div>
        <div className="availability-notice">
          <Icon name="clock" size={18} />
          <div>
            <strong>Proposed API contract — not available yet</strong>
            <p>
              The request and response below describe the intended integration.
              API-key creation and revocation are available; the query endpoint is not implemented.
              These examples will not run against the current backend.
            </p>
          </div>
        </div>
        <div className="integration-steps">
          <div>
            <span className="step">1</span>
            <div>
              <h3>Create an API key</h3>
              <p>
                Create a key in the API keys page, then save it in your backend.
                Up to 5 keys are allowed per account.
              </p>
            </div>
          </div>
          <div>
            <span className="step">2</span>
            <div>
              <h3>Send a query and context</h3>
              <p>
                Use an HTTP POST request. No model selection or provider
                credentials are required in the proposed request.
              </p>
            </div>
          </div>
          <div>
            <span className="step">3</span>
            <div>
              <h3>Receive the evaluated insight</h3>
              <p>
                Your backend receives the final result and returns it to your
                application.
              </p>
            </div>
          </div>
        </div>
        <div className="code-toolbar">
          <div
            className="tabs"
            role="tablist"
            aria-label="Integration language"
          >
            {(["Python", "TypeScript"] as const).map((item) => (
              <button
                key={item}
                role="tab"
                id={`language-${item}`}
                aria-selected={language === item}
                aria-controls="integration-code"
                className={language === item ? "selected" : ""}
                onClick={() => setLanguage(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            className="button small"
            onClick={() => copy(integrationSnippet(language))}
          >
            <Icon name="copy" size={14} />
            Copy code
          </button>
        </div>
        <pre
          className="code-block integration-code"
          id="integration-code"
          role="tabpanel"
          aria-labelledby={`language-${language}`}
        >
          <code>{integrationSnippet(language)}</code>
        </pre>
        <p className="code-scroll-hint">
          Scroll within the example to view the full code. Copy code includes
          the complete snippet.
        </p>
        <div className="contract-grid">
          <section>
            <div className="contract-heading">
              <h3>Request body</h3>
              <button
                className="icon-button"
                aria-label="Copy request body"
                onClick={() => copy(JSON.stringify(exampleQuery, null, 2))}
              >
                <Icon name="copy" size={15} />
              </button>
            </div>
            <pre className="code-block">
              <code>{JSON.stringify(exampleQuery, null, 2)}</code>
            </pre>
          </section>
          <section>
            <div className="contract-heading">
              <h3>Proposed response shape</h3>
              <button
                className="icon-button"
                aria-label="Copy response shape"
                onClick={() => copy(JSON.stringify(proposedResponse, null, 2))}
              >
                <Icon name="copy" size={15} />
              </button>
            </div>
            <pre className="code-block">
              <code>{JSON.stringify(proposedResponse, null, 2)}</code>
            </pre>
          </section>
        </div>
      </section>
      <aside className="integration-aside">
        <section className="panel">
          <span className="tag">PROPOSED ENDPOINT</span>
          <h3>Evaluate a query</h3>
          <code>POST {proposedQueryPath}</code>
          <p>
            Authentication: <code>Authorization: Bearer &lt;API_KEY&gt;</code>
          </p>
          <p>
            JSON request and response. The orchestration layer chooses the
            models.
          </p>
        </section>
        <section className="panel">
          <Icon name="shield" size={23} />
          <h3>Keep keys in your backend</h3>
          <p>
            Store the API key in a server environment variable. Never bundle it
            in browser code or commit it to your repository.
          </p>
          <code>INFERENCE_BASE_URL</code>
          <code>INFERENCE_API_KEY</code>
        </section>
        <section className="panel">
          <span className="tag available">LIVE ENDPOINT</span>
          <h3>Your account profile</h3>
          <code>GET /api/v1/users/me</code>
          <p>
            This existing endpoint uses a Clerk session token, not a platform
            API key. Your Account page already connects to it.
          </p>
          <a className="text-button" href="#account">
            Open account <Icon name="arrow" size={14} />
          </a>
        </section>
      </aside>
    </div>
  );
}
