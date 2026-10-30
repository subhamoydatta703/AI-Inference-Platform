import { candidateModels } from "../lib/platform";
import { Icon } from "./icons";

export function ModelNames() {
  return <ul className="flow-model-names" aria-label="Candidate models">{candidateModels.map(model => <li key={model.id}>{model.name}</li>)}</ul>;
}

export function ModelRoster() {
  return <div className="model-roster">
    {candidateModels.map((model, index) => <article className="model-card" key={model.id}>
      <div className="model-card-top"><span className="model-mark"><Icon name="cube" size={21} /></span><span className="model-number">MODEL 0{index + 1}</span></div>
      <h3>{model.name}</h3>
      <p>{[
        "A compact model contributing an additional perspective to every query.",
        "A larger model contributing a separate response to the same context.",
        "An additional model broadening the set of candidate responses.",
      ][index]}</p>
      <span className="model-role"><Icon name="check" size={13} /> Candidate response</span>
    </article>)}
  </div>;
}

export function EvaluationArchitecture() {
  return <div className="evaluation-architecture">
    <div className="evaluation-intro"><span className="architecture-label"><Icon name="shield" size={16} /> EVALUATION LAYER</span><h3>From candidates to one answer.</h3><p>When multiple candidates are available, they are reviewed against the original request. A single available candidate is returned directly without evaluation.</p></div>
    <ol className="evaluation-checks">
      {[
        ["Validate", "Exclude failed, empty, or mismatched responses."],
        ["Assess", "Review correctness, relevance, completeness, and requested format."],
        ["Select", "Choose the strongest acceptable answer without merging or rewriting it."],
      ].map(([title, text], index) => <li key={title}><span>0{index + 1}</span><div><strong>{title}</strong><p>{text}</p></div><Icon name="check" size={16} /></li>)}
    </ol>
  </div>;
}
