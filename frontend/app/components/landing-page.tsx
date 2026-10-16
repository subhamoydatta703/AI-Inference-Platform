import Link from "next/link";
import { AccountButton } from "./account";
import { Brand, Icon, type IconName } from "./icons";
import { ProductPreview } from "./product-preview";
import { ProductStage } from "./product-stage";
import {
  orchestrationStages,
  shortIntegrationSnippet,
} from "../lib/integration";

export default function LandingPage() {
  return (
    <div className="marketing-site">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <Link href="/" aria-label="Inference home">
          <Brand />
        </Link>
        <nav aria-label="Main navigation">
          <a href="#platform">Platform</a>
          <Link href="/console#models">Models</Link>
          <a href="#developers">Developers</a>
          <Link href="/console#docs">
            Integration docs <Icon name="external" size={12} />
          </Link>
        </nav>
        <div className="site-header-actions">
          <AccountButton />
          <Link href="/console" className="button primary small">
            Open console <Icon name="arrow" size={15} />
          </Link>
        </div>
      </header>
      <main id="main-content">
        <section className="hero">
          <div className="hero-eyebrow">
            <span className="status-dot" /> ORCHESTRATION{" "}
            <span className="eyebrow-divider" /> INDEPENDENT EVALUATION
          </div>
          <h1>
            Many perspectives.
            <br />
            <span>One evaluated insight.</span>
          </h1>
          <p>
            One HTTP API for orchestration and evaluation.
            <br className="desktop-only" /> Send queries and context from your
            backend. Receive evaluated insights.
          </p>
          <div className="hero-actions">
            <Link href="/console#docs" className="button primary large">
              Read integration docs <Icon name="arrow" size={17} />
            </Link>
            <Link href="/console#keys" className="button large">
              Manage API keys
            </Link>
          </div>
          <div className="hero-note">
            <Icon name="terminal" size={13} />
            Account access is live. Query and API-key services are in
            development.
          </div>
          <ProductStage>
            <ProductPreview />
          </ProductStage>
          <div className="hero-caption">
            <span>Your query. Your context.</span> Model routing is the
            platform’s job.
          </div>
        </section>
        <section className="landing-section platform-section" id="platform">
          <div className="section-intro">
            <span className="eyebrow">FROM QUESTION TO EVALUATED INSIGHT</span>
            <h2>More than a model response.</h2>
            <p>
              An orchestration layer brings model answers together.
              <br className="desktop-only" /> A separate evaluator checks them
              before returning the final insight.
            </p>
          </div>
          <div className="platform-feature-grid">
            <div className="feature-product orchestration-feature">
              <div className="feature-product-header">
                <Icon name="cube" size={18} />
                <strong>The intended query flow</strong>
                <span className="tag">ARCHITECTURE</span>
              </div>
              {orchestrationStages.map((stage, index) => (
                <div className="feature-model" key={stage.title}>
                  <span className="pipeline-icon">
                    <Icon name={stage.icon} size={21} />
                  </span>
                  <div>
                    <strong>{stage.title}</strong>
                    <small>{stage.description}</small>
                  </div>
                  <span className="model-context">0{index + 1}</span>
                </div>
              ))}
              <div className="feature-product-footer">
                <span>Automatic routing. Independent evaluation.</span>
                <Link
                  href="/console#docs"
                  aria-label="Explore HTTP integration"
                >
                  <Icon name="arrow" size={18} />
                </Link>
              </div>
            </div>
            <div className="feature-list">
              {[
                {
                  icon: "book",
                  title: "Give the question its context",
                  text: "Include source code or documentation in your backend’s HTTP request. Keep the query and its supporting context in one payload.",
                },
                {
                  icon: "cube",
                  title: "Let orchestration handle the models",
                  text: "The user does not select a model. The platform’s orchestration layer is responsible for routing queries to different models.",
                },
                {
                  icon: "shield",
                  title: "Evaluate before returning an insight",
                  text: "A separate evaluator checks each model’s answer. Your application receives the resulting insight through one HTTP response.",
                },
              ].map((feature) => (
                <div className="feature-list-item" key={feature.title}>
                  <span className="feature-icon">
                    <Icon name={feature.icon as IconName} size={23} />
                  </span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="landing-section developers-section" id="developers">
          <div className="section-intro">
            <span className="eyebrow">YOUR BACKEND. ONE HTTP INTEGRATION.</span>
            <h2>Fits into the code you already own.</h2>
            <p>
              Python and TypeScript examples for connecting your backend.
              <br className="desktop-only" /> An API key, a query, optional
              context, and an evaluated response.
            </p>
          </div>
          <div className="developer-cards">
            <article className="developer-card light-card">
              <span className="developer-card-label">
                01 / AUTHENTICATE YOUR APPLICATION
              </span>
              <h3>Access starts with an API key.</h3>
              <p>
                Authenticate platform requests from your own backend.
                <br />
                Keep application credentials in your server environment.
              </p>
              <Link href="/console#keys" className="button primary">
                Manage API keys <Icon name="arrow" size={16} />
              </Link>
              <div className="integration-access-card">
                <Icon name="key" size={28} />
                <strong>Application API keys</strong>
                <p>
                  Create and revoke keys from the developer console when the key
                  service is available.
                </p>
                <div>
                  <Icon name="shield" size={15} />
                  <span>Server-side authentication</span>
                </div>
                <div>
                  <Icon name="clock" size={15} />
                  <span>Key service in development</span>
                </div>
              </div>
            </article>
            <article className="developer-card code-card">
              <span className="developer-card-label">
                02 / CONNECT YOUR BACKEND
              </span>
              <h3>One request. No model selection.</h3>
              <p>
                Copyable Python and TypeScript examples.
                <br />A clearly documented, proposed HTTP contract.
              </p>
              <Link href="/console#docs" className="button">
                Read integration docs <Icon name="arrow" size={16} />
              </Link>
              <div className="landing-code">
                <div className="landing-code-header">
                  <span>backend.ts</span>
                  <span>PROPOSED CONTRACT</span>
                </div>
                <pre>
                  <code>{shortIntegrationSnippet}</code>
                </pre>
              </div>
            </article>
          </div>
          <p className="section-footnote">
            Query evaluation and key management are not available yet. The
            documentation clearly marks the proposed contract.
          </p>
        </section>
        <section className="landing-section workflow-section">
          <div className="workflow-heading">
            <span className="eyebrow">INTEGRATE WITHOUT A MODEL PICKER</span>
            <h2>Your application stays yours.</h2>
            <p>
              The platform is designed to handle the orchestration behind one
              response.
            </p>
          </div>
          <div className="workflow-steps">
            {[
              {
                title: "Connect your account",
                text: "Sign in with Clerk and view your real platform profile.",
                target: "account",
              },
              {
                title: "Manage your API keys",
                text: "Authenticate your application with server-held keys when the key service is available.",
                target: "keys",
              },
              {
                title: "Plan your HTTP integration",
                text: "Read the proposed contract in Python and TypeScript. Keep API keys in your backend.",
                target: "docs",
              },
            ].map((step, index) => (
              <Link
                href={`/console#${step.target}`}
                key={step.title}
                className="workflow-step"
              >
                <span className="workflow-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <Icon name="arrow" size={20} />
              </Link>
            ))}
          </div>
        </section>
        <section className="landing-section faq-section">
          <div>
            <span className="eyebrow">CLEAR ABOUT HOW IT WORKS</span>
            <h2>Your question, answered.</h2>
            <p>Understand the product before you integrate.</p>
          </div>
          <div className="faq-list">
            {[
              {
                q: "Do I need to choose a model?",
                a: "No. The orchestration layer is responsible for routing your query to different models. A separate evaluator checks the answers and produces the final insight. The model roster will be informational only.",
              },
              {
                q: "Can I include source code or documentation?",
                a: "Yes. Include source code or documentation as optional context in the HTTP request sent by your backend. The Python and TypeScript examples show the proposed payload structure.",
              },
              {
                q: "How does my backend connect?",
                a: "The intended integration uses an API key and an HTTP request containing a query and optional context. Python and TypeScript documentation shows the proposed request, response, and error handling. The query endpoint is not implemented yet.",
              },
              {
                q: "What is available right now?",
                a: "Clerk sign-in, your backend account profile, and Python and TypeScript integration documentation are available. Evaluation, API-key management, model listings, and usage history show unavailable states until their backend services exist.",
              },
            ].map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <Icon name="plus" size={18} />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="landing-cta">
          <span className="eyebrow">
            THE CONTEXT IS YOURS. THE ROUTING IS OURS.
          </span>
          <h2>Connect your backend.</h2>
          <p>Explore the HTTP contract in Python and TypeScript.</p>
          <Link href="/console#docs" className="button primary large">
            Read integration docs <Icon name="arrow" size={18} />
          </Link>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-main">
          <div>
            <Link href="/" aria-label="Inference home">
              <Brand />
            </Link>
            <p>Orchestration and independent evaluation.</p>
          </div>
          <div>
            <span>Platform</span>
            <Link href="/console">Developer console</Link>
            <Link href="/console#models">Platform models</Link>
            <Link href="/console#account">Account</Link>
          </div>
          <div>
            <span>Developers</span>
            <Link href="/console#docs">Python & TypeScript docs</Link>
            <Link href="/console#keys">API keys</Link>
            <a
              href="https://github.com/subhamoydatta703/AI-Inference-Platform"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <Icon name="external" size={12} />
            </a>
          </div>
          <div className="footer-status">
            <span className="status-dot" />
            Platform in development
            <p>
              Account access is available.
              <br />
              Query services are coming next.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Inference platform</span>
          <span>Query. Orchestrate. Evaluate.</span>
        </div>
      </footer>
    </div>
  );
}
