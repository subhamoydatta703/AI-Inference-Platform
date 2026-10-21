import { afterEach, beforeEach, expect, mock, spyOn, test } from "bun:test";

const create = mock(async (_request: Record<string, unknown>) => ({
    choices: [{ finish_reason: "stop", message: { content: "Answer\n\n```js\n42\n```" } }],
}));

mock.module("../src/config/llm/llmConfig", () => ({
    default: { chat: { completions: { create } } },
}));

const { GroqService } = await import("../src/services/llmProvider/groq/groqService");
const query = { conversationId: "test-conversation", query: "Explain this code." };
const candidates = { result: [] };
let log: ReturnType<typeof spyOn>;
let errorLog: ReturnType<typeof spyOn>;

beforeEach(() => {
    create.mockClear();
    log = spyOn(console, "log").mockImplementation(() => {});
    errorLog = spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    log.mockRestore();
    errorLog.mockRestore();
});

test("generation respects the reported Qwen output ceiling and uses one token parameter", async () => {
    const service = new GroqService();
    const result = await service.generateResponse("user", query, "qwen/qwen3.8-27b");
    const request = create.mock.calls[0]![0];
    expect(request.max_completion_tokens).toBeLessThanOrEqual(1000);
    expect(request.max_tokens).toBeUndefined();
    expect(result.response).toBe("Answer\n\n```js\n42\n```");
});

test("evaluation has more room than generation and preserves answer formatting", async () => {
    const service = new GroqService();
    await service.generateResponse("user", query, "openai/gpt-oss-120b");
    const result = await service.evaluate("user", query, candidates);
    const generation = create.mock.calls[0]![0];
    const evaluation = create.mock.calls[1]![0];
    expect(evaluation.max_completion_tokens as number).toBeGreaterThan(generation.max_completion_tokens as number);
    expect(evaluation.max_tokens).toBeUndefined();
    expect(evaluation.reasoning_effort).toBe("low");
    expect(result.response).toBe("Answer\n\n```js\n42\n```");
});

for (const stage of ["generation", "evaluation"] as const) {
    for (const completion of [
        { finish_reason: "length", message: { content: "Partial answer" } },
        { finish_reason: "stop", message: { content: "  \n" } },
    ]) {
        test(`${stage} rejects ${completion.finish_reason === "length" ? "truncated" : "blank"} output`, async () => {
            create.mockResolvedValueOnce({ choices: [completion] });
            const service = new GroqService();
            const result = stage === "generation"
                ? await service.generateResponse("user", query, "openai/gpt-oss-120b")
                : await service.evaluate("user", query, candidates);
            expect(result.error).toBeInstanceOf(Error);
            expect(result.response).toBeUndefined();
        });
    }
}
