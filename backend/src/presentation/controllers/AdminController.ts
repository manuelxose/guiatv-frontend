// src/v2/presentation/controllers/AdminController.ts

import { Request, Response } from 'express';
import { SyncEPGData } from '../../application/use-cases/SyncEPGData';
import { PrecomputeSchedule } from '../../application/use-cases/PrecomputeSchedule';
import { CleanOldPrograms } from '../../application/use-cases/CleanOldPrograms';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { DateUtils } from '../../shared/utils/dateUtils';
import { logger } from '../../shared/utils/logger';
import { ValidationError } from '../../shared/errors';
import { successResponse } from '../../shared/types/ApiResponse';
import { ResetSystem } from '../../application/use-cases/ResetSystem';

export class AdminController {
  private readonly adminLogger = logger.child('AdminController');

  constructor(
    private readonly syncEPGData: SyncEPGData,
    private readonly precomputeSchedule: PrecomputeSchedule,
    private readonly cleanOldPrograms: CleanOldPrograms,
    private readonly cacheRepository: ICacheRepository,
    private readonly resetSystem: ResetSystem
  ) {}

  /**
   * @openapi
   * /v2/admin/sync:
   *   post:
   *     tags:
   *       - Admin
   *     summary: Sincronizar EPG manualmente
   *     description: Descarga y procesa el archivo XMLTV
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               date:
   *                 type: string
   *                 description: Fecha a sincronizar (YYYYMMDD)
   *               forceRefresh:
   *                 type: boolean
   *                 description: Forzar descarga aunque exista cache
   *     responses:
   *       200:
   *         description: Sincronización completada
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async triggerSync(req: Request, res: Response): Promise<void> {
    const { date, forceRefresh, sourceUrl } = req.body;

    this.adminLogger.info('Manual sync triggered', {
      date,
      forceRefresh,
      sourceUrl,
    });

    const dateToSync = DateUtils.parseDateAlias(date || 'today');

    const result = await this.syncEPGData.execute({
      sourceUrl:
        sourceUrl ||
        'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guiatv_sincolor.xml.gz',
      date: dateToSync,
      forceRefresh: forceRefresh === true,
    });

    res.status(200).json(
      successResponse(
        {
          message: result.success
            ? 'Sync completed successfully'
            : 'Sync completed with errors',
          result,
        },
        { cached: false }
      )
    );
  }

  /**
   * @openapi
   * /v2/admin/precompute:
   *   post:
   *     tags:
   *       - Admin
   *     summary: Precomputar horarios
   *     description: Genera y guarda los JSONs estáticos para la fecha indicada
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               date:
   *                 type: string
   *                 description: Fecha a procesar (YYYYMMDD)
   *     responses:
   *       200:
   *         description: Precomputación completada
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async triggerPrecompute(req: Request, res: Response): Promise<void> {
    const { date, fields } = req.body;

    this.adminLogger.info('Manual precompute triggered', { date, fields });

    const dateToPrecompute = DateUtils.parseDateAlias(date || 'today');

    const result = await this.precomputeSchedule.execute({
      date: dateToPrecompute,
      fields: (fields as any) || 'full',
    });

    res.status(200).json(
      successResponse(
        {
          message: 'Precompute completed successfully',
          result,
        },
        { cached: false }
      )
    );
  }

  /**
   * @openapi
   * /v2/admin/precompute-window:
   *   post:
   *     tags:
   *       - Admin
   *     summary: Precomputar el rango ayer/hoy/mañana/pasado
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fields:
   *                 type: string
   *                 enum: [minimal, full]
   *                 default: full
   *     responses:
   *       200:
   *         description: Precomputación completada
   */
  async triggerPrecomputeWindow(req: Request, res: Response): Promise<void> {
    const { fields } = req.body || {};
    this.adminLogger.info('Triggering precompute for canonical window', {
      fields: fields || 'full',
    });
    await this.precomputeSchedule.precomputeCanonicalWindow(
      (fields as any) || 'full'
    );

    res
      .status(200)
      .json(successResponse({ message: 'Window precompute completed' }));
  }

  /**
   * @openapi
   * /v2/admin/cleanup:
   *   post:
   *     tags:
   *       - Admin
   *     summary: Limpiar programas antiguos
   *     description: Elimina programas anteriores a la fecha configurada
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               daysToKeep:
   *                 type: integer
   *                 description: Días de historial a mantener
   *                 default: 7
   *     responses:
   *       200:
   *         description: Limpieza completada
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async triggerCleanup(req: Request, res: Response): Promise<void> {
    const { daysToKeep } = req.body;

    this.adminLogger.info('Manual cleanup triggered', { daysToKeep });

    if (daysToKeep && (typeof daysToKeep !== 'number' || daysToKeep < 1)) {
      throw new ValidationError('Invalid daysToKeep parameter', [
        {
          field: 'daysToKeep',
          message: 'Must be a positive number',
          value: daysToKeep,
        },
      ]);
    }

    const result = await this.cleanOldPrograms.execute({
      daysToKeep: daysToKeep || 7,
    });

    res.status(200).json(
      successResponse(
        {
          message: result.success
            ? 'Cleanup completed successfully'
            : 'Cleanup completed with errors',
          result,
        },
        { cached: false }
      )
    );
  }

  /**
   * @openapi
   * /v2/admin/cache/clear:
   *   post:
   *     tags:
   *       - Admin
   *     summary: Limpiar caché
   *     description: Invalida entradas de caché que coincidan con el patrón
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               pattern:
   *                 type: string
   *                 description: Patrón de claves a eliminar (ej. "program:*")
   *     responses:
   *       200:
   *         description: Caché limpiada
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async clearCache(req: Request, res: Response): Promise<void> {
    const { pattern } = req.body;

    this.adminLogger.info('Cache clear triggered', { pattern });

    await this.cacheRepository.clear(pattern);

    res.status(200).json(
      successResponse(
        {
          message: 'Cache cleared successfully',
          pattern: pattern || 'all',
        },
        { cached: false }
      )
    );
  }

  /**
   * POST /v2/admin/reset
   * Borra cache, colecciones, ficheros EPG/schedules y reconstruye (sync + precompute window)
   */
  async triggerReset(req: Request, res: Response): Promise<void> {
    const { sourceUrl, fields, async = false } = req.body || {};
    this.adminLogger.warn('Full reset triggered', { sourceUrl, fields, async });

    // Deshabilitar timeout de respuesta mientras se ejecuta el reset
    res.setTimeout(0);

    if (async) {
      // Ejecutar en background y responder rápido
      void this.resetSystem
        .execute({
          sourceUrl: sourceUrl as string | undefined,
          fields: (fields as any) || 'full',
        })
        .then((result) => {
          this.adminLogger.info('Async reset completed', { result });
        })
        .catch((error) => {
          this.adminLogger.error('Async reset failed', error as Error);
        });

      res.status(202).json(
        successResponse(
          {
            message: 'Reset started asynchronously',
          },
          { cached: false }
        )
      );
      return;
    }

    try {
      const result = await this.resetSystem.execute({
        sourceUrl: sourceUrl as string | undefined,
        fields: (fields as any) || 'full',
      });

      res.status(200).json(
        successResponse(
          {
            message: 'Reset completed successfully',
            result,
          },
          { cached: false }
        )
      );
    } catch (error) {
      this.adminLogger.error('Reset failed', error as Error);
      res.status(500).json(
        successResponse(
          {
            message: 'Reset failed',
            error: (error as Error).message,
          },
          { cached: false }
        )
      );
    }
  }

  /**
   * @openapi
   * /v2/admin/health:
   *   get:
   *     tags:
   *       - Admin
   *     summary: Health check administrativo
   *     description: Verifica estado de servicios internos (DB, Cache, etc)
   *     responses:
   *       200:
   *         description: Sistema saludable
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: healthy
   *                 services:
   *                   type: object
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Verificar conectividad de servicios
    const services = {
      cache: await this.checkCacheHealth(),
    };

    res.status(200).json(
      successResponse(
        {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: `${Math.floor(uptime)}s`,
          version: process.env.API_VERSION || '2.0.0',
          memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          },
          services,
        },
        { cached: false }
      )
    );
  }

  private async checkCacheHealth(): Promise<{ status: string; details?: any }> {
    try {
      await this.cacheRepository.set('health_check', { test: true }, 10);
      const value = await this.cacheRepository.get<{ test: boolean }>(
        'health_check'
      );
      await this.cacheRepository.delete('health_check');

      return {
        status: value && value.test ? 'healthy' : 'degraded',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: (error as Error).message,
      };
    }
  }
}

