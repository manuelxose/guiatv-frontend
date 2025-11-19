"use strict";
// src/v2/scheduledFunctions.ts (exportar todas las scheduled functions)
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanOldProgramsHandler = exports.precomputeSchedulesHandler = exports.syncEPGDataHandler = void 0;
var syncScheduledFunction_1 = require("./infrastructure/scheduled/syncScheduledFunction");
Object.defineProperty(exports, "syncEPGDataHandler", { enumerable: true, get: function () { return syncScheduledFunction_1.syncEPGDataHandler; } });
Object.defineProperty(exports, "precomputeSchedulesHandler", { enumerable: true, get: function () { return syncScheduledFunction_1.precomputeSchedulesHandler; } });
Object.defineProperty(exports, "cleanOldProgramsHandler", { enumerable: true, get: function () { return syncScheduledFunction_1.cleanOldProgramsHandler; } });
//# sourceMappingURL=scheduledFunctions.js.map