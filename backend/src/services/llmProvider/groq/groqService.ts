
import groq from "../../../config/llm/llmConfig";
import type { llmResponseFormat } from "../../../utils/types/llm/llmResponse";
import { type QueryFormat } from "../../../utils/types/query/queryFormat";
import { SYSTEM_PROMPT } from "../instructions/llmInstruction";


export class GroqService {
    private readonly client;

    constructor() {
        this.client = groq
    }


    async generateResponse(userId:string, userQuery: QueryFormat): Promise<llmResponseFormat> {


    
        try {
            
            const response = await groq.chat.completions.create({
    
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    {
                        role: "user",
                        content: JSON.stringify(userQuery),
                    },
                ],
                model: "openai/gpt-oss-20b",
                max_completion_tokens:10000,
                max_tokens:10000,
                
    
            })
            console.log("Response from GroqService:",{
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
}