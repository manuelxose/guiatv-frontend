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
exports.ChannelModel = void 0;
// Require mongoose at runtime to avoid depending on ambient types during build
const mongoose = __importStar(require("mongoose"));
const mongoose_1 = require("mongoose");
/**
 * Channel schema definition
 */
const ChannelSchema = new mongoose_1.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    logo: {
        type: String,
        trim: true,
    },
    country: {
        type: String,
        trim: true,
        index: true,
    },
    language: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        trim: true,
    },
    url: {
        type: String,
        trim: true,
    },
    active: {
        type: Boolean,
        default: true,
        index: true,
    },
    order: {
        type: Number,
        default: 0,
        index: true,
    },
}, {
    timestamps: true,
    collection: 'channels',
});
// Compound indexes for common queries
ChannelSchema.index({ country: 1, active: 1, order: 1 });
ChannelSchema.index({ active: 1, order: 1 });
/**
 * Channel model
 */
exports.ChannelModel = mongoose.model('Channel', ChannelSchema);
//# sourceMappingURL=Channel.model.js.map