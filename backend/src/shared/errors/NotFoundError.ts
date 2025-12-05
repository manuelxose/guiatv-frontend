// src/v2/shared/errors/NotFoundError.ts

import { AppError } from './AppError';

/**
 * Error thrown when a requested resource cannot be found.
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(message, 404, true, 'NOT_FOUND');
  }
}
