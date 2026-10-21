import Link from "next/link";
import { AccountButton } from "./account";
import { Brand, Icon } from "./icons";
import { ProductPreview } from "./product-preview";
import { ProductStage } from "./product-stage";
import { EvaluationArchitecture, ModelNames, ModelRoster } from "./query-architecture";
import { maxApiKeys } from "../lib/platform";
import { orchestrationStages, shortIntegrationSnippet } from "../lib/integration";

export default function LandingPage() {
  return <div className="marketing-site saas-marketing">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <Link href="/" aria-label="Inference home"><Brand /></Link>
      <nav aria-label="Main navigation">
        <a href="#platform">Platform</a><a href="#models">Models</a><a href="#architecture">Architecture</a><a href="#developers">Developers</a>
      </nav>
      <div className="site-header-actions"><AccountButton /><Link href="/console" className="button primary">Open console <Icon name="arrow" size={15} /></Link></div>
    </header>
    <main id="main-content" tabIndex={-1}>
      <section className="saas-hero">
        <div className="hero-copy">
          <span className="hero-announcement"><Icon name="bolt" size={14} /> MULTI-MODEL INTELLIGENCE, ONE API</span>
          <h1>Many perspectives.<br /><span>One evaluated insight.</span></h1>
          <p className="hero-description">Build with answers that have been considered from more than one angle. Three models, coordinated orchestration, and a dedicated evaluation layer. All through one API.</p>
          <div className="hero-actions"><Link href="/console#keys" className="button primary large">Start building <Icon name="arrow" size={17} /></Link><Link href="/console#docs" className="button large">Read integration docs <Icon name="book" size={17} /></Link></div>
          <div className="hero-proof"><span><Icon name="check" size={14} /> Python & TypeScript</span><span><Icon name="check" size={14} /> Your code, your context</span><span><Icon name="check" size={14} /> One final answer</span></div>
        </div>
        <div className="hero-summary" aria-label="Platform architecture summary">
          <div className="hero-summary-top"><span className="architecture-label"><Icon name="terminal" size={15} /> INFERENCE ENGINE</span><span className="tag">ARCHITECTURE</span></div>
          <div className="hero-summary-title"><h2>A considered answer.<br />A simpler integration.</h2><p>Your application sends the question.<br />Inference coordinates the rest.</p></div>
          <div className="summary-facts"><div><strong>03</strong><span>Candidate models</span></div><div><strong>01</strong><span>Evaluation layer</span></div><div><strong>01</strong><span>Unified API</span></div></div>
          <Link className="text-button" href="#architecture">Explore the architecture <Icon name="arrow" size={15} /></Link>
        </div>
      </section>
      <div className="model-name-strip"><span>THREE PERSPECTIVES. ONE WORKFLOW.</span><strong>GPT-OSS 20B</strong><strong>GPT-OSS 120B</strong><strong>Nemotron 3 Ultra</strong></div>
      <section className="landing-section platform-section" id="platform">
        <div className="section-intro"><span className="eyebrow">FROM QUESTION TO ANSWER</span><h2>Intelligence is a process.</h2><p>A structured workflow turns your context into a considered response.<br className="desktop-only" /> Your team integrates once. Inference handles the coordination.</p></div>
        <div className="query-flow-panel">
          <div className="feature-product-header"><span className="architecture-label"><Icon name="terminal" size={17} /> The current query flow</span><span className="tag">MANAGED ORCHESTRATION</span></div>
          <ol className="landing-query-flow">{orchestrationStages.map((stage, index) => <li key={stage.title}><div className="flow-step-top"><span className="pipeline-icon"><Icon name={stage.icon} size={20} /></span><span className="flow-number">0{index + 1}</span></div><h3>{stage.title}</h3><p>{stage.description}</p>{stage.icon === "cube" && <ModelNames />}</li>)}</ol>
          <div className="query-flow-footer"><span><Icon name="shield" size={15} /> Original context stays at the center of the workflow.</span><Link className="text-button" href="/console#docs">View API documentation <Icon name="arrow" size={15} /></Link></div>
        </div>
      </section>
      <section className="landing-section models-section" id="models"><div className="section-heading-row"><div><span className="eyebrow">THE MODEL ENSEMBLE</span><h2>Three models.<br />A broader perspective.</h2></div><p>Each model responds to the same request and supporting context. The evaluation layer reviews the candidates, so your application receives a single selected answer.</p></div><ModelRoster /></section>
      <section className="landing-section architecture-section" id="architecture"><div className="section-intro"><span className="eyebrow">BUILT AROUND ANSWER QUALITY</span><h2>Orchestration coordinates.<br />Evaluation decides.</h2><p>Generation and selection have distinct roles. A dedicated review step<br className="desktop-only" /> assesses the candidate answers before one reaches your application.</p></div><EvaluationArchitecture /><p className="architecture-note"><Icon name="shield" size={15} /> When no candidate meets the criteria, the response explicitly says so.</p></section>
      <section className="landing-section developers-section" id="developers"><div className="section-heading-row"><div><span className="eyebrow">DESIGNED FOR DEVELOPERS</span><h2>Less orchestration code.<br />More product.</h2></div><p>Keep your application stack. Send a question and optional context through a straightforward HTTP request.</p></div>
        <div className="developer-cards"><article className="developer-card"><span className="developer-card-label">01 / CONNECT</span><span className="developer-feature-icon"><Icon name="key" size={25} /></span><h3>Your application. Your access.</h3><p>Create a platform key, keep it in your server environment, and authenticate your requests. Manage up to {maxApiKeys} keys from one console.</p><Link href="/console#keys" className="button primary">Manage API keys <Icon name="arrow" size={15} /></Link><div className="developer-detail-list"><span><Icon name="shield" size={16} /> Account-scoped access</span><span><Icon name="key" size={16} /> Create and revoke keys</span><span><Icon name="clock" size={16} /> 10 requests / minute · 100 / day</span></div></article>
          <article className="developer-card code-card"><div className="developer-card-label">02 / INTEGRATE</div><h3>One request. A complete workflow.</h3><p>Start with copyable Python and TypeScript examples.</p><div className="landing-code"><div className="landing-code-header"><span>backend.ts</span><span>HTTP API</span></div><pre><code>{shortIntegrationSnippet}</code></pre></div><Link href="/console#docs" className="text-button">Explore integration docs <Icon name="arrow" size={15} /></Link></article></div>
      </section>
      <section className="landing-section console-showcase"><div className="section-intro"><span className="eyebrow">YOUR DEVELOPER WORKSPACE</span><h2>Everything you need to get connected.</h2><p>Manage application access, explore the architecture, and find your integration examples.</p></div><ProductStage><ProductPreview /></ProductStage><div className="hero-caption">A focused console for your account, API keys, and integration.</div></section>
      <section className="landing-section faq-section"><div><span className="eyebrow">A LITTLE MORE CONTEXT</span><h2>Good questions.<br />Clear answers.</h2><p>What to know before your first request.</p></div><div className="faq-list">{[
        { q: "Do I need to choose a model?", a: "No. The orchestration layer coordinates three models for every query. A dedicated evaluation layer assesses the candidates and selects the strongest acceptable answer for your application." },
        { q: "How does evaluation work?", a: "Candidate responses are checked against your original request for correctness, relevance, completeness, and format. Failed or empty responses are excluded. The selected answer is returned unchanged; answers are not merged together." },
        { q: "Can I include source code or documentation?", a: "Yes. Add source code and its language as optional fields, or include documentation text in your query. You can also supply a reference URL. Its contents are not automatically fetched, so include any text the models need." },
        { q: "What are the request limits?", a: "Each account has an allowance of 10 requests per minute and 100 requests per day, shared across its keys and authenticated API routes. If you reach a limit, the API returns a retry time." },
        { q: "Where do I start?", a: "Open the console, sign in, and create an API key. The integration docs include Python and TypeScript examples for sending your first request from your backend. Request history and usage reporting are not available yet." },
      ].map(item => <details key={item.q}><summary>{item.q}<Icon name="plus" size={18} /></summary><p>{item.a}</p></details>)}</div></section>
      <section className="landing-cta"><span className="eyebrow">BUILD SOMETHING WELL CONSIDERED</span><h2>One integration.<br />More perspective.</h2><p>Bring your question. Let Inference coordinate the answers.</p><div className="cta-actions"><Link href="/console#keys" className="button primary large">Start building <Icon name="arrow" size={17} /></Link><Link href="/console#docs" className="button large">Read the docs <Icon name="book" size={17} /></Link></div></section>
    </main>
    <footer className="site-footer"><div className="footer-main"><div><Link href="/" aria-label="Inference home"><Brand /></Link><p>Many perspectives.<br />One evaluated insight.</p></div><div><span>Platform</span><a href="#platform">How it works</a><a href="#models">Models</a><a href="#architecture">Evaluation architecture</a></div><div><span>Developers</span><Link href="/console">Developer console</Link><Link href="/console#docs">Documentation</Link><Link href="/console#keys">API keys</Link></div><div className="footer-status"><span>BUILT FOR YOUR STACK</span><p>Python · TypeScript · HTTP</p><Link className="text-button" href="/console#docs">Explore the API <Icon name="arrow" size={14} /></Link></div></div><div className="footer-bottom"><span>© 2026 Inference</span><span>Query. Orchestrate. Evaluate.</span></div></footer>
  </div>;
}
