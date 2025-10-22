// src/v2/shared/errors/ValidationError.ts

import { AppError } from './AppError';

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly details?: ValidationErrorDetail[]
  ) {
    super(message, 400, true, 'VALIDATION_ERROR');
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}
