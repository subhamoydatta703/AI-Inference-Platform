export interface EvaluationResultFormat{
conversationId: string,
  query: {
    query: string;
    url?: string;
    language?: string;
    code?: string;
  },
  response?: string,
  error?: Error
}