// src/v2/application/use-cases/PrecomputeSchedule.ts

import { GetProgramsByDate } from './GetProgramsByDate';
import { GetAllChannels } from './GetAllChannels';
import { ProgramService } from '../../domain/services/ProgramService';
import { ProgramMapper } from '../mappers/ProgramMapper';
import { ChannelMapper } from '../mappers/ChannelMapper';
import { logger } from '../../shared/utils/logger';
import { IStorageRepository } from '@v2/domain/repositories/IStorageRepository';

export interface PrecomputeScheduleRequest {
  date: string; // YYYYMMDD
}

export interface PrecomputeScheduleResult {
  success: boolean;
  filePath: string;
  signedUrl?: string;
  fileSize: number;
}

export class PrecomputeSchedule {
  private readonly precomputeLogger = logger.child('PrecomputeSchedule');

  constructor(
    private readonly getProgramsByDate: GetProgramsByDate,
    private readonly getAllChannels: GetAllChannels,
    private readonly programService: ProgramService,
    private readonly storageRepository: IStorageRepository // ✅ Interfaz
  ) {}

  async execute(
    request: PrecomputeScheduleRequest
  ): Promise<PrecomputeScheduleResult> {
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
            channel: channel ? ChannelMapper.toDTO(channel) : null,
            programs: ProgramMapper.toDTOList(channelPrograms),
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
      const signedUrl = await this.storageRepository.getSignedUrl(
        filePath,
        360
      ); // 6 horas

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
    } catch (error) {
      this.precomputeLogger.error(
        'Failed to precompute schedule',
        error as Error
      );
      throw error;
    }
  }
}
