import { Request, Response } from 'express';
import { GetPrograms, GetProgramsRequest } from '../../application/use-cases/GetPrograms';
import { ChannelMapper } from '../../application/mappers/ChannelMapper';
import { GetChannelById } from '../../application/use-cases/GetChannelById';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { successResponse } from '../../shared/types/ApiResponse';
import { GetProgramById } from '../../application/use-cases/GetProgramById';

/**
 * Controller that delegates program-related HTTP requests to use cases.
 */
export class ProgramController {

  constructor(
    private readonly getPrograms: GetPrograms,
    private readonly getChannelById: GetChannelById,
    private readonly getProgramById: GetProgramById
  ) {}

  /**
   * GET /v2/programs
   *
   * Handles queries for the unified programs endpoint.
   */
  async getProgramsHandler(req: Request, res: Response): Promise<void> {
    const { date, channels, timeSlot, fields, page, limit, country, channelTypes } = req.query;

    if (!date || typeof date !== 'string') {
      throw new ValidationError('Date is required');
    }

    const request: GetProgramsRequest = {
      date,
      channels: channels
        ? (channels as string).split(',').map((id) => id.trim())
        : undefined,
      timeSlot: timeSlot as string,
      fields: fields as any,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      country: country as string,
      channelTypes: channelTypes
        ? String(channelTypes)
            .split(',')
            .map((id) => id.trim())
        : undefined,
    };

    const result = await this.getPrograms.execute(request);

    res
      .status(200)
      .json(
        successResponse(
          {
            date: result.date,
            timeSlots: result.timeSlots,
            channels: result.channels,
            programs: result.programs,
          },
          result.meta
        )
      );
  }

  /**
   * GET /v2/channels/:id/programs
   *
   * Returns programs for a single channel combining channel metadata and layout.
   */
  async getByChannel(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { date, timeSlot, fields, page, limit, country, channelTypes } = req.query;

    const channel = await this.getChannelById.execute(id);
    if (!channel) {
      throw new NotFoundError('Channel', id);
    }

    const request: GetProgramsRequest = {
      date: (date as string) || 'today',
      channels: [id],
      timeSlot: timeSlot as string,
      fields: fields as any,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      country: country as string,
      channelTypes: channelTypes
        ? String(channelTypes)
            .split(',')
            .map((id) => id.trim())
        : undefined,
    };

    const result = await this.getPrograms.execute(request);

    res.status(200).json(
      successResponse(
        {
          channel: ChannelMapper.toDTO(channel),
          date: result.date,
          programs: result.programs,
        },
        {
          ...result.meta,
          totalChannels: 1,
        }
      )
    );
  }

  /**
   * GET /v2/programs/:id
   *
   * Fetches program detail by identifier.
   */
  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await this.getProgramById.execute(id);

    res.status(200).json(
      successResponse({
        program: result.program,
      })
    );
  }
}
