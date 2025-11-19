"use strict";
// src/v2/config/firebase.config.ts
// Firebase Functions v7: Config files use process.env directly
// Params module should only be used inside function handlers
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseConfig = void 0;
/**
 * Firebase configuration using environment variables
 * In v7, config files that are imported at module level should use process.env.
 */
exports.firebaseConfig = {
    projectId: process.env.PROJECT_ID || 'guia-tv-8fe3c',
    storageBucket: process.env.STORAGE_BUCKET || 'guia-tv-8fe3c.appspot.com',
};
//# sourceMappingURL=firebase.config.js.map