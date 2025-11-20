"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwaggerRoutes = void 0;
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_config_1 = require("../swagger/swagger.config");
const createSwaggerRoutes = () => {
    const router = (0, express_1.Router)();
    const spec = (0, swagger_config_1.getSwaggerSpec)();
    // Swagger UI options
    const uiOptions = {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Guía TV API Documentation',
        explorer: true,
        swaggerOptions: {
            docExpansion: 'none',
            filter: true,
            showRequestDuration: true,
            persistAuthorization: true,
        },
    };
    // Swagger UI
    router.use('/', swagger_ui_express_1.default.serve);
    router.get('/', swagger_ui_express_1.default.setup(spec, uiOptions));
    // JSON spec
    router.get('/json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(spec);
    });
    return router;
};
exports.createSwaggerRoutes = createSwaggerRoutes;
//# sourceMappingURL=swagger.routes.js.map