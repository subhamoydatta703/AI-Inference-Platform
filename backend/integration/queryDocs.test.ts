import { describe, expect, mock, test } from "bun:test";
import { resolve } from "node:path";
import ts from "typescript";
import { z } from "zod";
import { integrationSnippet } from "../../frontend/app/lib/integration";
import type { EvaluationResultFormat } from "../src/utils/types/evaluation/evaluationResult";

const snippet = integrationSnippet("TypeScript");
const conversationId = "550e8400-e29b-41d4-a716-446655440000";
const success = {
  success: true,
  message: "Query processed successfully",
  data: {
    conversationId,
    query: {
      query: "Identify the failure modes in this implementation.",
      language: "javascript",
      code: "function first(items) { return items[0].name; }",
    },
    response: "Check for empty items first.",
  },
} satisfies { success: true; message: string; data: EvaluationResultFormat };

// Execute the actual copyable example with mocked HTTP and isolated credentials.
// Reuse the backend's Zod dependency; the frontend only renders source text.
async function executeExample(response: Response, env: Record<string, string | undefined> = {
  INFERENCE_BASE_URL: "http://localhost:5000/",
  INFERENCE_API_KEY: "test-platform-key",
}, responseType: "text" | "json" = "text") {
  const request = mock(async (_url: string, _options: RequestInit) => response);
  const log = mock((_value: unknown) => {});
  const source = snippet.replace('import { z } from "zod";', "")
    .replace('responseType: "text", //', `responseType: "${responseType}", //`);
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const execute = new Function("z", "fetch", "process", "console", `return (async () => { ${compiled} })();`);
  await execute(z, request, { env }, { log });
  return { request, log };
}

describe("copyable TypeScript query example", () => {
  test("passes strict TypeScript checking with its documented Zod dependency", () => {
    const samplePath = resolve(import.meta.dir, "../query-docs-example.ts").replaceAll("\\", "/");
    const options: ts.CompilerOptions = {
      strict: true, noUncheckedIndexedAccess: true, noEmit: true, skipLibCheck: true,
      target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler, types: ["bun"],
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
      fileName.replaceAll("\\", "/") === samplePath
        ? ts.createSourceFile(fileName, snippet, languageVersion, true)
        : getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    const program = ts.createProgram([samplePath], options, host);
    const errors = ts.getPreEmitDiagnostics(program).filter((item) => item.category === ts.DiagnosticCategory.Error);
    expect(errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n"))).toEqual([]);
  }, 20_000);

  test("sends the platform key to the backend origin and reads validated output", async () => {
    const { request, log } = await executeExample(Response.json(success));
    expect(request).toHaveBeenCalledWith("http://localhost:5000/api/v1/queries", expect.objectContaining({
      method: "POST", headers: { Authorization: "Bearer test-platform-key", "Content-Type": "application/json" },
    }));
    expect(log).toHaveBeenCalledTimes(1);
    const printed = log.mock.calls[0]?.[0];
    if (typeof printed !== "string") throw new Error("Expected a JSON string");
    expect(JSON.parse(printed)).toEqual(success);
    expect(JSON.parse(printed).data).not.toHaveProperty("userId");
    expect(JSON.parse(printed).data.query).not.toHaveProperty("conversationId");
  });

  test("rejects malformed success data before accessing nested fields", async () => {
    for (const body of [null, {}, { success: true, data: null }, {
      ...success, data: { ...success.data, response: 123 },
    }, {
      ...success, data: { query: { ...success.data.query, conversationId }, response: "Old response shape" },
    }]) {
      await expect(executeExample(Response.json(body))).rejects.toThrow("unexpected response shape");
    }
  });

  test("accepts structured JSON answers and preserves rawText", async () => {
    for (const answer of [{ findings: ["Empty array"] }, [1, 2], false, 0, "answer"]) {
      const body = { ...success, data: { ...success.data, response: answer, rawText: JSON.stringify(answer) } };
      const { log } = await executeExample(Response.json(body), undefined, "json");
      expect(JSON.parse(log.mock.calls[0]![0] as string)).toEqual(body);
    }
  });

  test("rejects HTTP 200 results with errors or missing and null answers", async () => {
    for (const data of [
      { ...success.data, error: {} },
      { conversationId, query: success.data.query, error: {} },
      { conversationId, query: success.data.query },
      { ...success.data, response: null },
    ]) {
      for (const mode of ["text", "json"] as const) {
        await expect(executeExample(Response.json({ ...success, data }), undefined, mode))
          .rejects.toThrow("no usable answer");
      }
    }
  });

  test("reports API errors, non-JSON responses, and unsuccessful HTTP statuses", async () => {
    await expect(executeExample(Response.json({ success: false, message: "Invalid Api Key" }, { status: 401 })))
      .rejects.toThrow("Invalid Api Key");
    await expect(executeExample(Response.json({ success: false, message: "Query rejected" })))
      .rejects.toThrow("Query rejected");
    await expect(executeExample(new Response("Service unavailable", { status: 502 })))
      .rejects.toThrow("non-JSON data: HTTP 502");
    await expect(executeExample(Response.json({}, { status: 429 })))
      .rejects.toThrow("Query failed: HTTP 429");
  });

  test("requires a backend origin and a non-empty key", async () => {
    for (const env of [{}, { INFERENCE_BASE_URL: "http://localhost:5000", INFERENCE_API_KEY: "  " },
      { INFERENCE_BASE_URL: "http://localhost:5000/api/v1/queries", INFERENCE_API_KEY: "test" },
      { INFERENCE_BASE_URL: "ftp://example.com", INFERENCE_API_KEY: "test" }]) {
      await expect(executeExample(Response.json(success), env)).rejects.toBeInstanceOf(z.ZodError);
    }
  });
});
