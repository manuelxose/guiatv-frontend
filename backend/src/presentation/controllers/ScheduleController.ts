// src/v2/presentation/controllers/ScheduleController.ts

import { Request, Response } from 'express';
import { GetPrograms } from '../../application/use-cases/GetPrograms';
import { GetAllChannels } from '../../application/use-cases/GetAllChannels';
import { ChannelMapper } from '../../application/mappers/ChannelMapper';
import { ValidationError } from '../../shared/errors';
import { logger } from '../../shared/utils/logger';
import { DateUtils } from '../../shared/utils/dateUtils';
import { successResponse } from '../../shared/types/ApiResponse';

export class ScheduleController {
  private readonly logger = logger.child('ScheduleController');

  constructor(
    private readonly getPrograms: GetPrograms,
    private readonly getAllChannels: GetAllChannels
  ) {}

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
    const programsResponse = await this.getPrograms.execute({
      date: normalizedDate,
      limit: 10000,
      fields: 'full',
    });
    const programs = programsResponse.programs;

    // Agrupar por canal
    const programsByChannel = new Map<string, typeof programs>();
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
          channel: channel ? ChannelMapper.toDTO(channel) : null,
          programs: channelPrograms,
        };
      })
      .filter((cs) => cs.channel !== null);

    res.status(200).json(
      successResponse(
        {
          date: normalizedDate,
          channels: channelSchedules,
        },
        {
          totalChannels: channelSchedules.length,
          totalPrograms: programs.length,
        }
      )
    );
  }

  /**
   * @openapi
   * /v2/schedules/{date}/channels:
   *   get:
   *     tags:
   *       - Schedules
   *     summary: Obtener resumen de canales por fecha
   */
  async getChannelsSummary(req: Request, res: Response): Promise<void> {
    const { date } = req.params;

    this.logger.info('Getting channels summary for date', { date });

    let normalizedDate: string;
    try {
      normalizedDate = DateUtils.parseDateAlias(date);
    } catch (error) {
      throw new ValidationError('Invalid date format or alias');
    }

    const { programs } = await this.getPrograms.execute({
      date: normalizedDate,
      limit: 10000,
      fields: 'minimal',
    });

    const programsByChannel = new Map<string, typeof programs>();
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
          channel: channel ? ChannelMapper.toDTO(channel) : null,
          programCount: channelPrograms.length,
          firstProgram: channelPrograms[0]?.start,
          lastProgram: channelPrograms[channelPrograms.length - 1]?.end,
        };
      })
      .filter((s) => s.channel !== null);

    res.status(200).json(
      successResponse(
        {
          date: normalizedDate,
          channels: summary,
        },
        {
          totalChannels: summary.length,
        }
      )
    );
  }
}
