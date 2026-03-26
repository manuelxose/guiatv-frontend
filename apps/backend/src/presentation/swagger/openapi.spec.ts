import { appConfig } from '../../config/app.config';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Guia TV Backend API',
    version: appConfig.apiVersion,
    description:
      'Canonical backend API for TV guide, discovery, content detail, and streaming catalog surfaces.',
  },
  servers: [
    {
      url: 'http://localhost:4000/v2',
      description: 'Local development',
    },
    {
      url: 'https://guiaprogramaciontv.com/v2',
      description: 'Production',
    },
  ],
  tags: [
    { name: 'Health', description: 'Operational health endpoints.' },
    { name: 'TV', description: 'Canonical TV read-model and guide surfaces.' },
    { name: 'Discovery', description: 'Home, browse, and unified search surfaces.' },
    { name: 'Catalog', description: 'Streaming catalog and platform metadata.' },
    { name: 'Content', description: 'Unified content detail and provider lookups.' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Backend is healthy.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthEnvelope' },
              },
            },
          },
        },
      },
    },
    '/tv/read': {
      get: {
        tags: ['TV'],
        summary: 'Read canonical TV items for day, now, next, night, or search views.',
        parameters: [
          { $ref: '#/components/parameters/TvViewQuery' },
          { $ref: '#/components/parameters/DateQuery' },
          { $ref: '#/components/parameters/GroupQuery' },
          { $ref: '#/components/parameters/CategoryQuery' },
          { $ref: '#/components/parameters/ChannelIdQuery' },
          { $ref: '#/components/parameters/SearchQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          { $ref: '#/components/parameters/CursorQuery' },
        ],
        responses: {
          '200': {
            description: 'Canonical TV read response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TvReadEnvelope' },
              },
            },
          },
        },
      },
    },
    '/tv/read/channels': {
      get: {
        tags: ['TV'],
        summary: 'Read channel summaries for a date and optional group.',
        parameters: [
          { $ref: '#/components/parameters/DateQuery' },
          { $ref: '#/components/parameters/GroupQuery' },
        ],
        responses: {
          '200': {
            description: 'Channel summaries.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TvReadChannelsEnvelope' },
              },
            },
          },
        },
      },
    },
    '/tv/read/channels/{channelId}': {
      get: {
        tags: ['TV'],
        summary: 'Read canonical TV items for one channel.',
        parameters: [
          { $ref: '#/components/parameters/ChannelIdPath' },
          { $ref: '#/components/parameters/DateQuery' },
          { $ref: '#/components/parameters/TvViewQuery' },
        ],
        responses: {
          '200': {
            description: 'Canonical channel schedule.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TvReadEnvelope' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/tv/read/items/{airingId}': {
      get: {
        tags: ['TV'],
        summary: 'Read one canonical TV airing plus related items from the same channel.',
        parameters: [{ $ref: '#/components/parameters/AiringIdPath' }],
        responses: {
          '200': {
            description: 'TV airing detail.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TvReadItemEnvelope' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/tv/surface/guide': {
      get: {
        tags: ['TV'],
        summary: 'Single-call guide surface for the main TV guide page.',
        parameters: [
          { $ref: '#/components/parameters/DateQuery' },
          { $ref: '#/components/parameters/GroupQuery' },
          { $ref: '#/components/parameters/CategoryQuery' },
        ],
        responses: {
          '200': {
            description: 'Guide BFF response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TvGuideSurfaceEnvelope' },
              },
            },
          },
        },
      },
    },
    '/tv/surface/channels/{channelId}': {
      get: {
        tags: ['TV'],
        summary: 'Single-call channel page surface.',
        parameters: [
          { $ref: '#/components/parameters/ChannelIdPath' },
          { $ref: '#/components/parameters/DateQuery' },
        ],
        responses: {
          '200': {
            description: 'Channel page BFF response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TvChannelSurfaceEnvelope' },
              },
            },
          },
        },
      },
    },
    '/discovery/home': {
      get: {
        tags: ['Discovery'],
        summary: 'Home surface with live TV and streaming discovery rails.',
        parameters: [{ $ref: '#/components/parameters/DateQuery' }],
        responses: {
          '200': {
            description: 'Home surface response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DiscoveryHomeEnvelope' },
              },
            },
          },
        },
      },
    },
    '/discovery/browse': {
      get: {
        tags: ['Discovery'],
        summary: 'Browse movies or series in one request.',
        parameters: [
          { $ref: '#/components/parameters/DiscoveryTypeQuery' },
          { $ref: '#/components/parameters/SearchQuery' },
          { $ref: '#/components/parameters/GenreQuery' },
          { $ref: '#/components/parameters/PlatformQuery' },
          { $ref: '#/components/parameters/AvailabilityQuery' },
          { $ref: '#/components/parameters/SortQuery' },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
        ],
        responses: {
          '200': {
            description: 'Browse surface response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DiscoveryBrowseEnvelope' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/discovery/search': {
      get: {
        tags: ['Discovery'],
        summary: 'Unified public search across TV and streaming content.',
        parameters: [
          { $ref: '#/components/parameters/SearchQueryRequired' },
          { $ref: '#/components/parameters/DateQuery' },
          { $ref: '#/components/parameters/GenreQuerySingle' },
          { $ref: '#/components/parameters/PlatformQuerySingle' },
          { $ref: '#/components/parameters/DiscoverySearchTypeQuery' },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
        ],
        responses: {
          '200': {
            description: 'Unified search response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CatalogQueryEnvelope' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/catalog': {
      get: {
        tags: ['Catalog'],
        summary: 'Query the streaming catalog and editorial availability dataset.',
        parameters: [
          { $ref: '#/components/parameters/SearchQuery' },
          { $ref: '#/components/parameters/CatalogTypesQuery' },
          { $ref: '#/components/parameters/GenresQuery' },
          { $ref: '#/components/parameters/PlatformsQuery' },
          { $ref: '#/components/parameters/AvailabilityQuery' },
          { $ref: '#/components/parameters/DateQuery' },
          { $ref: '#/components/parameters/TimeSlotQuery' },
          { $ref: '#/components/parameters/SortQuery' },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
        ],
        responses: {
          '200': {
            description: 'Catalog query response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CatalogQueryEnvelope' },
              },
            },
          },
        },
      },
    },
    '/catalog/platforms': {
      get: {
        tags: ['Catalog'],
        summary: 'Read the canonical platform registry.',
        responses: {
          '200': {
            description: 'Platform registry response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CatalogPlatformsEnvelope' },
              },
            },
          },
        },
      },
    },
    '/catalog/suggest': {
      get: {
        tags: ['Catalog'],
        summary: 'Suggestion endpoint for autocomplete and search overlays.',
        parameters: [
          { $ref: '#/components/parameters/SearchQueryRequired' },
          { $ref: '#/components/parameters/LimitQuery' },
        ],
        responses: {
          '200': {
            description: 'Suggestions response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CatalogSuggestionsEnvelope' },
              },
            },
          },
        },
      },
    },
    '/catalog/slug/{contentType}/{slug}': {
      get: {
        tags: ['Catalog'],
        summary: 'Resolve a content item by SEO slug.',
        parameters: [
          { $ref: '#/components/parameters/ContentTypePath' },
          { $ref: '#/components/parameters/SlugPath' },
        ],
        responses: {
          '200': {
            description: 'Catalog detail response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CatalogDetailEnvelope' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/catalog/{catalogId}': {
      get: {
        tags: ['Catalog'],
        summary: 'Resolve a catalog item by canonical catalog id.',
        parameters: [{ $ref: '#/components/parameters/CatalogIdPath' }],
        responses: {
          '200': {
            description: 'Catalog detail response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CatalogDetailEnvelope' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/content/{id}': {
      get: {
        tags: ['Content'],
        summary: 'Unified detail endpoint for TV airings and streaming catalog items.',
        parameters: [
          { $ref: '#/components/parameters/ContentIdPath' },
          {
            name: 'expand',
            in: 'query',
            required: false,
            schema: { type: 'string', example: 'related,schedule' },
          },
        ],
        responses: {
          '200': {
            description: 'Unified content detail response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CatalogDetailEnvelope' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/content/batch': {
      get: {
        tags: ['Content'],
        summary: 'Read multiple content detail records in one request.',
        parameters: [
          {
            name: 'ids',
            in: 'query',
            required: true,
            schema: { type: 'string', example: 'program:airing-1,tmdb:movie:550' },
          },
        ],
        responses: {
          '200': {
            description: 'Batch content response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ContentBatchEnvelope' },
              },
            },
          },
        },
      },
    },
    '/content/providers/{contentType}/{tmdbId}': {
      get: {
        tags: ['Content'],
        summary: 'Read watch-provider availability directly from the provider integration.',
        parameters: [
          {
            name: 'contentType',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['movie', 'tv'] },
          },
          {
            name: 'tmdbId',
            in: 'path',
            required: true,
            schema: { type: 'integer', example: 550 },
          },
        ],
        responses: {
          '200': {
            description: 'Provider availability response.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        whereToWatch: { $ref: '#/components/schemas/CatalogWhereToWatch' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
  },
  components: {
    parameters: {
      DateQuery: {
        name: 'date',
        in: 'query',
        required: false,
        schema: { type: 'string', example: '2026-03-26' },
        description: 'Date alias, YYYYMMDD, or YYYY-MM-DD.',
      },
      TvViewQuery: {
        name: 'view',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['day', 'now', 'next', 'night', 'search'], default: 'day' },
      },
      GroupQuery: {
        name: 'group',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['tdt', 'autonomico', 'movistar', 'online', 'deporte'] },
      },
      CategoryQuery: {
        name: 'category',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'Cine' },
      },
      ChannelIdQuery: {
        name: 'channelId',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'la_2' },
      },
      SearchQuery: {
        name: 'q',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'Mañaneros 360' },
      },
      SearchQueryRequired: {
        name: 'q',
        in: 'query',
        required: true,
        schema: { type: 'string', example: 'true detective' },
      },
      LimitQuery: {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 5000, default: 24 },
      },
      CursorQuery: {
        name: 'cursor',
        in: 'query',
        required: false,
        schema: { type: 'string', example: '200' },
      },
      ChannelIdPath: {
        name: 'channelId',
        in: 'path',
        required: true,
        schema: { type: 'string', example: 'la_2' },
      },
      AiringIdPath: {
        name: 'airingId',
        in: 'path',
        required: true,
        schema: { type: 'string', example: '20260326:la_2:0900:mananeros_360' },
      },
      DiscoveryTypeQuery: {
        name: 'type',
        in: 'query',
        required: true,
        schema: { type: 'string', enum: ['movie', 'series'] },
      },
      DiscoverySearchTypeQuery: {
        name: 'type',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['all', 'tv', 'program', 'movie', 'series'] },
      },
      GenreQuery: {
        name: 'genre',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'Drama,Thriller' },
      },
      GenreQuerySingle: {
        name: 'genre',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'Drama' },
      },
      PlatformQuery: {
        name: 'platform',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'Netflix,Prime Video' },
      },
      PlatformQuerySingle: {
        name: 'platform',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'Netflix' },
      },
      PlatformsQuery: {
        name: 'platforms',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'Netflix,Prime Video' },
      },
      GenresQuery: {
        name: 'genres',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'Drama,Thriller' },
      },
      AvailabilityQuery: {
        name: 'availability',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'streaming,free' },
      },
      SortQuery: {
        name: 'sort',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['personalized', 'popular', 'rating', 'airtime', 'recent'] },
      },
      PageQuery: {
        name: 'page',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      TimeSlotQuery: {
        name: 'timeSlot',
        in: 'query',
        required: false,
        schema: { type: 'string', example: '6' },
      },
      CatalogTypesQuery: {
        name: 'types',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'movie,series' },
      },
      CatalogIdPath: {
        name: 'catalogId',
        in: 'path',
        required: true,
        schema: { type: 'string', example: 'tmdb:movie:550' },
      },
      ContentIdPath: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', example: 'program:20260326:la_2:0900:mananeros_360' },
      },
      ContentTypePath: {
        name: 'contentType',
        in: 'path',
        required: true,
        schema: { type: 'string', enum: ['movie', 'series', 'program'] },
      },
      SlugPath: {
        name: 'slug',
        in: 'path',
        required: true,
        schema: { type: 'string', example: 'true-detective' },
      },
    },
    responses: {
      BadRequest: {
        description: 'The request parameters are invalid.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          },
        },
      },
      NotFound: {
        description: 'The requested resource does not exist.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          },
        },
      },
    },
    schemas: {
      ApiMeta: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          cached: { type: 'boolean' },
        },
        additionalProperties: true,
      },
      ErrorEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Resource not found' },
              details: {},
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      HealthEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'healthy' },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'string', example: '123s' },
              version: { type: 'string', example: '2.0.0' },
              memory: {
                type: 'object',
                properties: {
                  rss: { type: 'string', example: '128MB' },
                  heapUsed: { type: 'string', example: '64MB' },
                  heapTotal: { type: 'string', example: '96MB' },
                },
              },
            },
            additionalProperties: true,
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      TvReadAssetRef: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['poster', 'backdrop', 'channelLogo', 'platformLogo'] },
          role: { type: 'string', enum: ['primary', 'fallback'] },
          source: { type: 'string', example: 'epg_program_image' },
          url: { type: 'string', example: 'https://cdn.example.com/poster.jpg' },
        },
      },
      TvReadAssetSet: {
        type: 'object',
        properties: {
          primary: { $ref: '#/components/schemas/TvReadAssetRef' },
          poster: { $ref: '#/components/schemas/TvReadAssetRef' },
          backdrop: { $ref: '#/components/schemas/TvReadAssetRef' },
          channelLogo: { $ref: '#/components/schemas/TvReadAssetRef' },
          platformLogo: { $ref: '#/components/schemas/TvReadAssetRef' },
          fallbackChain: {
            type: 'array',
            items: { $ref: '#/components/schemas/TvReadAssetRef' },
          },
          candidates: {
            type: 'array',
            items: { $ref: '#/components/schemas/TvReadAssetRef' },
          },
        },
      },
      TvReadChannel: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'la_2' },
          name: { type: 'string', example: 'La 2' },
          normalizedName: { type: 'string', example: 'la_2' },
          aliases: { type: 'array', items: { type: 'string' } },
          sourceIds: { type: 'array', items: { type: 'string' } },
          type: { type: 'string', example: 'TDT' },
          group: { type: 'string', example: 'tdt' },
          subgroups: { type: 'array', items: { type: 'string' } },
          sortOrder: { type: 'integer', example: 1 },
          icon: { type: 'string', nullable: true },
          country: { type: 'string', nullable: true },
          countryCode: { type: 'string', nullable: true },
          region: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
        },
      },
      TvReadProgram: {
        type: 'object',
        properties: {
          brandKey: { type: 'string', example: 'mananeros_360' },
          title: { type: 'string', example: 'Mañaneros 360' },
          subtitle: { type: 'string', nullable: true },
          normalizedTitle: { type: 'string', example: 'mananeros 360' },
          titleAliases: { type: 'array', items: { type: 'string' } },
          editorialCategory: { type: 'string', example: 'Magazine' },
          genre: { type: 'string', nullable: true },
          subgenre: { type: 'string', nullable: true },
          tmdbId: { type: 'integer', nullable: true },
          description: { type: 'string', nullable: true },
        },
      },
      TvReadAiring: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '20260326:la_2:0900:mananeros_360' },
          date: { type: 'string', example: '20260326' },
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' },
          durationMinutes: { type: 'integer', example: 180 },
          liveNow: { type: 'boolean' },
          partOfDay: { type: 'string', enum: ['madrugada', 'manana', 'tarde', 'noche'] },
          timeSlotKey: { type: 'string', example: '09:00-12:00' },
        },
      },
      TvReadItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '20260326:la_2:0900:mananeros_360' },
          channel: { $ref: '#/components/schemas/TvReadChannel' },
          program: { $ref: '#/components/schemas/TvReadProgram' },
          airing: { $ref: '#/components/schemas/TvReadAiring' },
          assets: { $ref: '#/components/schemas/TvReadAssetSet' },
          availability: {
            type: 'object',
            properties: {
              live: { type: 'boolean' },
              catchup: { type: 'boolean' },
              streaming: { type: 'boolean' },
            },
          },
          sourceProvenance: {
            type: 'object',
            properties: {
              schedule: { type: 'array', items: { type: 'string' } },
              metadata: { type: 'array', items: { type: 'string' } },
              assets: { type: 'array', items: { type: 'string' } },
            },
          },
          timingContext: {
            type: 'object',
            properties: {
              start: { type: 'string', nullable: true },
              end: { type: 'string', nullable: true },
              liveNow: { type: 'boolean' },
              window: { type: 'string', enum: ['now', 'today', 'tonight', 'unknown'], nullable: true },
            },
          },
          relevance: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              reason: { type: 'string' },
            },
          },
        },
      },
      TvReadChannelSummary: {
        type: 'object',
        properties: {
          channel: { $ref: '#/components/schemas/TvReadChannel' },
          current: { $ref: '#/components/schemas/TvReadItem' },
          next: { $ref: '#/components/schemas/TvReadItem' },
          tonight: {
            type: 'array',
            items: { $ref: '#/components/schemas/TvReadItem' },
          },
          counts: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              live: { type: 'integer' },
              tonight: { type: 'integer' },
            },
          },
        },
      },
      TvReadResponse: {
        type: 'object',
        properties: {
          date: { type: 'string', example: '20260326' },
          view: { type: 'string', enum: ['day', 'now', 'next', 'night', 'search'] },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/TvReadItem' },
          },
          channels: {
            type: 'array',
            items: { $ref: '#/components/schemas/TvReadChannelSummary' },
          },
          filters: {
            type: 'object',
            additionalProperties: true,
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              limit: { type: 'integer' },
              nextCursor: { type: 'string', nullable: true },
              cached: { type: 'boolean', nullable: true },
              generatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      TvReadEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/TvReadResponse' },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      TvReadChannelsEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              group: { type: 'string', nullable: true },
              channels: {
                type: 'array',
                items: { $ref: '#/components/schemas/TvReadChannelSummary' },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  cached: { type: 'boolean', nullable: true },
                  generatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      TvReadItemEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              item: { $ref: '#/components/schemas/TvReadItem' },
              relatedChannelItems: {
                type: 'array',
                items: { $ref: '#/components/schemas/TvReadItem' },
              },
              meta: {
                type: 'object',
                properties: {
                  cached: { type: 'boolean', nullable: true },
                  generatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      TvGuideSurfaceEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              filters: { type: 'object', additionalProperties: true },
              nowItems: {
                type: 'array',
                items: { $ref: '#/components/schemas/TvReadItem' },
              },
              nextItems: {
                type: 'array',
                items: { $ref: '#/components/schemas/TvReadItem' },
              },
              nightItems: {
                type: 'array',
                items: { $ref: '#/components/schemas/TvReadItem' },
              },
              channels: {
                type: 'array',
                items: { $ref: '#/components/schemas/TvReadChannelSummary' },
              },
              meta: {
                type: 'object',
                properties: {
                  totalChannels: { type: 'integer' },
                  totalItems: { type: 'integer' },
                  generatedAt: { type: 'string', format: 'date-time' },
                  cached: { type: 'boolean', nullable: true },
                },
              },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      TvChannelSurfaceEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              channel: { $ref: '#/components/schemas/TvReadChannel' },
              current: { $ref: '#/components/schemas/TvReadItem' },
              next: { $ref: '#/components/schemas/TvReadItem' },
              tonightItems: {
                type: 'array',
                items: { $ref: '#/components/schemas/TvReadItem' },
              },
              scheduleItems: {
                type: 'array',
                items: { $ref: '#/components/schemas/TvReadItem' },
              },
              relatedChannels: {
                type: 'array',
                items: { $ref: '#/components/schemas/TvReadChannelSummary' },
              },
              meta: {
                type: 'object',
                properties: {
                  totalItems: { type: 'integer' },
                  generatedAt: { type: 'string', format: 'date-time' },
                  cached: { type: 'boolean', nullable: true },
                },
              },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      CatalogPlatform: {
        type: 'object',
        properties: {
          key: { type: 'string', example: 'netflix' },
          name: { type: 'string', example: 'Netflix' },
          tmdbProviderId: { type: 'integer', example: 8 },
          color: { type: 'string', example: '#E50914' },
          logoUrl: { type: 'string', nullable: true },
          supportedAvailability: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      CatalogProvider: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          logoUrl: { type: 'string' },
          type: { type: 'string', enum: ['flatrate', 'rent', 'buy', 'free'] },
          price: { type: 'string', nullable: true },
          deepLink: { type: 'string', nullable: true },
        },
      },
      CatalogWhereToWatch: {
        type: 'object',
        properties: {
          flatrate: { type: 'array', items: { $ref: '#/components/schemas/CatalogProvider' } },
          rent: { type: 'array', items: { $ref: '#/components/schemas/CatalogProvider' } },
          buy: { type: 'array', items: { $ref: '#/components/schemas/CatalogProvider' } },
          free: { type: 'array', items: { $ref: '#/components/schemas/CatalogProvider' } },
          tmdbLink: { type: 'string' },
        },
      },
      CatalogItem: {
        type: 'object',
        properties: {
          catalogId: { type: 'string', example: 'tmdb:tv:1396' },
          source: { type: 'string', enum: ['program', 'tmdb'] },
          contentType: { type: 'string', enum: ['movie', 'series', 'program'] },
          title: { type: 'string' },
          slug: { type: 'string' },
          detailPath: { type: 'string' },
          subtitle: { type: 'string', nullable: true },
          synopsis: { type: 'string', nullable: true },
          image: { type: 'string', nullable: true },
          backdrop: { type: 'string', nullable: true },
          assets: { $ref: '#/components/schemas/TvReadAssetSet' },
          genres: { type: 'array', items: { type: 'string' } },
          tmdbId: { type: 'integer', nullable: true },
          rating: { type: 'number', nullable: true },
          releaseYear: { type: 'integer', nullable: true },
          durationMinutes: { type: 'integer', nullable: true },
          start: { type: 'string', nullable: true },
          end: { type: 'string', nullable: true },
          liveNow: { type: 'boolean', nullable: true },
          primaryPlatforms: { type: 'array', items: { type: 'string' } },
          whereToWatch: { $ref: '#/components/schemas/CatalogWhereToWatch' },
          channel: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              icon: { type: 'string', nullable: true },
              normalizedName: { type: 'string', nullable: true },
            },
          },
          airings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                channelId: { type: 'string' },
                channelName: { type: 'string' },
                channelIcon: { type: 'string', nullable: true },
                start: { type: 'string' },
                end: { type: 'string' },
              },
            },
          },
        },
      },
      CatalogQueryEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/CatalogItem' },
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  hasMore: { type: 'boolean' },
                },
              },
              availableGenres: { type: 'array', items: { type: 'string' } },
              availablePlatforms: {
                type: 'array',
                items: { $ref: '#/components/schemas/CatalogPlatform' },
              },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      CatalogSuggestionsEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    catalogId: { type: 'string' },
                    source: { type: 'string' },
                    contentType: { type: 'string' },
                    title: { type: 'string' },
                    slug: { type: 'string' },
                    detailPath: { type: 'string' },
                    subtitle: { type: 'string', nullable: true },
                    image: { type: 'string', nullable: true },
                    primaryPlatforms: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      CatalogPlatformsEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/CatalogPlatform' },
              },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      CatalogDetailEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            allOf: [
              { $ref: '#/components/schemas/CatalogItem' },
              {
                type: 'object',
                properties: {
                  cast: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        character: { type: 'string', nullable: true },
                        profile: { type: 'string', nullable: true },
                      },
                    },
                  },
                  director: { type: 'string', nullable: true },
                  related: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CatalogItem' },
                  },
                  socialSummary: {
                    type: 'object',
                    properties: {
                      friendsWhoWatched: { type: 'integer' },
                      avgFriendRating: { type: 'number', nullable: true },
                    },
                  },
                },
              },
            ],
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      DiscoveryHomeEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              personalized: { type: 'array', items: { $ref: '#/components/schemas/CatalogItem' } },
              platformItems: { type: 'array', items: { $ref: '#/components/schemas/CatalogItem' } },
              freeItems: { type: 'array', items: { $ref: '#/components/schemas/CatalogItem' } },
              liveItems: { type: 'array', items: { $ref: '#/components/schemas/CatalogItem' } },
              tonightItems: { type: 'array', items: { $ref: '#/components/schemas/CatalogItem' } },
              trendingItems: { type: 'array', items: { $ref: '#/components/schemas/CatalogItem' } },
              platforms: { type: 'array', items: { $ref: '#/components/schemas/CatalogPlatform' } },
              generatedAt: { type: 'string', format: 'date-time' },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      DiscoveryBrowseEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              contentType: { type: 'string', enum: ['movie', 'series'] },
              items: { type: 'array', items: { $ref: '#/components/schemas/CatalogItem' } },
              liveItems: { type: 'array', items: { $ref: '#/components/schemas/CatalogItem' } },
              availableGenres: { type: 'array', items: { type: 'string' } },
              availablePlatforms: {
                type: 'array',
                items: { $ref: '#/components/schemas/CatalogPlatform' },
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  hasMore: { type: 'boolean' },
                },
              },
              generatedAt: { type: 'string', format: 'date-time' },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      ContentBatchEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/CatalogItem' },
              },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
    },
  },
} as const;
