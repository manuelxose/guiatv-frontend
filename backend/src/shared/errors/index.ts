// src/v2/shared/errors/index.ts

import { AppError } from './AppError';

export { AppError } from './AppError';
export { NotFoundError } from './NotFoundError';
export { ValidationError, ValidationErrorDetail } from './ValidationError';

// Errores adicionales comunes
/** Error for missing authentication. */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true, 'UNAUTHORIZED');
  }
}

/** Error for lack of permissions. */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, true, 'FORBIDDEN');
  }
}

/** Error when a request conflicts with current state. */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT');
  }
}

/** Error when clients exceed rate limits. */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'TOO_MANY_REQUESTS');
  }
}

/** Error for temporary unavailability of services. */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, false, 'SERVICE_UNAVAILABLE');
  }
}

/** Error for invalid input requests. */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400, true, 'BAD_REQUEST');
  }
}
