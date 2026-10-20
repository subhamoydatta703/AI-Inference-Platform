import type { Message } from "../../utils/types/message";
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
    
    async run(userId:string, userQuery:QueryFormat, conversationId=this.conversationId ){

        try {
            
                     const query: QueryFormat = {
                        conversationId: conversationId,
                        query: userQuery?.query,
                        url: userQuery?.url,
                        language: userQuery?.language,
                        code: userQuery?.code,
                    }
            
                  const response = await this.groqService.generateResponse(userId, query);
                  if(response.error){
                    throw response.error;
                  }else{
                    return response;
                  }
            
        } catch (error) {
            console.error("Error in OrchestratorService:", error);
            throw error;
        }
    }
    
}