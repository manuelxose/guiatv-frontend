import { Request, Response } from 'express';
import { GetNowPlaying } from '@/application/use-cases/GetNowPlaying';
import { ChannelMapper } from '@/application/mappers/ChannelMapper';
import { ProgramMapper } from '@/application/mappers/ProgramMapper';
import { logger } from '@/shared/utils/logger';

/**
 * Controller for server-side rendered widgets (fast, cacheable responses).
 */
export class SSRController {
  private readonly log = logger.child('SSRController');

  constructor(private readonly getNowPlaying: GetNowPlaying) {}

  /**
   * @openapi
   * /v2/ssr/now-playing:
   *   get:
   *     tags:
   *       - SSR
   *     summary: Obtener parrilla actual (SSR)
   *     description: Endpoint optimizado para SSR/Home. Retorna todos los canales con su programa actual.
   *     parameters:
   *       - name: at
   *         in: query
   *         description: Fecha/hora de referencia (ISO 8601). Por defecto es ahora.
   *         schema:
   *           type: string
   *           format: date-time
   *     responses:
   *       200:
   *         description: Parrilla actual
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 generatedAt:
   *                   type: string
   *                   format: date-time
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       channel:
   *                         $ref: '#/components/schemas/Channel'
   *                       program:
   *                         $ref: '#/components/schemas/Program'
   *                         nullable: true
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  /**
   * Returns the now-playing snapshot for SSR contexts.
   */
  async nowPlaying(req: Request, res: Response): Promise<void> {
    const atParam = (req.query.at as string | undefined) ?? undefined;
    const at = atParam ? new Date(atParam) : new Date();

    this.log.info('Fetching SSR now-playing snapshot', { at: at.toISOString() });

    const results = await this.getNowPlaying.execute(at);

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      data: results.map(({ channel, program }) => ({
        channel: ChannelMapper.toDTO(channel),
        program: program ? ProgramMapper.toDTO(program) : null,
      })),
    });
  }
}
