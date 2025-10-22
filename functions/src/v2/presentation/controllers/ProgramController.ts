// src/v2/presentation/controllers/ProgramController.ts

import { Request, Response } from 'express';
import { GetProgramsByDate } from '../../application/use-cases/GetProgramsByDate';
import { GetChannelPrograms } from '../../application/use-cases/GetChannelPrograms';
import { ProgramMapper } from '../../application/mappers/ProgramMapper';
import { ChannelMapper } from '../../application/mappers/ChannelMapper';
import { GetChannelById } from '../../application/use-cases/GetChannelById';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/utils/logger';
import { DateUtils } from '../../shared/utils/dateUtils';

export class ProgramController {
  private readonly logger = logger.child('ProgramController');

  constructor(
    private readonly getProgramsByDate: GetProgramsByDate,
    private readonly getChannelPrograms: GetChannelPrograms,
    private readonly getChannelById: GetChannelById
  ) {}

  async getByDate(req: Request, res: Response): Promise<void> {
    const { date } = req.params;
    const { channelId, genre, limit, offset } = req.query;

    this.logger.info('Getting programs by date', { date, channelId, genre });

    let normalizedDate: string;
    try {
      normalizedDate = DateUtils.parseDateAlias(date);
    } catch (error) {
      throw new ValidationError('Invalid date format or alias', [
        {
          field: 'date',
          message:
            'Expected YYYYMMDD format or alias (today, tomorrow, after_tomorrow)',
          value: date,
        },
      ]);
    }

    const programs = await this.getProgramsByDate.execute({
      date: normalizedDate,
      channelId: channelId as string,
      genre: genre as string,
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    const dto = ProgramMapper.toDTOList(programs);

    res.status(200).json({
      programs: dto,
      meta: {
        total: dto.length,
        date: normalizedDate,
      },
    });
  }

  async getByChannel(req: Request, res: Response): Promise<void> {
    const { channelId } = req.params;
    const { date, fromTime, toTime } = req.query;

    this.logger.info('Getting programs by channel', { channelId, date });

    // Validar que el canal existe
    const channel = await this.getChannelById.execute(channelId);
    if (!channel) {
      throw new NotFoundError('Channel', channelId);
    }

    let normalizedDate: string;
    try {
      normalizedDate = DateUtils.parseDateAlias((date as string) || 'today');
    } catch (error) {
      throw new ValidationError('Invalid date format or alias');
    }

    const programs = await this.getChannelPrograms.execute({
      channelId,
      date: normalizedDate,
      fromTime: fromTime as string,
      toTime: toTime as string,
    });

    res.status(200).json({
      channel: ChannelMapper.toDTO(channel),
      programs: ProgramMapper.toDTOList(programs),
      meta: {
        total: programs.length,
        date: normalizedDate,
      },
    });
  }
}
