"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutController = void 0;
const ApiResponse_1 = require("../../shared/types/ApiResponse");
const errors_1 = require("../../shared/errors");
class LayoutController {
    constructor(getProgramLayouts) {
        this.getProgramLayouts = getProgramLayouts;
    }
    /**
     * GET /v2/layouts/:date
     * Query: channels (csv), timeSlot, fields
     */
    async getByDate(req, res) {
        const { date } = req.params;
        const { channels, timeSlot, fields } = req.query;
        if (!date) {
            throw new errors_1.ValidationError('date is required');
        }
        const channelList = channels
            ? String(channels)
                .split(',')
                .map((c) => c.trim())
                .filter(Boolean)
            : undefined;
        const result = await this.getProgramLayouts.execute({
            date,
            channels: channelList,
            timeSlot: timeSlot,
            fields: fields,
        });
        res
            .status(200)
            .json((0, ApiResponse_1.successResponse)({
            date: result.date,
            timeSlots: result.timeSlots,
            channels: result.channels,
        }, result.meta));
    }
}
exports.LayoutController = LayoutController;
//# sourceMappingURL=LayoutController.js.map