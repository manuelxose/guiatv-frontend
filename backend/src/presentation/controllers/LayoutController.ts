import { Request, Response } from 'express';
import { GetProgramLayouts } from '../../application/use-cases/GetProgramLayouts';
import { successResponse } from '../../shared/types/ApiResponse';
import { ValidationError } from '../../shared/errors';

/**
 * Controller responsible for returning layout information for the TV grid.
 */
export class LayoutController {
  constructor(private readonly getProgramLayouts: GetProgramLayouts) {}

  /**
   * GET /v2/layouts/:date
   * Query: channels (csv), timeSlot, fields
   *
   * Returns channel lineup layouts for a specific date.
   */
  async getByDate(req: Request, res: Response): Promise<void> {
    const { date } = req.params;
    const { channels, timeSlot, fields } = req.query;

    if (!date) {
      throw new ValidationError('date is required');
    }

    const channelList = channels
      ? String(channels)
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : undefined;

    const result = await this.getProgramLayouts.execute({
      date,
      channels: channelList,
      timeSlot: timeSlot as string,
      fields: fields as any,
    });

    res
      .status(200)
      .json(
        successResponse(
          {
            date: result.date,
            timeSlots: result.timeSlots,
            channels: result.channels,
          },
          result.meta
        )
      );
  }
}
