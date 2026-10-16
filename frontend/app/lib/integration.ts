export type IntegrationLanguage = "Python" | "TypeScript";

export const shortIntegrationSnippet = [
  "// Proposed contract — not implemented yet.",
  'const response = await fetch(baseUrl + "/api/v1/queries", {',
  '  method: "POST",',
  "  headers: {",
  '    Authorization: "Bearer " + apiKey,',
  '    "Content-Type": "application/json",',
  "  },",
  "  body: JSON.stringify({",
  "    query,",
  '    context: { type: "code", content },',
  "  }),",
  "});",
].join("\n");

// Proposed query contract. No orchestration endpoint exists in the backend yet.
export const proposedQueryPath = "/api/v1/queries";
export const exampleQuery = {
  query: "Identify the failure modes in this implementation.",
  context: {
    type: "code",
    content: "Paste the relevant source code or documentation here.",
  },
};

export const proposedResponse = {
  success: true,
  data: {
    requestId: "<request-id>",
    insight: "<final insight produced by the evaluator>",
  },
};

export function integrationSnippet(language: IntegrationLanguage): string {
  if (language === "Python")
    return `# Proposed integration contract — query service is not available yet.
# Run this in your backend. Keep the API key out of browser code.
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

base_url = os.environ["INFERENCE_BASE_URL"].rstrip("/")
api_key = os.environ["INFERENCE_API_KEY"]

payload = {
    "query": "Identify the failure modes in this implementation.",
    "context": {
        "type": "code",  # or "documentation"
        "content": "Your source code or documentation",
    },
}

request = Request(
    f"{base_url}${proposedQueryPath}",
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    },
    method="POST",
)

try:
    with urlopen(request, timeout=60) as response:
        result = json.load(response)
    if not result.get("success"):
        raise RuntimeError("The platform could not evaluate the query")
    print(result["data"]["insight"])
except HTTPError as error:
    raise RuntimeError(f"Platform request failed: HTTP {error.code}") from error
except URLError as error:
    raise RuntimeError("Could not reach the platform") from error`;

  return `// Proposed integration contract — query service is not available yet.
// Node.js backend code. Never put this API key in NEXT_PUBLIC_* variables.
const baseUrl = process.env.INFERENCE_BASE_URL?.replace(/\\/$/, "");
const apiKey = process.env.INFERENCE_API_KEY;

if (!baseUrl || !apiKey) {
  throw new Error("Set INFERENCE_BASE_URL and INFERENCE_API_KEY");
}

type EvaluatedResponse = {
  success: boolean;
  data: { requestId: string; insight: string };
};

const payload = {
  query: "Identify the failure modes in this implementation.",
  context: {
    type: "code", // or "documentation"
    content: "Your source code or documentation",
  },
};

try {
  const response = await fetch(
    baseUrl + "${proposedQueryPath}",
    {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${apiKey}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    },
  );

  if (!response.ok) {
    throw new Error(\`Platform request failed: HTTP \${response.status}\`);
  }

  const result = (await response.json()) as EvaluatedResponse;
  if (!result.success) throw new Error("Query evaluation failed");
  console.log(result.data.insight);
} catch (error) {
  console.error("Platform integration failed", error);
  throw error;
}`;
}

export const orchestrationStages = [
  {
    icon: "book",
    title: "Query & context",
    description: "Your question, with the code or documentation it needs.",
  },
  {
    icon: "cube",
    title: "Orchestration",
    description: "The platform routes the query to different models.",
  },
  {
    icon: "shield",
    title: "Independent evaluation",
    description: "A separate evaluator checks the model answers.",
  },
  {
    icon: "bolt",
    title: "Final insight",
    description: "One evaluated response returns to your application.",
  },
] as const;
