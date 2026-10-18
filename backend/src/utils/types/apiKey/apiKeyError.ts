
export interface ApiErrorResponse {
    success: false,
    status: 'error';
    code: string;
    message: string;
    details?: string;
  }
  