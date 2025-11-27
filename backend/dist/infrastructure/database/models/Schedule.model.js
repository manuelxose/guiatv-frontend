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
exports.ScheduleModel = void 0;
const mongoose = __importStar(require("mongoose"));
const mongoose_1 = require("mongoose");
const ScheduleChannelSchema = new mongoose_1.Schema({
    channelId: { type: String, required: true },
    programs: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
}, { _id: false });
const ScheduleSchema = new mongoose_1.Schema({
    date: { type: String, required: true, unique: true, index: true },
    layoutVersion: { type: String },
    generatedAt: { type: Date, default: () => new Date(), index: true },
    timeSlots: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    channelMeta: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    channels: { type: [ScheduleChannelSchema], default: [] },
    meta: { type: mongoose_1.Schema.Types.Mixed },
}, {
    timestamps: true,
    collection: 'schedules',
});
ScheduleSchema.index({ date: 1, 'channels.channelId': 1 });
exports.ScheduleModel = mongoose.model('Schedule', ScheduleSchema);
//# sourceMappingURL=Schedule.model.js.map