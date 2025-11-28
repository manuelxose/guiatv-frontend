"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const errors_1 = require("../../shared/errors");
class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    /**
     * POST /v2/auth/google
     * Body: { idToken: string }
     */
    async loginWithGoogle(req, res) {
        const idToken = req.body?.idToken;
        if (!idToken) {
            throw new errors_1.BadRequestError('idToken is required');
        }
        const result = await this.authService.loginWithGoogle(idToken);
        res.json({
            success: true,
            data: result,
        });
    }
    /**
     * GET /v2/auth/me
     * Header: Authorization: Bearer <jwt>
     */
    async me(req, res) {
        const token = extractToken(req);
        if (!token) {
            throw new errors_1.UnauthorizedError('Authorization token missing');
        }
        const user = await this.authService.getSession(token);
        res.json({
            success: true,
            data: user,
        });
    }
    /**
     * POST /v2/auth/logout
     * Client can simply discard token; endpoint provided for completeness.
     */
    async logout(_req, res) {
        res.json({ success: true });
    }
}
exports.AuthController = AuthController;
function extractToken(req) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    if (req.query?.token && typeof req.query.token === 'string') {
        return req.query.token;
    }
    if (req.body?.token) {
        return req.body.token;
    }
    return null;
}
//# sourceMappingURL=AuthController.js.map