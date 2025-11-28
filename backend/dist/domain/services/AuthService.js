"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../../shared/errors");
const logger_1 = require("../../shared/utils/logger");
class AuthService {
    constructor(googleClientId, jwtSecret, userRepo) {
        this.googleClientId = googleClientId;
        this.jwtSecret = jwtSecret;
        this.userRepo = userRepo;
        if (googleClientId) {
            this.googleClient = new google_auth_library_1.OAuth2Client(googleClientId);
        }
    }
    /**
     * Exchange Google idToken for an app session.
     * - Verifies Google token
     * - Upserts user in Mongo
     * - Issues JWT signed with backend secret
     */
    async loginWithGoogle(idToken) {
        const googleUser = await this.verifyGoogleToken(idToken);
        const user = await this.userRepo.findOrCreateFromGoogle(googleUser);
        const token = this.signSessionToken(user.id, user.email);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
            },
            token,
        };
    }
    /**
     * Validate JWT and return associated user.
     */
    async getSession(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            const userId = payload.sub;
            if (!userId)
                throw new errors_1.UnauthorizedError('Invalid token payload');
            const user = await this.userRepo.findById(userId);
            if (!user)
                throw new errors_1.UnauthorizedError('User not found');
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
            };
        }
        catch (error) {
            logger_1.logger.warn('Failed to validate session token', { error });
            throw new errors_1.UnauthorizedError('Invalid or expired token');
        }
    }
    async verifyGoogleToken(idToken) {
        if (!this.googleClient || !this.googleClientId) {
            throw new errors_1.UnauthorizedError('Google client ID is not configured');
        }
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: this.googleClientId,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.sub || !payload.email) {
                throw new errors_1.UnauthorizedError('Invalid Google token payload');
            }
            return {
                id: payload.sub,
                email: payload.email,
                name: payload.name || undefined,
                picture: payload.picture || undefined,
            };
        }
        catch (error) {
            logger_1.logger.warn('Google token verification failed', { error });
            throw new errors_1.UnauthorizedError(error instanceof Error ? error.message : 'Invalid Google token');
        }
    }
    signSessionToken(userId, email) {
        const expiresIn = '7d';
        return jsonwebtoken_1.default.sign({
            sub: userId,
            email,
        }, this.jwtSecret, { expiresIn });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map