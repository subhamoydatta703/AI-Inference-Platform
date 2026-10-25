import { type llmResponseFormat } from "../llm/llmResponse";


export interface OrchestratorResultFormat{
 result: Array<{
    model: string,
    response: llmResponseFormat 
 }>
}


export interface OrchestratorEvaluatedResultFormat{
    query: {
            query: string;
            url?: string;
            language?: string;
            code?: string;
},
    evaluatedResult?: string,
    error?:Error;
    
}


