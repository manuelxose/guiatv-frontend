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
exports.ssrHandler = ssrHandler;
const path_1 = require("path");
const fs_1 = require("fs");
const config_1 = require("../server/config");
/**
 * Handler para Server-Side Rendering (SSR)
 * Migrado desde src/v1/index.ts (función loadSsrHandler)
 */
async function ssrHandler(req, res, next) {
    try {
        const distFolder = config_1.config.paths.distFolder;
        const serverBundleJs = (0, path_1.join)(distFolder, 'server', 'main.js');
        const serverBundleMjs = (0, path_1.join)(distFolder, 'server', 'server.mjs');
        const jsExists = (0, fs_1.existsSync)(serverBundleJs);
        const mjsExists = (0, fs_1.existsSync)(serverBundleMjs);
        if (!jsExists && !mjsExists) {
            console.warn('⚠️  SSR bundle not found at', serverBundleJs, 'or', serverBundleMjs);
            res.status(503).send('SSR bundle not built. Run the build step (e.g. `npm run build`) and ensure files exist in dist/guiatv/server/');
            return;
        }
        // Cargar el bundle SSR
        let mod;
        try {
            if (jsExists) {
                mod = await Promise.resolve(`${serverBundleJs}`).then(s => __importStar(require(s)));
            }
            else {
                mod = await Promise.resolve(`${serverBundleMjs}`).then(s => __importStar(require(s)));
            }
        }
        catch (e) {
            throw e;
        }
        // Buscar el handler exportado
        const exportedReqHandler = mod.reqHandler ||
            (mod.default &&
                (mod.default.reqHandler || mod.default.reqHandler?.reqHandler)) ||
            null;
        if (exportedReqHandler && typeof exportedReqHandler === 'function') {
            exportedReqHandler(req, res);
            return;
        }
        // Fallback: buscar app exportada
        const serverApp = mod.app || mod.default || mod.AppServerModule || mod;
        const expressApp = typeof serverApp === 'function' ? serverApp() : serverApp;
        if (expressApp) {
            expressApp(req, res);
            return;
        }
        // Si no encontramos nada, error
        throw new Error('No se encontró un handler SSR válido en el bundle');
    }
    catch (err) {
        console.error('❌ Error loading SSR bundle:', err);
        res.status(500).send('SSR server error');
    }
}
//# sourceMappingURL=handler.js.map