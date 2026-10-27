
import type { QueryFormat } from '../../../utils/types/query/queryFormat';
import type { llmResponseFormat } from '../../../utils/types/llm/llmResponse';
import { openRouter } from '../../../config/llm/llmConfig';
import { SYSTEM_PROMPT } from '../instructions/llmInstruction';





export class OpenRouterService {
    private readonly client;
    private readonly TIMEOUT_MS = 10000;

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

 console.log("Response from OpenRouterService:",{
                model: model,
                userId: userId,
                query: userQuery,
                response: response || "",
            });
    
            return {
                userId: userId,
                query: userQuery,
                response: response || "",
            }
            
        } catch (error) {
            console.error("Error in OpenRouterService:", error);
            throw error;
        } 


}
}