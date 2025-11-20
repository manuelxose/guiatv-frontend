// src/shared/utils/apiResponse.ts

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: any;
}

export const createSuccessResponse = <T>(
  data: T,
  meta?: any
): ApiResponse<T> => {
  return {
    success: true,
    data,
    meta,
  };
};

export const createErrorResponse = (
  code: string,
  message: string,
  details?: any
): ApiResponse => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
};
