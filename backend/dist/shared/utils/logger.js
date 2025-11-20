"use strict";
// src/v2/shared/utils/logger.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(context, minLevel = LogLevel.INFO) {
        this.context = context;
        this.minLevel = minLevel;
    }
    shouldLog(level) {
        const levels = [
            LogLevel.ERROR,
            LogLevel.WARN,
            LogLevel.INFO,
            LogLevel.DEBUG,
        ];
        return levels.indexOf(level) <= levels.indexOf(this.minLevel);
    }
    formatMessage(level, message, metadata) {
        const timestamp = new Date().toISOString();
        const base = `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`;
        if (metadata && Object.keys(metadata).length > 0) {
            return `${base} ${JSON.stringify(metadata)}`;
        }
        return base;
    }
    // Accept either (message, Error, metadata) or (message, metadata)
    error(message, errorOrMetadata, maybeMetadata) {
        if (!this.shouldLog(LogLevel.ERROR))
            return;
        let errorObj;
        let metadata;
        if (errorOrMetadata instanceof Error) {
            errorObj = errorOrMetadata;
            metadata = maybeMetadata;
        }
        else {
            metadata = errorOrMetadata;
        }
        // If metadata itself contains an `error` key that's an Error, prefer that
        if (metadata && metadata.error instanceof Error) {
            errorObj = metadata.error;
            // remove the error object from metadata to avoid circular/duplicate info
            const { error: _e, ...rest } = metadata;
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
    warn(message, metadata) {
        if (!this.shouldLog(LogLevel.WARN))
            return;
        console.warn(this.formatMessage(LogLevel.WARN, message, metadata));
    }
    info(message, metadata) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        console.info(this.formatMessage(LogLevel.INFO, message, metadata));
    }
    debug(message, metadata) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        console.debug(this.formatMessage(LogLevel.DEBUG, message, metadata));
    }
    child(subContext) {
        return new Logger(`${this.context}:${subContext}`, this.minLevel);
    }
}
exports.Logger = Logger;
// Instancia global
exports.logger = new Logger('App', process.env.LOG_LEVEL || LogLevel.INFO);
//# sourceMappingURL=logger.js.map