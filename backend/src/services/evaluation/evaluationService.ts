import type { OrchestratorResultFormat } from "../../utils/types/orchestrator/orchestratorResult";
import { GroqService } from "../llmProvider/groq/groqService";





export class EvaluationService{
    private groqService: GroqService;
    
    constructor(

    ){
        this.groqService = new GroqService();
    }
    async run(userId:string, conversationId:string, result:OrchestratorResultFormat){

        try {
            
            

        } catch (error) {
            console.error("Error in EvaluationService:", error);
            throw error;
        }
        
    }



}