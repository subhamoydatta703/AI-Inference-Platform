import { Brand, Icon } from "./icons";
import {
  exampleQuery,
  orchestrationStages,
  queryPath,
} from "../lib/integration";

// Static illustration of backend-to-platform integration, not a query form.
export function ProductPreview() {
  return (
    <div
      className="product-preview"
      aria-label="Illustration of the developer API console"
    >
      <div className="preview-sidebar">
        <Brand />
        <span className="preview-workspace">
          Developer console <Icon name="down" size={12} />
        </span>
        <span className="preview-nav-label">PLATFORM</span>
        <div className="preview-nav">
          <Icon name="grid" size={14} />
          Overview
        </div>
        <div className="preview-nav">
          <Icon name="key" size={14} />
          API keys
        </div>
        <div className="preview-nav">
          <Icon name="cube" size={14} />
          Platform models
        </div>
        <div className="preview-nav">
          <Icon name="chart" size={14} />
          Usage & history
        </div>
        <div className="preview-nav active">
          <Icon name="book" size={14} />
          Integration docs
        </div>
        <div className="preview-sidebar-bottom">
          <Icon name="settings" size={14} />
          Account
        </div>
      </div>
      <div className="preview-dashboard">
        <div className="preview-topbar">
          <span>
            Platform <Icon name="chevron" size={10} />
            <strong>HTTP integration</strong>
          </span>
          <span className="preview-tag">Platform API key</span>
        </div>
        <div className="preview-dashboard-content">
          <div className="preview-title">
            <div>
              <h3>Your backend. One HTTP API.</h3>
              <p>
                Python and TypeScript integration. The platform handles the
                models.
              </p>
            </div>
          </div>
          <div className="preview-api-grid">
            <div className="preview-http-request">
              <span className="preview-field-label">YOUR BACKEND SENDS</span>
              <strong>POST {queryPath}</strong>
              <code>Authorization: Bearer &lt;API_KEY&gt;</code>
              <pre>{JSON.stringify(exampleQuery, null, 2)}</pre>
            </div>
            <div className="preview-http-response">
              <Icon name="shield" size={25} />
              <h4>Model response</h4>
              <p>
                The API returns the model answer and a conversation ID.
              </p>
              <span>Groq · GPT-OSS 20B</span>
            </div>
          </div>
          <div className="preview-pipeline">
            {orchestrationStages.map((stage, index) => (
              <div key={stage.title}>
                <span>0{index + 1}</span>
                <Icon name={stage.icon} size={17} />
                <strong>{stage.title}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
