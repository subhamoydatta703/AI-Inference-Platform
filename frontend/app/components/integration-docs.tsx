"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { maxApiKeys } from "../lib/platform";
import {
  exampleQuery,
  integrationSnippet,
  queryPath,
  exampleResponse,
  type IntegrationLanguage,
} from "../lib/integration";

export function IntegrationDocs({ copy }: { copy: (value: string) => void }) {
  const [language, setLanguage] = useState<IntegrationLanguage>("Python");
  return (
    <div className="integration-layout">
      <section className="panel integration-main">
        <div className="integration-intro">
          <span className="eyebrow">BACKEND TO BACKEND</span>
          <h2>Send a query. Receive an evaluated answer.</h2>
          <p>
            Send a query with optional code, language, and a URL. The current
            platform calls three candidate models in parallel. When multiple
            answers are available, it evaluates them against your original query.
            A single available answer is returned directly. You do not select a model.
          </p>
        </div>
        <div className="availability-notice">
          <Icon name="clock" size={18} />
          <div>
            <strong>Query endpoint available with API-key authentication</strong>
            <p>
              Send your platform API key as an Authorization Bearer token.
              The backend identifies your account from the key; no user ID
              belongs in the request body.
            </p>
          </div>
        </div>
        <div className="integration-steps">
          <div>
            <span className="step">1</span>
            <div>
              <h3>Create a platform API key</h3>
              <p>
                Sign in, open API keys, and create a key. Copy it immediately
                and store it as INFERENCE_API_KEY in your backend. Existing
                key secrets cannot be retrieved. You can create up to {maxApiKeys} keys.
              </p>
            </div>
          </div>
          <div>
            <span className="step">2</span>
            <div>
              <h3>Send a query and context</h3>
              <p>
                Use an HTTP POST request. No model selection or provider
                credentials are required in the request body.
              </p>
            </div>
          </div>
          <div>
            <span className="step">3</span>
            <div>
              <h3>Receive the evaluated answer</h3>
              <p>
                Both examples print the complete JSON response. Read
                data.response for the selected answer (text by default),
                data.query for the original query, and data.conversationId for
                its identifier. Model rankings and user IDs are not part of
                this response. Each request starts a new conversation;
                history and follow-up context are not stored yet.
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
              <h3>Response shape</h3>
              <button
                className="icon-button"
                aria-label="Copy response shape"
                onClick={() => copy(JSON.stringify(exampleResponse, null, 2))}
              >
                <Icon name="copy" size={15} />
              </button>
            </div>
            <p>
              The API returns a JSON object. data.response contains the selected
              answer: a string in text mode, or parsed JSON in JSON mode.
              data.rawText, when present, contains the answer before parsing.
              Escaped newlines such as {"\\n"} are normal inside JSON strings.
              The echoed data.query does not include responseType.
            </p>
            <pre className="code-block">
              <code>{JSON.stringify(exampleResponse, null, 2)}</code>
            </pre>
          </section>
        </div>
      </section>
      <aside className="integration-aside">
        <section className="panel">
          <span className="tag available">LIVE ENDPOINT</span>
          <h3>Process a query</h3>
          <code>POST {queryPath}</code>
          <p>
            Authentication: <code>Authorization: Bearer &lt;INFERENCE_API_KEY&gt;</code>
          </p>
          <p>
            query is required and must contain non-whitespace text. Omit
            unused optional fields; url must be a valid URL if provided.
            A URL is passed as context; its contents are not fetched.
          </p>
          <p>
            Set <code>responseType</code> to <code>text</code> (the default) or
            {" "}<code>json</code>. For JSON mode, describe the desired JSON
            structure in your query. Invalid JSON can produce a null answer;
            check the returned answer before using it.
          </p>
        </section>
        <section className="panel">
          <Icon name="shield" size={23} />
          <h3>Keep API keys in your backend</h3>
          <p>
            Your application uses INFERENCE_API_KEY for platform requests.
            Keep this credential in your server environment. Never expose it in
            browser code or commit it to your repository.
          </p>
          <code>INFERENCE_BASE_URL</code>
          <code>INFERENCE_API_KEY</code>
        </section>
        <section className="panel">
          <h3>Error responses</h3>
          <p>400: invalid request, with validation issues in errors. 401: missing
            or invalid API key, including revoked keys. 429: request limit exceeded.
            500: authentication
            service or query processing failed.</p>
          <p>Each account can make 10 requests per minute and 100 per day, shared
            across its keys and authenticated routes. On HTTP 429, wait for the
            number of seconds in the Retry-After header before retrying.</p>
          <p>Candidate calls run in parallel. Failed calls and null or undefined
            answers are excluded before evaluation. Multiple remaining candidates
            are evaluated; a single remaining candidate is returned directly.
            An evaluation failure returns 500.</p>
          <p>If all candidates fail, the current backend can return HTTP 200 with
            success set to true, data.error, and no data.response. The examples
            reject this result and null answers. Do not treat HTTP 200 alone as
            proof that an answer is available.</p>
          <p>The endpoint returns one complete JSON response; it does not stream
            tokens to clients. Queries are queued with one orchestration request
            active at a time. Requests may take longer than a single model call; the examples use
            a 120-second client timeout, which you can adjust for your deployment.</p>
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
