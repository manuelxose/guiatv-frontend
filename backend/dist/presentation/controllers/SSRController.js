"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSRController = void 0;
const ChannelMapper_1 = require("../../application/mappers/ChannelMapper");
const ProgramMapper_1 = require("../../application/mappers/ProgramMapper");
const logger_1 = require("../../shared/utils/logger");
class SSRController {
    constructor(getNowPlaying) {
        this.getNowPlaying = getNowPlaying;
        this.log = logger_1.logger.child('SSRController');
    }
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
    async nowPlaying(req, res) {
        const atParam = req.query.at ?? undefined;
        const at = atParam ? new Date(atParam) : new Date();
        this.log.info('Fetching SSR now-playing snapshot', { at: at.toISOString() });
        const results = await this.getNowPlaying.execute(at);
        res.status(200).json({
            generatedAt: new Date().toISOString(),
            data: results.map(({ channel, program }) => ({
                channel: ChannelMapper_1.ChannelMapper.toDTO(channel),
                program: program ? ProgramMapper_1.ProgramMapper.toDTO(program) : null,
            })),
        });
    }
}
exports.SSRController = SSRController;
//# sourceMappingURL=SSRController.js.map