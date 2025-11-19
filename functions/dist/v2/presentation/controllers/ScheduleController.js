"use strict";
// src/v2/presentation/controllers/ScheduleController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleController = void 0;
const ProgramMapper_1 = require("../../application/mappers/ProgramMapper");
const ChannelMapper_1 = require("../../application/mappers/ChannelMapper");
const errors_1 = require("../../shared/errors");
const logger_1 = require("../../shared/utils/logger");
const dateUtils_1 = require("../../shared/utils/dateUtils");
class ScheduleController {
    constructor(getProgramsByDate, getAllChannels, programService) {
        this.getProgramsByDate = getProgramsByDate;
        this.getAllChannels = getAllChannels;
        this.programService = programService;
        this.logger = logger_1.logger.child('ScheduleController');
    }
    async getByDate(req, res) {
        const { date } = req.params;
        this.logger.info('Getting schedule by date', { date });
        let normalizedDate;
        try {
            normalizedDate = dateUtils_1.DateUtils.parseDateAlias(date);
        }
        catch (error) {
            throw new errors_1.ValidationError('Invalid date format or alias');
        }
        // Obtener todos los programas del día
        const programs = await this.getProgramsByDate.execute({
            date: normalizedDate,
            limit: 10000, // Sin límite para schedule completo
        });
        // Agrupar por canal
        const programsByChannel = this.programService.groupByChannel(programs);
        // Obtener información de canales
        const channels = await this.getAllChannels.execute({ isActive: true });
        // Construir respuesta
        const channelSchedules = Array.from(programsByChannel.entries())
            .map(([channelId, channelPrograms]) => {
            const channel = channels.find((c) => c.id === channelId);
            return {
                channel: channel ? ChannelMapper_1.ChannelMapper.toDTO(channel) : null,
                programs: ProgramMapper_1.ProgramMapper.toDTOList(channelPrograms),
            };
        })
            .filter((cs) => cs.channel !== null); // Solo canales válidos
        res.status(200).json({
            date: normalizedDate,
            channels: channelSchedules,
            meta: {
                totalChannels: channelSchedules.length,
                totalPrograms: programs.length,
            },
        });
    }
    async getChannelsSummary(req, res) {
        const { date } = req.params;
        this.logger.info('Getting channels summary for date', { date });
        let normalizedDate;
        try {
            normalizedDate = dateUtils_1.DateUtils.parseDateAlias(date);
        }
        catch (error) {
            throw new errors_1.ValidationError('Invalid date format or alias');
        }
        const programs = await this.getProgramsByDate.execute({
            date: normalizedDate,
            limit: 10000,
        });
        const programsByChannel = this.programService.groupByChannel(programs);
        const channels = await this.getAllChannels.execute({ isActive: true });
        const summary = Array.from(programsByChannel.entries())
            .map(([channelId, channelPrograms]) => {
            const channel = channels.find((c) => c.id === channelId);
            return {
                channel: channel ? ChannelMapper_1.ChannelMapper.toDTO(channel) : null,
                programCount: channelPrograms.length,
                firstProgram: channelPrograms[0]?.startTime.toISOString(),
                lastProgram: channelPrograms[channelPrograms.length - 1]?.endTime.toISOString(),
            };
        })
            .filter((s) => s.channel !== null);
        res.status(200).json({
            date: normalizedDate,
            channels: summary,
            meta: {
                totalChannels: summary.length,
            },
        });
    }
}
exports.ScheduleController = ScheduleController;
//# sourceMappingURL=ScheduleController.js.map