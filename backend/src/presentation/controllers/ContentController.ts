import { Request, Response } from 'express';
import { GetContentDetail } from '@/application/use-cases/GetContentDetail';
import { GetContentBatch } from '@/application/use-cases/GetContentBatch';
import { successResponse } from '@/shared/types/ApiResponse';
import { ValidationError } from '@/shared/errors';

/**
 * Controller that returns media content cards and batches.
 */
export class ContentController {
  constructor(
    private readonly getContentDetail: GetContentDetail,
    private readonly getContentBatch: GetContentBatch
  ) {}

  /**
   * Returns detailed content information by id.
   */
  async getContent(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { expand } = req.query;

    const expandList = expand
      ? String(expand)
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    const result = await this.getContentDetail.execute({
      id,
      expand: expandList,
    });

    res.status(200).json(successResponse(result.item));
  }

  /**
   * Retrieves a batch of content items specified by comma-separated IDs.
   */
  async getBatch(req: Request, res: Response): Promise<void> {
    const idsParam = req.query.ids as string | undefined;
    if (!idsParam) {
      throw new ValidationError('ids parameter is required (comma separated)');
    }

    const ids = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const result = await this.getContentBatch.execute({ ids });

    res.status(200).json(successResponse(result));
  }
}
