"use strict";
// src/v2/application/use-cases/PrecomputeSchedule.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrecomputeSchedule = void 0;
const ProgramMapper_1 = require("../mappers/ProgramMapper");
const ChannelMapper_1 = require("../mappers/ChannelMapper");
const logger_1 = require("../../shared/utils/logger");
class PrecomputeSchedule {
    constructor(getProgramsByDate, getAllChannels, programService, storageRepository // ✅ Interfaz
    ) {
        this.getProgramsByDate = getProgramsByDate;
        this.getAllChannels = getAllChannels;
        this.programService = programService;
        this.storageRepository = storageRepository;
        this.precomputeLogger = logger_1.logger.child('PrecomputeSchedule');
    }
    async execute(request) {
        try {
            this.precomputeLogger.info('Precomputing schedule', {
                date: request.date,
            });
            // 1. Obtener todos los programas del día
            const programs = await this.getProgramsByDate.execute({
                date: request.date,
                limit: 10000,
            });
            // 2. Agrupar por canal
            const programsByChannel = this.programService.groupByChannel(programs);
            // 3. Obtener información de canales
            const channels = await this.getAllChannels.execute({ isActive: true });
            // 4. Construir estructura de respuesta
            const schedule = Array.from(programsByChannel.entries())
                .map(([channelId, channelPrograms]) => {
                const channel = channels.find((c) => c.id === channelId);
                return {
                    channel: channel ? ChannelMapper_1.ChannelMapper.toDTO(channel) : null,
                    programs: ProgramMapper_1.ProgramMapper.toDTOList(channelPrograms),
                };
            })
                .filter((s) => s.channel !== null);
            // 5. Convertir a JSON
            const jsonContent = JSON.stringify({
                date: request.date,
                channels: schedule,
                meta: {
                    totalChannels: schedule.length,
                    totalPrograms: programs.length,
                    generatedAt: new Date().toISOString(),
                },
            });
            // 6. Guardar en Storage
            const filePath = `schedules/${request.date}.json`;
            await this.storageRepository.upload(filePath, jsonContent, {
                contentType: 'application/json',
                metadata: {
                    date: request.date,
                    generatedAt: new Date().toISOString(),
                },
            });
            // 7. Generar URL firmada
            const signedUrl = await this.storageRepository.getSignedUrl(filePath, 360); // 6 horas
            const fileSize = Buffer.byteLength(jsonContent);
            this.precomputeLogger.info('Schedule precomputed successfully', {
                date: request.date,
                filePath,
                fileSize,
            });
            return {
                success: true,
                filePath,
                signedUrl,
                fileSize,
            };
        }
        catch (error) {
            this.precomputeLogger.error('Failed to precompute schedule', error);
            throw error;
        }
    }
}
exports.PrecomputeSchedule = PrecomputeSchedule;
//# sourceMappingURL=PrecomputeSchedule.js.map