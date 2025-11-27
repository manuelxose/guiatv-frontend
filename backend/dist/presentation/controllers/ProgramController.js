"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramController = void 0;
const ChannelMapper_1 = require("../../application/mappers/ChannelMapper");
const errors_1 = require("../../shared/errors");
const ApiResponse_1 = require("../../shared/types/ApiResponse");
class ProgramController {
    constructor(getPrograms, getChannelById, getProgramById) {
        this.getPrograms = getPrograms;
        this.getChannelById = getChannelById;
        this.getProgramById = getProgramById;
    }
    /**
     * GET /v2/programs
     */
    async getProgramsHandler(req, res) {
        const { date, channels, timeSlot, fields, page, limit, country, channelTypes } = req.query;
        if (!date || typeof date !== 'string') {
            throw new errors_1.ValidationError('Date is required');
        }
        const request = {
            date,
            channels: channels
                ? channels.split(',').map((id) => id.trim())
                : undefined,
            timeSlot: timeSlot,
            fields: fields,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            country: country,
            channelTypes: channelTypes
                ? String(channelTypes)
                    .split(',')
                    .map((id) => id.trim())
                : undefined,
        };
        const result = await this.getPrograms.execute(request);
        res
            .status(200)
            .json((0, ApiResponse_1.successResponse)({
            date: result.date,
            timeSlots: result.timeSlots,
            channels: result.channels,
            programs: result.programs,
        }, result.meta));
    }
    /**
     * GET /v2/channels/:id/programs
     */
    async getByChannel(req, res) {
        const { id } = req.params;
        const { date, timeSlot, fields, page, limit, country, channelTypes } = req.query;
        const channel = await this.getChannelById.execute(id);
        if (!channel) {
            throw new errors_1.NotFoundError('Channel', id);
        }
        const request = {
            date: date || 'today',
            channels: [id],
            timeSlot: timeSlot,
            fields: fields,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            country: country,
            channelTypes: channelTypes
                ? String(channelTypes)
                    .split(',')
                    .map((id) => id.trim())
                : undefined,
        };
        const result = await this.getPrograms.execute(request);
        res.status(200).json((0, ApiResponse_1.successResponse)({
            channel: ChannelMapper_1.ChannelMapper.toDTO(channel),
            date: result.date,
            programs: result.programs,
        }, {
            ...result.meta,
            totalChannels: 1,
        }));
    }
    /**
     * GET /v2/programs/:id
     */
    async getById(req, res) {
        const { id } = req.params;
        const result = await this.getProgramById.execute(id);
        res.status(200).json((0, ApiResponse_1.successResponse)({
            program: result.program,
        }));
    }
}
exports.ProgramController = ProgramController;
//# sourceMappingURL=ProgramController.js.map