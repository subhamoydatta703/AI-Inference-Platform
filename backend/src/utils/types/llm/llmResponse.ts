import {type QueryFormat } from "../query/queryFormat";

export interface llmResponseFormat {
    userId: string,
    query: QueryFormat,
    response?: string,
    error?: Error;
    
}