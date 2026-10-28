
import {groq} from "../../../config/llm/llmConfig";
import type { EvaluationResultFormat } from "../../../utils/types/evaluation/evaluationResult";
import type { llmResponseFormat } from "../../../utils/types/llm/llmResponse";
import type { OrchestratorResultFormat } from "../../../utils/types/orchestrator/orchestratorResult";
import { type QueryFormat } from "../../../utils/types/query/queryFormat";
import { SYSTEM_PROMPT } from "../instructions/llmInstruction";
import { EVALUATION_SYSTEM_PROMPT } from "../instructions/evaluationInstruction";
import { toJson } from "../../../utils/response/jsonFormat";


export class GroqService {
    private readonly client;
private readonly TIMEOUT_MS=10000
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
                model: model,}
                , {timeout: this.TIMEOUT_MS})
                
                
                const resType = userQuery.responseType

                const modelResponse = resType === "json" ? toJson(response.choices[0]?.message?.content!) : response.choices[0]?.message?.content || ""
                
                
                
                
                
    
        
            console.log("Response from GroqService:",{
                model: model,
                userId: userId,
                query: userQuery,
                rawText: response.choices[0]?.message?.content || "",
                response: modelResponse,
            });
    
            return {
                
                query: userQuery,
                rawText: response.choices[0]?.message?.content || "",
                response: modelResponse,
            }
            
        } catch (error) {
            console.error("Error in GroqService:", error);
            throw error;
        }

    }

    // evaluate
    async evaluate(query: QueryFormat,  result:OrchestratorResultFormat, SYSTEM_PROMPT=EVALUATION_SYSTEM_PROMPT): Promise<EvaluationResultFormat>{
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

            const resType = query.responseType

            const evalResponse = resType === "json" ? toJson(response.choices[0]?.message?.content || "") : response.choices[0]?.message?.content || ""
            
            return{
                conversationId: query.conversationId!,
                query: {
                    query: query.query,
                    language: query.language,
                    code: query.code,
                    url: query.url,

                },
                rawText: response.choices[0]?.message?.content || "",
                response: evalResponse,
            
            }
        } catch (error) {
            console.error("Error in GroqService:", error);
            throw error;
        }
    }
}
