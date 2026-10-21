// Mirrors the enforced limit in backend/src/services/apiKey/apiKeyService.ts.
export const maxApiKeys = 3;

// Mirrors backend/src/services/orchestrator/orchestratorService.ts.
export const candidateModels = [
  { name: "GPT-OSS 20B", provider: "Groq", id: "openai/gpt-oss-20b" },
  { name: "GPT-OSS 120B", provider: "Groq", id: "openai/gpt-oss-120b" },
  { name: "Nemotron 3 Ultra", provider: "OpenRouter", id: "nvidia/nemotron-3-ultra-550b-a55b:free" },
] as const;

export const evaluationModel = candidateModels[1];
