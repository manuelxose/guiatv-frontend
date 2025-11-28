"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoUserRepository = void 0;
const User_model_1 = require("../database/models/User.model");
const logger_1 = require("../../shared/utils/logger");
class MongoUserRepository {
    async findById(id) {
        const doc = await User_model_1.UserModel.findById(id).lean().exec();
        return doc ? this.map(doc) : null;
    }
    async findByGoogleId(googleId) {
        const doc = await User_model_1.UserModel.findOne({ googleId }).lean().exec();
        return doc ? this.map(doc) : null;
    }
    async findOrCreateFromGoogle(user) {
        const existing = await User_model_1.UserModel.findOne({ googleId: user.id }).exec();
        if (existing) {
            existing.email = user.email;
            existing.name = user.name || existing.name;
            existing.picture = user.picture || existing.picture;
            existing.lastLoginAt = new Date();
            await existing.save();
            return this.map(existing.toObject());
        }
        const created = new User_model_1.UserModel({
            googleId: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            provider: 'google',
            lastLoginAt: new Date(),
        });
        await created.save();
        logger_1.logger.info('User created from Google login', { email: user.email });
        return this.map(created.toObject());
    }
    map(doc) {
        return {
            id: String(doc._id),
            googleId: doc.googleId,
            email: doc.email,
            name: doc.name,
            picture: doc.picture,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }
}
exports.MongoUserRepository = MongoUserRepository;
//# sourceMappingURL=MongoUserRepository.js.map