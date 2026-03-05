// src/shared/utils/apiResponse.ts

/**
 * Standard API response envelope used across the backend.
 */
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

/**
 * Builds a success response with optional metadata.
 */
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

/**
 * Builds an error response consistent with the API contract.
 */
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
