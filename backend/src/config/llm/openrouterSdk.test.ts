import { describe, expect, test } from "bun:test";
import { OpenResponsesResult$inboundSchema } from "@openrouter/sdk/models";

const baseResponse = {
  completed_at: null,
  created_at: 1,
  error: null,
  frequency_penalty: null,
  id: "resp_test",
  incomplete_details: null,
  instructions: null,
  metadata: null,
  model: "test/model",
  object: "response",
  output: [],
  parallel_tool_calls: false,
  presence_penalty: null,
  status: "completed",
  temperature: null,
  tool_choice: "auto",
  tools: [],
  top_p: null,
};

describe("OpenRouter batch response schema", () => {
  test("keeps input transformations on OpenResponsesResult", () => {
    const parsed = OpenResponsesResult$inboundSchema.parse({
      ...baseResponse,
      input_transformations: [],
    }) as Record<string, unknown>;

    expect(parsed.inputTransformations).toEqual([]);
  });
});
