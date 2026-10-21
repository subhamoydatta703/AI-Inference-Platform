import type { Message } from "../../utils/types/message";
import type { EvaluationResultFormat } from "../../utils/types/evaluation/evaluationResult";
import type { OrchestratorResultFormat } from "../../utils/types/orchestrator/orchestratorResult";
import type { QueryFormat } from "../../utils/types/query/queryFormat";
import { GroqService } from "../llmProvider/groq/groqService";




export class OrchestratorService {
    
    private conversationId: string;
    private groqService: GroqService;
    // private toolPicker: ToolPicker;
    

    constructor(){
        this.groqService = new GroqService();
        this.conversationId = `${crypto.randomUUID()}`
        
        
    }
    
    async run(userId:string, userQuery:QueryFormat, conversationId=this.conversationId ):Promise<EvaluationResultFormat>{

        try {
            
                     const query: QueryFormat = {
                        conversationId: conversationId,
                        query: userQuery?.query,
                        url: userQuery?.url,
                        language: userQuery?.language,
                        code: userQuery?.code,
                    }
            
                  const response = await this.groqService.generateResponse(userId, query, "openai/gpt-oss-20b");
                  // if(response.error){
                  //   throw response.error;
                  // }
                  

                  const response2 = await this.groqService.generateResponse(userId, query, "openai/gpt-oss-120b");
                  // if(response2.error){
                  //   throw response2.error;
                  // }

                  const response3 = await this.groqService.generateResponse(userId, query, "qwen/qwen3.8-27b");
                  // if(response3.error){
                  //   throw response3.error;
                  // }

                  const result: OrchestratorResultFormat = {
                    result: [
                        {model: "openai/gpt-oss-20b", response: response},
                        {model: "openai/gpt-oss-120b", response: response2},
                        {model: "qwen/qwen3.8-27b", response: response3}
                    ]
                  }

                  const evaluationResult = await this.groqService.evaluate(userId, query, result)  
                  if(evaluationResult.error){
                    throw evaluationResult.error;
                  }

                  return evaluationResult
            
        } catch (error) {
            console.error("Error in OrchestratorService:", error);
            throw error;
        }
    }
    
}
