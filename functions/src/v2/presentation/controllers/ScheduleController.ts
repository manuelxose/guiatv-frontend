// src/v2/presentation/controllers/ScheduleController.ts

import { Request, Response } from 'express';
import { GetProgramsByDate } from '../../application/use-cases/GetProgramsByDate';
import { GetAllChannels } from '../../application/use-cases/GetAllChannels';
import { ProgramMapper } from '../../application/mappers/ProgramMapper';
import { ChannelMapper } from '../../application/mappers/ChannelMapper';
import { ProgramService } from '../../domain/services/ProgramService';
import { ValidationError } from '../../shared/errors';
import { logger } from '../../shared/utils/logger';
import { DateUtils } from '../../shared/utils/dateUtils';

export class ScheduleController {
  private readonly logger = logger.child('ScheduleController');

  constructor(
    private readonly getProgramsByDate: GetProgramsByDate,
    private readonly getAllChannels: GetAllChannels,
    private readonly programService: ProgramService
  ) {}

  async getByDate(req: Request, res: Response): Promise<void> {
    const { date } = req.params;

    this.logger.info('Getting schedule by date', { date });

    let normalizedDate: string;
    try {
      normalizedDate = DateUtils.parseDateAlias(date);
    } catch (error) {
      throw new ValidationError('Invalid date format or alias');
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
          channel: channel ? ChannelMapper.toDTO(channel) : null,
          programs: ProgramMapper.toDTOList(channelPrograms),
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

  async getChannelsSummary(req: Request, res: Response): Promise<void> {
    const { date } = req.params;

    this.logger.info('Getting channels summary for date', { date });

    let normalizedDate: string;
    try {
      normalizedDate = DateUtils.parseDateAlias(date);
    } catch (error) {
      throw new ValidationError('Invalid date format or alias');
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
          channel: channel ? ChannelMapper.toDTO(channel) : null,
          programCount: channelPrograms.length,
          firstProgram: channelPrograms[0]?.startTime.toISOString(),
          lastProgram:
            channelPrograms[channelPrograms.length - 1]?.endTime.toISOString(),
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
