
import {groq} from "../../../config/llm/llmConfig";
import type { EvaluationResultFormat } from "../../../utils/types/evaluation/evaluationResult";
import type { llmResponseFormat } from "../../../utils/types/llm/llmResponse";
import type { OrchestratorResultFormat } from "../../../utils/types/orchestrator/orchestratorResult";
import { type QueryFormat } from "../../../utils/types/query/queryFormat";
import { SYSTEM_PROMPT } from "../instructions/llmInstruction";
import { EVALUATION_SYSTEM_PROMPT } from "../instructions/evaluationInstruction";


export class GroqService {
    private readonly client;

    constructor() {
        this.client = groq
    }

    // query
    async generateResponse(userId:string, userQuery: QueryFormat, model: string): Promise<llmResponseFormat> {


    
        try {
            
            const response = await this.client.chat.completions.create({
    
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    {
                        role: "user",
                        content: JSON.stringify(userQuery),
                    },
                ],
                model: model,
                
                
                
                
    
            })
            console.log("Response from GroqService:",{
                model: model,
                userId: userId,
                query: userQuery,
                response: response.choices[0]?.message?.content || "",
            });
    
            return {
                userId: userId,
                query: userQuery,
                response: response.choices[0]?.message?.content || "",
            }
            
        } catch (error) {
            console.error("Error in GroqService:", error);
            return {
                userId: userId,
                query: userQuery,
                error: error as Error,
            };
        }

    }

    // evaluate
    async evaluate(userId: string, query: QueryFormat,  result:OrchestratorResultFormat, SYSTEM_PROMPT=EVALUATION_SYSTEM_PROMPT): Promise<EvaluationResultFormat>{
        try {
             const response = await groq.chat.completions.create({
    
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    {
                        role: "user",
                        content: JSON.stringify({ query, result: result.result }),
                    },
                ],
                model: "openai/gpt-oss-120b",
                reasoning_effort: "medium"
                
                
    
            })

            return{
                conversationId: query.conversationId!,
                query: {
                    query: query.query,
                    language: query.language,
                    code: query.code,
                    url: query.url,

                },
                response: response.choices[0]?.message?.content || "",
            }
        } catch (error) {
            console.error("Error in GroqService:", error);
            return{
               conversationId: query.conversationId!,
               query: {
                   query: query.query,
                   language: query.language,
                   code: query.code,
                   url: query.url,

               },
               error: error as Error,
            }
        }
    }
}
