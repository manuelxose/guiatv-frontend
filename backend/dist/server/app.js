"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const app_1 = require("../presentation/routes/app");
/**
 * Thin wrapper to keep server entrypoints consistent. The real routing/app
 * assembly lives in presentation/routes/app.
 */
const createApp = (dependencies) => {
    return (0, app_1.createApp)(dependencies);
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map