// src/v2/presentation/swagger/swagger.config.ts

import swaggerJsdoc from 'swagger-jsdoc';
import { appConfig } from '../../config/app.config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Guía TV API',
    version: appConfig.apiVersion,
    description:
      'API REST para consulta de programación de televisión en España',
    contact: {
      name: 'API Support',
      email: 'support@guiatv.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://us-central1-guia-tv-8fe3c.cloudfunctions.net/apiv2',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Channels',
      description: 'Operaciones relacionadas con canales de TV',
    },
    {
      name: 'Programs',
      description: 'Operaciones relacionadas con programas',
    },
    {
      name: 'Schedules',
      description: 'Programación completa por día',
    },
    {
      name: 'Admin',
      description: 'Endpoints administrativos (requiere autenticación)',
    },
    {
      name: 'Health',
      description: 'Health checks y status del sistema',
    },
  ],
  components: {
    schemas: {
      Channel: {
        type: 'object',
        required: ['id', 'name', 'type', 'isActive'],
        properties: {
          id: {
            type: 'string',
            description: 'Identificador único del canal',
            example: 'la_1',
          },
          name: {
            type: 'string',
            description: 'Nombre del canal',
            example: 'La 1',
          },
          normalizedName: {
            type: 'string',
            description: 'Nombre normalizado para URLs',
            example: 'la-1',
          },
          icon: {
            type: 'string',
            nullable: true,
            description: 'URL del icono del canal',
            example: 'https://storage.googleapis.com/guia-tv/icons/la1.png',
          },
          type: {
            type: 'string',
            enum: ['TDT', 'Cable', 'Movistar', 'Autonomico'],
            description: 'Tipo de canal',
            example: 'TDT',
          },
          region: {
            type: 'string',
            description: 'Región (solo para canales autonómicos)',
            example: 'Cataluña',
          },
          isActive: {
            type: 'boolean',
            description: 'Si el canal está activo',
            example: true,
          },
        },
      },
      Program: {
        type: 'object',
        required: [
          'id',
          'channelId',
          'title',
          'startTime',
          'endTime',
          'duration',
          'date',
        ],
        properties: {
          id: {
            type: 'string',
            description: 'Identificador único del programa',
            example: 'la_1_20251021080000_telediario',
          },
          channelId: {
            type: 'string',
            description: 'ID del canal',
            example: 'la_1',
          },
          title: {
            type: 'string',
            description: 'Título del programa',
            example: 'Telediario matinal',
          },
          startTime: {
            type: 'string',
            format: 'date-time',
            description: 'Hora de inicio (ISO 8601)',
            example: '2025-10-21T08:00:00.000Z',
          },
          endTime: {
            type: 'string',
            format: 'date-time',
            description: 'Hora de fin (ISO 8601)',
            example: '2025-10-21T09:00:00.000Z',
          },
          duration: {
            type: 'integer',
            description: 'Duración en minutos',
            example: 60,
          },
          date: {
            type: 'string',
            pattern: '^[0-9]{8}$',
            description: 'Fecha del programa (YYYYMMDD)',
            example: '20251021',
          },
          description: {
            type: 'string',
            description: 'Descripción del programa (máx 500 caracteres)',
            example: 'Programa informativo con las últimas noticias',
          },
          image: {
            type: 'string',
            description: 'URL de la imagen del programa',
            example:
              'https://storage.googleapis.com/guia-tv/programs/telediario.jpg',
          },
          genre: {
            type: 'string',
            description: 'Género del programa',
            example: 'Informativo',
          },
          subgenre: {
            type: 'string',
            description: 'Subgénero',
            example: 'Noticias',
          },
          year: {
            type: 'string',
            description: 'Año de producción',
            example: '2025',
          },
          rating: {
            type: 'string',
            description: 'Valoración',
            example: '7.5/10',
          },
        },
      },
      ChannelSchedule: {
        type: 'object',
        properties: {
          channel: {
            $ref: '#/components/schemas/Channel',
          },
          programs: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Program',
            },
          },
        },
      },
      Schedule: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            pattern: '^[0-9]{8}$',
            example: '20251021',
          },
          channels: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ChannelSchedule',
            },
          },
          meta: {
            type: 'object',
            properties: {
              totalChannels: {
                type: 'integer',
                example: 50,
              },
              totalPrograms: {
                type: 'integer',
                example: 1200,
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'ValidationError',
              },
              message: {
                type: 'string',
                example: 'Invalid date format',
              },
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              statusCode: {
                type: 'integer',
                example: 400,
              },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: {
                      type: 'string',
                      example: 'date',
                    },
                    message: {
                      type: 'string',
                      example: 'Expected YYYYMMDD format',
                    },
                    value: {
                      type: 'string',
                      example: 'invalid',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Petición inválida',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      TooManyRequests: {
        description: 'Demasiadas peticiones',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      InternalServerError: {
        description: 'Error interno del servidor',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
    parameters: {
      DateParam: {
        name: 'date',
        in: 'path',
        required: true,
        description:
          'Fecha en formato YYYYMMDD o alias (today, tomorrow, after_tomorrow)',
        schema: {
          type: 'string',
          example: 'today',
        },
      },
      ChannelIdParam: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Identificador del canal',
        schema: {
          type: 'string',
          example: 'la_1',
        },
      },
      LimitQuery: {
        name: 'limit',
        in: 'query',
        description: 'Número máximo de resultados (1-1000)',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
          default: 100,
        },
      },
      OffsetQuery: {
        name: 'offset',
        in: 'query',
        description: 'Número de resultados a saltar',
        schema: {
          type: 'integer',
          minimum: 0,
          default: 0,
        },
      },
    },
  },
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: [
    './src/v2/presentation/routes/*.ts',
    './src/v2/presentation/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
