"use strict";
// Require mongoose at runtime to avoid depending on ambient types during build
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
exports.ProgramModel = void 0;
const mongoose = __importStar(require("mongoose"));
const mongoose_1 = require("mongoose");
/**
 * Program schema definition
 */
const ProgramSchema = new mongoose_1.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    channelId: {
        type: String,
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    startTime: {
        type: Date,
        required: true,
        index: true,
    },
    endTime: {
        type: Date,
        required: true,
        index: true,
    },
    startUtc: {
        type: String,
    },
    endUtc: {
        type: String,
    },
    date: {
        type: String,
        index: true,
    },
    startMinutes: {
        type: Number,
        index: true,
    },
    endMinutes: {
        type: Number,
    },
    durationMinutes: {
        type: Number,
    },
    timeSlotIndex: {
        type: Number,
        index: true,
    },
    category: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
        trim: true,
    },
    rating: {
        type: String,
        trim: true,
    },
    layoutVersion: {
        type: String,
    },
    precomputedLayout: {
        type: Boolean,
    },
    precomputedLayouts: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    layoutsBySlot: {
        type: [mongoose_1.Schema.Types.Mixed],
    },
}, {
    timestamps: true,
    collection: 'programs',
});
// Compound indexes for common queries
ProgramSchema.index({ channelId: 1, startTime: 1 });
ProgramSchema.index({ channelId: 1, endTime: 1 });
ProgramSchema.index({ startTime: 1, endTime: 1 });
ProgramSchema.index({ channelId: 1, startTime: 1, endTime: 1 });
ProgramSchema.index({ category: 1 });
ProgramSchema.index({ date: 1, channelId: 1, startMinutes: 1 });
ProgramSchema.index({ date: 1, startMinutes: 1 });
ProgramSchema.index({ date: 1, channelId: 1, startTime: 1 });
ProgramSchema.index({ date: 1, channelId: 1, startUtc: 1 });
ProgramSchema.index({ channelId: 1, startUtc: 1 });
ProgramSchema.index({ date: 1, timeSlotIndex: 1 });
ProgramSchema.index({ startUtc: 1 });
/**
 * Program model
 */
exports.ProgramModel = mongoose.model('Program', ProgramSchema);
//# sourceMappingURL=Program.model.js.map