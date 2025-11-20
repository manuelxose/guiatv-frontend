"use strict";
// src/v2/presentation/controllers/ChannelController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelController = void 0;
const ChannelMapper_1 = require("../../application/mappers/ChannelMapper");
const errors_1 = require("../../shared/errors");
const logger_1 = require("../../shared/utils/logger");
class ChannelController {
    constructor(getAllChannels, getChannelById) {
        this.getAllChannels = getAllChannels;
        this.getChannelById = getChannelById;
        /**
         * @openapi
         * /v2/channels:
         *   get:
         *     tags:
         *       - Channels
         *     summary: Obtener lista de canales
         *     description: Retorna todos los canales con filtros opcionales
         *     parameters:
         *       - name: type
         *         in: query
         *         description: Filtrar por tipo de canal
         *         schema:
         *           type: string
         *           enum: [TDT, Cable, Movistar, Autonomico]
         *       - name: region
         *         in: query
         *         description: Filtrar por región (solo canales autonómicos)
         *         schema:
         *           type: string
         *       - name: isActive
         *         in: query
         *         description: Filtrar por estado activo
         *         schema:
         *           type: boolean
         *     responses:
         *       200:
         *         description: Lista de canales
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 channels:
         *                   type: array
         *                   items:
         *                     $ref: '#/components/schemas/Channel'
         *                 meta:
         *                   type: object
         *                   properties:
         *                     total:
         *                       type: integer
         *       400:
         *         $ref: '#/components/responses/BadRequest'
         *       429:
         *         $ref: '#/components/responses/TooManyRequests'
         *       500:
         *         $ref: '#/components/responses/InternalServerError'
         */
        this.logger = logger_1.logger.child('ChannelController');
    }
    async getAll(req, res) {
        const { type, region, isActive } = req.query;
        this.logger.info('Getting all channels', { type, region, isActive });
        const channels = await this.getAllChannels.execute({
            type: type,
            region: region,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        });
        const dto = ChannelMapper_1.ChannelMapper.toDTOList(channels);
        res.status(200).json({
            channels: dto,
            meta: {
                total: dto.length,
            },
        });
    }
    /**
     * @openapi
     * /v2/channels/{id}:
     *   get:
     *     tags:
     *       - Channels
     *     summary: Obtener canal por ID
     *     description: Retorna los detalles de un canal específico
     *     parameters:
     *       - $ref: '#/components/parameters/ChannelIdParam'
     *     responses:
     *       200:
     *         description: Detalles del canal
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 channel:
     *                   $ref: '#/components/schemas/Channel'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       429:
     *         $ref: '#/components/responses/TooManyRequests'
     */
    async getById(req, res) {
        const { id } = req.params;
        this.logger.info('Getting channel by id', { id });
        const channel = await this.getChannelById.execute(id);
        if (!channel) {
            throw new errors_1.NotFoundError('Channel', id);
        }
        res.status(200).json({
            channel: ChannelMapper_1.ChannelMapper.toDTO(channel),
        });
    }
}
exports.ChannelController = ChannelController;
//# sourceMappingURL=ChannelController.js.map