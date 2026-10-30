

import type { EvaluationResultFormat } from "../../utils/types/evaluation/evaluationResult";
import type { OrchestratorResultFormat } from "../../utils/types/orchestrator/orchestratorResult";
import type { QueryFormat } from "../../utils/types/query/queryFormat";
import { GroqService } from "../llmProvider/groq/groqService";
import { OpenRouterService } from "../llmProvider/openrouter/openrouterService";
import { outputGuardrailService } from "../guardrail/outputGuardrail/outputGuardrail";




export class OrchestratorService {

  private conversationId: string;
  private groqService: GroqService;
  private openRouterService: OpenRouterService;
  


  constructor() {
    this.groqService = new GroqService();
    this.openRouterService = new OpenRouterService();
    this.conversationId = `${crypto.randomUUID()}`


  }

  async run(userId: string, userQuery: QueryFormat, conversationId = this.conversationId): Promise<EvaluationResultFormat> {

    try {

      const query: QueryFormat = {
        conversationId: conversationId,
        query: userQuery?.query,
        url: userQuery?.url,
        language: userQuery?.language,
        code: userQuery?.code,
        responseType: userQuery.responseType || "text"
      }

      // run all three models in parallel and wait for all to finish
      const [result1, result2, result3] = await Promise.allSettled([
        this.groqService.generateResponse(userId, query, "openai/gpt-oss-20b"),
        this.groqService.generateResponse(userId, query, "openai/gpt-oss-120b"),
        this.openRouterService.generateResponse(userId, query, "nvidia/nemotron-3-ultra-550b-a55b:free")
      ])



      const orchResult: OrchestratorResultFormat = {
        result: []
      }

      if (result1.status === "fulfilled" && !result1.value.error && result1.value.response !== null && result1.value.response !== undefined) {

        // const query

        orchResult.result.push({ model: "openai/gpt-oss-20b", response: result1.value })
      }
      if (result2.status === "fulfilled" && !result2.value.error && result2.value.response !== null && result2.value.response !== undefined) {
        orchResult.result.push({ model: "openai/gpt-oss-120b", response: result2.value })
      }
      if (result3.status === "fulfilled" && !result3.value.error && result3.value.response !== null && result3.value.response !== undefined) {
        orchResult.result.push({ model: "nvidia/nemotron-3-ultra-550b-a55b:free", response: result3.value })
      }

      if (orchResult.result.length === 0) {
        return {
          conversationId: conversationId,
          query: {
            query: query.query,
            url: query.url,
            language: query.language,
            code: query.code
          },
          error: new Error("No response from any model")
        }
      }

      if (orchResult.result.length === 1) {
        const singleResponse = orchResult.result[0]?.response.response;
        const singleRawText = orchResult.result[0]?.response.rawText;
        const guardrailStatus = await outputGuardrailService.validateOutput(singleRawText || singleResponse);

        if (!guardrailStatus.safe) {
          return {
            conversationId: conversationId,
            query: {
              query: query.query,
              url: query.url,
              language: query.language,
              code: query.code
            },
            rawText: "Sorry we can't generate this response",
            response: "Sorry we can't generate this response",
          };
        }

        return {
          conversationId: conversationId,
          query: {
            query: query.query,
            url: query.url,
            language: query.language,
            code: query.code
          },
          rawText: singleRawText,
          response: singleResponse,
          
        }
      }

      

      const evaluationResult = await this.groqService.evaluate(query, orchResult)
      if (evaluationResult.error) {
        throw evaluationResult.error;
      }

      const evalResponse = evaluationResult.rawText || evaluationResult.response;
      const guardrailStatus = await outputGuardrailService.validateOutput(evalResponse);

      if (!guardrailStatus.safe) {
        return {
          conversationId: evaluationResult.conversationId,
          query: evaluationResult.query,
          rawText: "Sorry we can't generate this response",
          response: "Sorry we can't generate this response",
        };
      }

      return evaluationResult

    } catch (error) {
      console.error("Error in OrchestratorService:", error);
      throw error;
    }
  }

}
