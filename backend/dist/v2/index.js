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
exports.apiv2 = exports.v2 = void 0;
const v2 = async (req, res) => {
    try {
        // Lazy-load heavy modules to avoid initialization-time work
        await Promise.all([Promise.resolve().then(() => __importStar(require('./presentation/routes/app'))), Promise.resolve().then(() => __importStar(require('./config/container')))]);
        // Do not call container.initialize() automatically here to avoid long startup during cold load.
        // Consumers can initialize when they need to perform heavy operations.
        // const container = containerModule.createContainer();
        // await container.initialize();
        // If you need to create an express app for processing, do it here (lazy)
        // const app = appModule.createApp(container);
        res.status(200).json({ status: 'ok', message: 'v2 with imports' });
    }
    catch (e) {
        console.error('Error in v2 handler', e);
        res.status(500).json({ status: 'error', message: 'Error in v2 handler' });
    }
};
exports.v2 = v2;
exports.apiv2 = exports.v2;
//# sourceMappingURL=index.js.map