import {type QueryFormat } from "../query/queryFormat";

export interface llmResponseFormat {
    userId: string,
    query: QueryFormat,
    rawText?: string,
    response?: unknown,
    error?: Error;
    
}