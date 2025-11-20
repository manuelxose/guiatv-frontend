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
   *     responses:
   *       200:
   *         description: Programación completa del día
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Schedule'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
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

  /**
   * @openapi
   * /v2/schedules/{date}/channels:
   *   get:
   *     tags:
   *       - Schedules
   *     summary: Obtener resumen de canales por fecha
   *     description: Retorna un resumen de la actividad de los canales para una fecha (número de programas, horario)
   *     parameters:
   *       - $ref: '#/components/parameters/DateParam'
   *     responses:
   *       200:
   *         description: Resumen de canales
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 date:
   *                   type: string
   *                 channels:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       channel:
   *                         $ref: '#/components/schemas/Channel'
   *                       programCount:
   *                         type: integer
   *                       firstProgram:
   *                         type: string
   *                         format: date-time
   *                       lastProgram:
   *                         type: string
   *                         format: date-time
   *                 meta:
   *                   type: object
   *                   properties:
   *                     totalChannels:
   *                       type: integer
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
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
