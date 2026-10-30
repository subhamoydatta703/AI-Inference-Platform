export type IntegrationLanguage = "Python" | "TypeScript";
export const queryPath = "/api/v1/queries";
export const exampleQuery = {
  query: "Identify the failure modes in this implementation.",
  language: "javascript",
  code: "function first(items) { return items[0].name; }",
  url: "https://example.com/docs",
  responseType: "text",
};
export const exampleResponse = {
  success: true,
  message: "Query processed successfully",
  data: {
    conversationId: "<server-generated-uuid>",
    query: { query: exampleQuery.query, language: exampleQuery.language, code: exampleQuery.code, url: exampleQuery.url },
    rawText: "<selected answer before JSON parsing>",
    response: "<final evaluated answer>",
  },
};

export const shortIntegrationSnippet = [
  "// Run in your backend with a platform API key.",
  `const response = await fetch(baseUrl + "${queryPath}", {`,
  '  method: "POST",',
  "  headers: {",
  '    Authorization: "Bearer " + apiKey,',
  '    "Content-Type": "application/json",',
  "  },",
  '  body: JSON.stringify({ query, language, code, responseType: "text" }),',
  "});",
].join("\n");

export function integrationSnippet(language: IntegrationLanguage): string {
  if (language === "Python")
    return `# Run in your backend. Create a platform key in Console > API keys.
# Keep the key in a server environment variable, never in browser code.
# INFERENCE_BASE_URL is the platform backend origin, without /api/v1/queries.
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

base_url = os.environ["INFERENCE_BASE_URL"].rstrip("/")
api_key = os.environ["INFERENCE_API_KEY"]
payload = {
    "query": "Identify the failure modes in this implementation.",
    "language": "javascript",  # optional
    "code": "function first(items) { return items[0].name; }",  # optional
    "url": "https://example.com/docs",  # optional valid URL
    "responseType": "text",  # optional: "text" (default) or "json"
}
request = Request(
    f"{base_url}${queryPath}",
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    },
    method="POST",
)
try:
    with urlopen(request, timeout=120) as response:
        result = json.load(response)
    if not result.get("success"):
        raise RuntimeError(result.get("message", "Query failed"))
    data = result.get("data")
    if not isinstance(data, dict) or "error" in data or data.get("response") is None:
        raise RuntimeError("Platform returned no usable answer")
    if payload["responseType"] == "text" and not isinstance(data["response"], str):
        raise RuntimeError("Platform returned an unexpected text answer")
    # data.response is the final evaluated answer.
    # data.conversationId identifies this request's conversation.
    # Print the complete API response as formatted JSON.
    print(json.dumps(result, indent=2, ensure_ascii=False))
except HTTPError as error:
    raise RuntimeError(f"Query failed: HTTP {error.code}") from error
except URLError as error:
    raise RuntimeError("Could not reach the platform") from error`;

  return `// Install: npm install zod (or bun add zod).
// Run in your backend with environment variables loaded.
// INFERENCE_BASE_URL is the platform backend origin, e.g. https://ai-inference-platform.onrender.com.
// Create INFERENCE_API_KEY in Console > API keys. Keep it server-side.
import { z } from "zod";

const environmentSchema = z.object({
  INFERENCE_BASE_URL: z.url().refine((value) => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol)
      && url.pathname === "/" && !url.search && !url.hash
      && !url.username && !url.password;
  }, "Use the backend origin only, without an API path, query, or credentials"),
  INFERENCE_API_KEY: z.string().trim().min(1),
});
const env = environmentSchema.parse(process.env);
const baseUrl = new URL(env.INFERENCE_BASE_URL).origin;
const apiKey = env.INFERENCE_API_KEY;

const querySchema = z.object({
  query: z.string().trim().min(1),
  language: z.string().trim().optional(),
  code: z.string().optional(),
  url: z.url().optional(),
});
const requestSchema = querySchema.extend({
  responseType: z.enum(["text", "json"]).default("text"),
});
type QueryRequest = z.infer<typeof requestSchema>;

const successSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    conversationId: z.uuid(),
    query: querySchema,
    rawText: z.string().optional(),
    response: z.unknown().optional(),
    error: z.unknown().optional(),
  }),
});
type QueryResponse = z.infer<typeof successSchema>;
const errorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
});

const payload: QueryRequest = requestSchema.parse({
  query: "Identify the failure modes in this implementation.",
  language: "javascript", // optional
  code: "function first(items) { return items[0].name; }", // optional
  url: "https://example.com/docs", // optional valid URL
  responseType: "text", // "text" (default) or "json"
});
const response = await fetch(baseUrl + "${queryPath}", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${apiKey}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(120_000),
});
let body: unknown;
try {
  body = await response.json();
} catch {
  throw new Error(\`Platform returned non-JSON data: HTTP \${response.status}\`);
}

const failure = errorSchema.safeParse(body);
if (!response.ok || failure.success) {
  throw new Error(failure.success
    ? failure.data.message
    : \`Query failed: HTTP \${response.status}\`);
}

const parsed = successSchema.safeParse(body);
if (!parsed.success) {
  throw new Error("Platform returned an unexpected response shape");
}
const result: QueryResponse = parsed.data;
// The backend can return success: true with an error and no answer.
if ("error" in result.data || result.data.response == null) {
  throw new Error("Platform returned no usable answer");
}
if (payload.responseType === "text" && typeof result.data.response !== "string") {
  throw new Error("Platform returned an unexpected response shape");
}
// result.data.response is the final evaluated answer.
// result.data.conversationId identifies this request's conversation.
// Print the complete validated API response as formatted JSON.
console.log(JSON.stringify(result, null, 2));`;
}

export const orchestrationStages = [
  { icon: "book", title: "Query & context", description: "Start with a question. Add code, a language, or reference context." },
  { icon: "terminal", title: "Orchestration", description: "One request calls three candidate models in parallel." },
  { icon: "cube", title: "Model responses", description: "Three distinct perspectives address the same question and context." },
  { icon: "shield", title: "Evaluation", description: "Multiple available answers are evaluated; a single available answer is returned directly." },
  { icon: "bolt", title: "Final answer", description: "The strongest acceptable response is selected and delivered to your application." },
] as const;
