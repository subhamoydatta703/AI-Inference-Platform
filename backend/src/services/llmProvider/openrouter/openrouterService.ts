
import type { QueryFormat } from '../../../utils/types/query/queryFormat';
import type { llmResponseFormat } from '../../../utils/types/llm/llmResponse';
import { openRouter } from '../../../config/llm/llmConfig';
import { SYSTEM_PROMPT } from '../instructions/llmInstruction';
import { toJson } from '../../../utils/response/jsonFormat';





export class OpenRouterService {
    private readonly client;
    private readonly TIMEOUT_MS = 20000;

    constructor() {
        this.client = openRouter;

    }

    // query
    async generateResponse(userId:string, userQuery: QueryFormat, model: string): Promise<llmResponseFormat> {   
        const signal = AbortSignal.timeout(this.TIMEOUT_MS);
      try {
            const stream = await this.client.chat.send({
  chatRequest: {
    model: model,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: JSON.stringify(userQuery),
      },
    ],
    stream: true,
  }
}, {signal});

if (!(stream instanceof ReadableStream)) {
  return {
    userId: userId,
    query: userQuery,
    error: new Error("Expected streaming response"),
  };
}
let response = "";

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;

  if (content) {
    response += content;
  }
}



const resType = userQuery.responseType

const modelResponse = resType === "json" ? toJson(response) : response || ""



 console.log("Response from OpenRouterService:",{
                model: model,
                query: userQuery,
                rawText: response,
                response: modelResponse,
            });
    
            return {
                
                query: userQuery,
                rawText: response,
                response: modelResponse,
            }
            
        } catch (error) {
            console.error("Error in OpenRouterService:", error);
            throw error;
        } 


}
}