"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../presentation/routes/app");
const config_1 = require("./config");
const container_1 = require("../config/container");
const logger_1 = require("../shared/utils/logger");
/**
 * Entry point for the standalone Express server.
 */
async function startServer() {
    try {
        logger_1.logger.info('Starting Express server', { env: config_1.config.nodeEnv, port: config_1.config.port });
        (0, config_1.validateConfig)();
        const container = (0, container_1.createContainer)();
        await container.initialize();
        logger_1.logger.info('Container initialized');
        const app = (0, app_1.createApp)({
            channelController: container.get('channelController'),
            programController: container.get('programController'),
            scheduleController: container.get('scheduleController'),
            adminController: container.get('adminController'),
            ssrController: container.get('ssrController'),
        });
        const { initializeJobs } = await Promise.resolve().then(() => __importStar(require('../jobs')));
        initializeJobs();
        const server = app.listen(config_1.config.port, () => {
            logger_1.logger.info(`Server listening on http://localhost:${config_1.config.port}`);
        });
        const shutdown = async (signal) => {
            logger_1.logger.warn(`${signal} received, shutting down HTTP server`);
            server.close(async () => {
                logger_1.logger.info('HTTP server closed');
                try {
                    await container.cleanup();
                }
                catch (error) {
                    logger_1.logger.warn('Error while cleaning up container during shutdown', { error });
                }
                process.exit(0);
            });
            setTimeout(() => {
                logger_1.logger.error('Forcefully exiting after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Fatal error while starting server', { error });
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map