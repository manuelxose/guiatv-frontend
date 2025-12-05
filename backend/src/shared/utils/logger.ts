// src/v2/shared/utils/logger.ts

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogMetadata {
  [key: string]: any;
}

/**
 * Minimal console-based logger with contextual namespacing and severity filtering.
 */
export class Logger {
  constructor(
    private readonly context: string,
    private readonly minLevel: LogLevel = LogLevel.INFO
  ) {}

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
    ];
    return levels.indexOf(level) <= levels.indexOf(this.minLevel);
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): string {
    const timestamp = new Date().toISOString();
    const base = `[${timestamp}] [${level.toUpperCase()}] [${
      this.context
    }] ${message}`;

    if (metadata && Object.keys(metadata).length > 0) {
      return `${base} ${JSON.stringify(metadata)}`;
    }

    return base;
  }

  // Accept either (message, Error, metadata) or (message, metadata)
  error(message: string, errorOrMetadata?: Error | LogMetadata, maybeMetadata?: LogMetadata): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    let errorObj: Error | undefined;
    let metadata: LogMetadata | undefined;

    if (errorOrMetadata instanceof Error) {
      errorObj = errorOrMetadata;
      metadata = maybeMetadata;
    } else {
      metadata = errorOrMetadata as LogMetadata | undefined;
    }

    // If metadata itself contains an `error` key that's an Error, prefer that
    if (metadata && (metadata as any).error instanceof Error) {
      errorObj = (metadata as any).error as Error;
      // remove the error object from metadata to avoid circular/duplicate info
      const { error: _e, ...rest } = metadata as any;
      metadata = rest;
    }

    const meta = {
      ...metadata,
      ...(errorObj && {
        error: {
          name: errorObj.name,
          message: errorObj.message,
          stack: errorObj.stack,
        },
      }),
    };

    console.error(this.formatMessage(LogLevel.ERROR, message, meta));
  }

  warn(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatMessage(LogLevel.WARN, message, metadata));
  }

  info(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.info(this.formatMessage(LogLevel.INFO, message, metadata));
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.debug(this.formatMessage(LogLevel.DEBUG, message, metadata));
  }

  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`, this.minLevel);
  }
}

/** Global logger instance scoped to the application root. */
export const logger = new Logger(
  'App',
  (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
);
