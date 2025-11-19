"use strict";
// src/v2/presentation/controllers/ProgramController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramController = void 0;
const ProgramMapper_1 = require("../../application/mappers/ProgramMapper");
const ChannelMapper_1 = require("../../application/mappers/ChannelMapper");
const errors_1 = require("../../shared/errors");
const logger_1 = require("../../shared/utils/logger");
const dateUtils_1 = require("../../shared/utils/dateUtils");
class ProgramController {
    constructor(getProgramsByDate, getChannelPrograms, getChannelById) {
        this.getProgramsByDate = getProgramsByDate;
        this.getChannelPrograms = getChannelPrograms;
        this.getChannelById = getChannelById;
        this.logger = logger_1.logger.child('ProgramController');
    }
    async getByDate(req, res) {
        const { date } = req.params;
        const { channelId, genre, limit, offset } = req.query;
        this.logger.info('Getting programs by date', { date, channelId, genre });
        let normalizedDate;
        try {
            normalizedDate = dateUtils_1.DateUtils.parseDateAlias(date);
        }
        catch (error) {
            throw new errors_1.ValidationError('Invalid date format or alias', [
                {
                    field: 'date',
                    message: 'Expected YYYYMMDD format or alias (today, tomorrow, after_tomorrow)',
                    value: date,
                },
            ]);
        }
        const programs = await this.getProgramsByDate.execute({
            date: normalizedDate,
            channelId: channelId,
            genre: genre,
            limit: limit ? parseInt(limit, 10) : 100,
            offset: offset ? parseInt(offset, 10) : 0,
        });
        const dto = ProgramMapper_1.ProgramMapper.toDTOList(programs);
        res.status(200).json({
            programs: dto,
            meta: {
                total: dto.length,
                date: normalizedDate,
            },
        });
    }
    async getByChannel(req, res) {
        const { channelId } = req.params;
        const { date, fromTime, toTime } = req.query;
        this.logger.info('Getting programs by channel', { channelId, date });
        // Validar que el canal existe
        const channel = await this.getChannelById.execute(channelId);
        if (!channel) {
            throw new errors_1.NotFoundError('Channel', channelId);
        }
        let normalizedDate;
        try {
            normalizedDate = dateUtils_1.DateUtils.parseDateAlias(date || 'today');
        }
        catch (error) {
            throw new errors_1.ValidationError('Invalid date format or alias');
        }
        const programs = await this.getChannelPrograms.execute({
            channelId,
            date: normalizedDate,
            fromTime: fromTime,
            toTime: toTime,
        });
        res.status(200).json({
            channel: ChannelMapper_1.ChannelMapper.toDTO(channel),
            programs: ProgramMapper_1.ProgramMapper.toDTOList(programs),
            meta: {
                total: programs.length,
                date: normalizedDate,
            },
        });
    }
}
exports.ProgramController = ProgramController;
//# sourceMappingURL=ProgramController.js.map