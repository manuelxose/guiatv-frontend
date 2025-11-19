"use strict";
// Legacy v1 API routes removed during migration away from Firebase/GCS.
// These stubs keep the module in place so TypeScript builds succeed and
// callers receive a clear error indicating migration.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Programa = void 0;
exports.obtenerProgramacion = obtenerProgramacion;
async function obtenerProgramacion() {
    throw new Error('v1 API removed: use v2 API. Configure DB_ADAPTER=mongo and STORAGE_ADAPTER=local or s3.');
}
exports.Programa = {};
//# sourceMappingURL=api.js.map