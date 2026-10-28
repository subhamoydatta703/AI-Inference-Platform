export interface EvaluationResultFormat{
conversationId: string,
  query: {
    query: string;
    url?: string;
    language?: string;
    code?: string;
  },
  rawText?: string,
  response?: unknown,
  error?: Error
}