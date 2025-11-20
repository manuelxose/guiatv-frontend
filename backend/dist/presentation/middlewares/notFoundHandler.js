"use strict";
// src/v2/presentation/middlewares/notFoundHandler.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const errors_1 = require("../../shared/errors");
const notFoundHandler = (req, res) => {
    throw new errors_1.NotFoundError('Route', req.path);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=notFoundHandler.js.map