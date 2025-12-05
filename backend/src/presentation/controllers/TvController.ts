import { Request, Response } from 'express';
import { GetNowPlaying } from '@/application/use-cases/GetNowPlaying';
import { GetPrograms } from '@/application/use-cases/GetPrograms';
import { successResponse } from '@/shared/types/ApiResponse';
import { MediaMapper } from '@/application/mappers/MediaMapper';

/**
 * Controller for lightweight TV endpoints (now playing and schedule).
 */
export class TvController {
  constructor(
    private readonly getNowPlaying: GetNowPlaying,
    private readonly getPrograms: GetPrograms
  ) {}

  /**
   * Returns a list of programs currently airing.
   */
  async now(req: Request, res: Response): Promise<void> {
    const atParam = (req.query.at as string | undefined) ?? undefined;
    const at = atParam ? new Date(atParam) : new Date();
    const results = await this.getNowPlaying.execute(at);

    const items = results
      .filter(({ program }) => !!program)
      .map(({ program, channel }) =>
        MediaMapper.fromProgram(program!, channel, { now: at })
      );

    res.status(200).json(
      successResponse(
        { items },
        {
          timestamp: at.toISOString(),
        }
      )
    );
  }

  /**
   * Retrieves the schedule with optional filters for channels and time slots.
   */
  async schedule(req: Request, res: Response): Promise<void> {
    const {
      date,
      channel,
      channels,
      time_window,
      timeSlot,
      fields,
      limit,
      country,
      channelTypes,
    } = req.query;

    const channelIds =
      channel && typeof channel === 'string'
        ? [channel]
        : channels
          ? String(channels)
              .split(',')
              .map((id) => id.trim())
              .filter(Boolean)
          : undefined;

    const result = await this.getPrograms.execute({
      date: (date as string) || 'today',
      channels: channelIds,
      timeSlot: (time_window as string) || (timeSlot as string),
      fields: (fields as any) || 'full',
      limit: limit ? parseInt(limit as string, 10) : undefined,
      country: country as string,
      channelTypes: channelTypes
        ? String(channelTypes)
            .split(',')
            .map((t) => t.trim())
        : undefined,
    });

    res.status(200).json(
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
}
