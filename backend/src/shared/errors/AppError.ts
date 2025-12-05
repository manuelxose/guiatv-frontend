// src/v2/shared/errors/AppError.ts

/**
 * Base error used to express operational failures with HTTP-friendly metadata.
 */
export class AppError extends Error {
  constructor(
    override readonly message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true,
    public readonly code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
      },
    };
  }
}
