"use strict";
// src/v2/presentation/controllers/ScheduleController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleController = void 0;
const ChannelMapper_1 = require("../../application/mappers/ChannelMapper");
const errors_1 = require("../../shared/errors");
const logger_1 = require("../../shared/utils/logger");
const dateUtils_1 = require("../../shared/utils/dateUtils");
const ApiResponse_1 = require("../../shared/types/ApiResponse");
class ScheduleController {
    constructor(getPrograms, getAllChannels) {
        this.getPrograms = getPrograms;
        this.getAllChannels = getAllChannels;
        this.logger = logger_1.logger.child('ScheduleController');
    }
    /**
     * @openapi
     * /v2/schedules/{date}:
     *   get:
     *     tags:
     *       - Schedules
     *     summary: Obtener programación completa por fecha
     *     description: Retorna la programación de todos los canales para una fecha específica
     *     parameters:
     *       - $ref: '#/components/parameters/DateParam'
     */
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
        const programsResponse = await this.getPrograms.execute({
            date: normalizedDate,
            limit: 10000,
            fields: 'full',
        });
        const programs = programsResponse.programs;
        // Agrupar por canal
        const programsByChannel = new Map();
        programs.forEach((p) => {
            const list = programsByChannel.get(p.channelId) || [];
            list.push(p);
            programsByChannel.set(p.channelId, list);
        });
        // Obtener información de canales
        const channels = await this.getAllChannels.execute({ isActive: true });
        // Construir respuesta
        const channelSchedules = Array.from(programsByChannel.entries())
            .map(([channelId, channelPrograms]) => {
            const channel = channels.find((c) => c.id === channelId);
            return {
                channel: channel ? ChannelMapper_1.ChannelMapper.toDTO(channel) : null,
                programs: channelPrograms,
            };
        })
            .filter((cs) => cs.channel !== null);
        res.status(200).json((0, ApiResponse_1.successResponse)({
            date: normalizedDate,
            channels: channelSchedules,
        }, {
            totalChannels: channelSchedules.length,
            totalPrograms: programs.length,
        }));
    }
    /**
     * @openapi
     * /v2/schedules/{date}/channels:
     *   get:
     *     tags:
     *       - Schedules
     *     summary: Obtener resumen de canales por fecha
     */
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
        const { programs } = await this.getPrograms.execute({
            date: normalizedDate,
            limit: 10000,
            fields: 'minimal',
        });
        const programsByChannel = new Map();
        programs.forEach((p) => {
            const list = programsByChannel.get(p.channelId) || [];
            list.push(p);
            programsByChannel.set(p.channelId, list);
        });
        const channels = await this.getAllChannels.execute({ isActive: true });
        const summary = Array.from(programsByChannel.entries())
            .map(([channelId, channelPrograms]) => {
            const channel = channels.find((c) => c.id === channelId);
            return {
                channel: channel ? ChannelMapper_1.ChannelMapper.toDTO(channel) : null,
                programCount: channelPrograms.length,
                firstProgram: channelPrograms[0]?.start,
                lastProgram: channelPrograms[channelPrograms.length - 1]?.end,
            };
        })
            .filter((s) => s.channel !== null);
        res.status(200).json((0, ApiResponse_1.successResponse)({
            date: normalizedDate,
            channels: summary,
        }, {
            totalChannels: summary.length,
        }));
    }
}
exports.ScheduleController = ScheduleController;
//# sourceMappingURL=ScheduleController.js.map