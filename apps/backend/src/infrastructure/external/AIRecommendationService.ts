import axios, { AxiosInstance } from 'axios';
import { logger } from '@/shared/utils/logger';
import { Readable } from 'stream';

export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotRecommendationPayload {
  catalogId?: string;
  detailPath?: string;
  source?: 'program' | 'tmdb';
  title: string;
  subtitle?: string;
  type: 'movie' | 'series' | 'program';
  platform?: string;
  channel?: string;
  time?: string;
  channelOrPlatform?: string;
  startTime?: string;
  endTime?: string;
  liveNow?: boolean;
  reason: string;
  tmdbId?: number;
  image?: string;
  actions?: {
    canOpenDetail: boolean;
    canSave: boolean;
    canTrack: boolean;
  };
  badges?: string[];
  rating?: number;
  durationMinutes?: number;
  synopsis?: string;
  platformLogo?: string;
}

export interface ChatbotQueryContext {
  mode: 'tv_now' | 'tv_tonight' | 'streaming' | 'general';
  requestedTypes: Array<'movie' | 'series' | 'program'>;
  totalMatches: number;
  primaryMatches?: number;
  shownCount: number;
  hasMore: boolean;
  answerWindowLabel: string;
  hasAutonomicMatches?: boolean;
  autonomicPromptRequired?: boolean;
  savedAutonomousCommunity?: string;
}

export interface AssistantMemorySnapshotPayload {
  preferredPlatforms: string[];
  avoidedPlatforms: string[];
  likedGenres: string[];
  dislikedGenres?: string[];
  negativeSignals: string[];
  preferredDurations: string[];
  preferredViewingContexts: string[];
  favoriteFranchisesOrTitles: string[];
  preferredAutonomousCommunity?: string;
  autonomicOptIn?: boolean | 'unknown';
}

export interface ChatbotContext {
  userId: string;
  userProfile: {
    name: string;
    favoriteGenres: string[];
    dislikedGenres?: string[];
    topRatedContent: Array<{ title: string; rating: number; type: string }>;
    recentlyWatched: Array<{ title: string; platform?: string }>;
    preferredPlatforms: string[];
    avgRating: number;
  };
  assistantMemory?: {
    likedGenres: string[];
    dislikedGenres: string[];
    preferredPlatforms: string[];
    avoidedPlatforms: string[];
    preferredDurations?: string[];
    preferredViewingContexts?: string[];
    favoriteFranchisesOrTitles: string[];
    recentTopics: string[];
    negativeSignals: string[];
    preferredAutonomousCommunity?: string;
    autonomicOptIn?: boolean | 'unknown';
    lastCommunityConfirmationAt?: string;
  };
  conversationHistory?: ChatbotMessage[];
  liveNow?: Array<{
    title: string;
    type: 'movie' | 'series' | 'program';
    channel: string;
    time: string;
    genre: string;
    tmdbRating?: number;
    platform?: string;
  }>;
  tonight?: Array<{
    title: string;
    type: 'movie' | 'series' | 'program';
    channel: string;
    time: string;
    genre: string;
    tmdbRating?: number;
    platform?: string;
  }>;
  streamingMatches?: Array<{
    title: string;
    type: 'movie' | 'series' | 'program';
    platform?: string;
    channel?: string;
    time?: string;
    genre: string;
    tmdbRating?: number;
  }>;
  queryIntent?: {
    mode: 'tv_now' | 'tv_tonight' | 'streaming' | 'general';
    requestedTypes: Array<'movie' | 'series' | 'program'>;
    explicitGenres: string[];
    explicitPlatforms: string[];
    wantsFamily?: boolean;
    wantsShort?: boolean;
    negativeSignals?: string[];
  };
}

export interface ChatbotResponse {
  text: string;
  conversationId?: string;
  recommendations?: ChatbotRecommendationPayload[];
  moreRecommendations?: ChatbotRecommendationPayload[];
  followUpSuggestions?: string[];
  queryContext?: ChatbotQueryContext;
  assistantMemorySnapshot?: AssistantMemorySnapshotPayload;
}

type AIProvider = 'deepseek' | 'anthropic';

interface AIRecommendationServiceOptions {
  provider?: string;
  deepseekApiKey?: string;
  anthropicApiKey?: string;
  deepseekModel?: string;
  anthropicModel?: string;
}

export class AIRecommendationService {
  private readonly provider: AIProvider;
  private readonly fallbackProvider: AIProvider | null;
  private readonly deepseekClient?: AxiosInstance;
  private readonly anthropicClient?: AxiosInstance;
  private readonly deepseekModel: string;
  private readonly anthropicModel: string;

  constructor(options: AIRecommendationServiceOptions = {}) {
    this.provider = this.resolvePrimaryProvider(options);
    this.fallbackProvider = this.resolveFallbackProvider(options, this.provider);
    this.deepseekModel = options.deepseekModel || process.env.AI_CHATBOT_MODEL || 'deepseek-chat';
    this.anthropicModel =
      options.anthropicModel || process.env.AI_CHATBOT_ANTHROPIC_MODEL || 'claude-opus-4-1';

    if (options.deepseekApiKey) {
      this.deepseekClient = axios.create({
        baseURL: 'https://api.deepseek.com',
        timeout: 20000,
        headers: {
          Authorization: `Bearer ${options.deepseekApiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }

    if (options.anthropicApiKey) {
      this.anthropicClient = axios.create({
        baseURL: 'https://api.anthropic.com/v1',
        timeout: 20000,
        headers: {
          'x-api-key': options.anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      });
    }
  }

  async chat(
    messages: ChatbotMessage[],
    context: ChatbotContext
  ): Promise<ChatbotResponse> {
    const prompt = this.buildSystemPrompt(context);

    try {
      return await this.executeWithProvider(this.provider, messages, prompt);
    } catch (primaryError) {
      logger.warn('Primary AI provider failed', {
        provider: this.provider,
        error:
          primaryError instanceof Error
            ? primaryError.message
            : 'unknown_provider_error',
      });
      if (this.fallbackProvider) {
        try {
          return await this.executeWithProvider(
            this.fallbackProvider,
            messages,
            prompt
          );
        } catch (fallbackError) {
          logger.warn('Fallback AI provider failed', {
            provider: this.fallbackProvider,
            error:
              fallbackError instanceof Error
                ? fallbackError.message
                : 'unknown_provider_error',
          });
          return this.buildFailureResponse(primaryError);
        }
      }

      return this.buildFailureResponse(primaryError);
    }
  }

  async *chatStream(
    messages: ChatbotMessage[],
    context: ChatbotContext
  ): AsyncGenerator<string> {
    const prompt = this.buildSystemPrompt(context);

    try {
      yield* this.executeStreamWithProvider(this.provider, messages, prompt);
    } catch (primaryError) {
      logger.warn('Primary AI stream provider failed', {
        provider: this.provider,
        error: primaryError instanceof Error ? primaryError.message : 'unknown',
      });
      if (this.fallbackProvider) {
        try {
          yield* this.executeStreamWithProvider(this.fallbackProvider, messages, prompt);
          return;
        } catch (fallbackError) {
          logger.warn('Fallback AI stream provider failed', {
            provider: this.fallbackProvider,
            error: fallbackError instanceof Error ? fallbackError.message : 'unknown',
          });
        }
      }
      throw primaryError;
    }
  }

  parseStreamedResponse(fullText: string): ChatbotResponse {
    return this.parseResponse(this.validateProviderPayload(fullText));
  }

  private async *executeStreamWithProvider(
    provider: AIProvider,
    messages: ChatbotMessage[],
    systemPrompt: string
  ): AsyncGenerator<string> {
    if (provider === 'deepseek') {
      yield* this.chatWithDeepSeekStream(messages, systemPrompt);
    } else {
      yield* this.chatWithAnthropicStream(messages, systemPrompt);
    }
  }

  private async *chatWithDeepSeekStream(
    messages: ChatbotMessage[],
    systemPrompt: string
  ): AsyncGenerator<string> {
    if (!this.deepseekClient) throw new Error('DeepSeek client is not configured');

    const response = await this.deepseekClient.post(
      '/chat/completions',
      {
        model: this.deepseekModel,
        temperature: 0.5,
        max_tokens: 1024,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      },
      { responseType: 'stream', timeout: 30000 }
    );

    const stream = response.data as Readable;
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') return;

        try {
          const parsed = JSON.parse(payload);
          const content = parsed?.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  private async *chatWithAnthropicStream(
    messages: ChatbotMessage[],
    systemPrompt: string
  ): AsyncGenerator<string> {
    if (!this.anthropicClient) throw new Error('Anthropic client is not configured');

    const response = await this.anthropicClient.post(
      '/messages',
      {
        model: this.anthropicModel,
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      },
      { responseType: 'stream', timeout: 30000 }
    );

    const stream = response.data as Readable;
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();

        try {
          const parsed = JSON.parse(payload);
          if (parsed?.type === 'content_block_delta') {
            const text = parsed?.delta?.text;
            if (text) yield text;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  private async executeWithProvider(
    provider: AIProvider,
    messages: ChatbotMessage[],
    systemPrompt: string
  ): Promise<ChatbotResponse> {
    const text =
      provider === 'deepseek'
        ? await this.chatWithDeepSeek(messages, systemPrompt)
        : await this.chatWithAnthropic(messages, systemPrompt);

    return this.parseResponse(this.validateProviderPayload(text));
  }

  private async chatWithDeepSeek(
    messages: ChatbotMessage[],
    systemPrompt: string
  ): Promise<string> {
    if (!this.deepseekClient) {
      throw new Error('DeepSeek client is not configured');
    }

    const response = await this.deepseekClient.post('/chat/completions', {
      model: this.deepseekModel,
      temperature: 0.5,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    });

    return String(
      response.data?.choices?.[0]?.message?.content ||
      response.data?.choices?.[0]?.text ||
      ''
    ).trim();
  }

  private async chatWithAnthropic(
    messages: ChatbotMessage[],
    systemPrompt: string
  ): Promise<string> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client is not configured');
    }

    const response = await this.anthropicClient.post('/messages', {
      model: this.anthropicModel,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    return Array.isArray(response.data?.content)
      ? response.data.content
          .map((block: any) => String(block?.text || '').trim())
          .filter(Boolean)
          .join('\n')
      : '';
  }

  private buildSystemPrompt(context: ChatbotContext): string {
    const {
      userProfile,
      assistantMemory,
      conversationHistory,
      liveNow,
      tonight,
      streamingMatches,
      queryIntent,
    } = context;

    return `Eres el asistente de recomendaciones de Guía TV, una app española de television y streaming.

Tu objetivo es ayudar a ${userProfile.name} a decidir qué ver basandote EXCLUSIVAMENTE en sus gustos reales, en la parrilla real y en el catálogo disponible.

## PERFIL DEL USUARIO
- Géneros favoritos: ${userProfile.favoriteGenres.join(', ') || 'No especificados todavía'}
- Géneros a evitar: ${userProfile.dislikedGenres?.join(', ') || assistantMemory?.dislikedGenres?.join(', ') || 'No especificados'}
- Plataformas disponibles: ${userProfile.preferredPlatforms.join(', ') || 'No especificadas'}
- Puntuación media que da: ${userProfile.avgRating}/10
- Contenido mejor valorado: ${userProfile.topRatedContent
  .slice(0, 5)
  .map((item) => `${item.title} (${item.rating}/10)`)
  .join(', ') || 'Sin valoraciones todavía'}
- Visto recientemente: ${userProfile.recentlyWatched
  .slice(0, 5)
  .map((item) => item.platform ? `${item.title} en ${item.platform}` : item.title)
  .join(', ') || 'Sin historial'}

## MEMORIA LARGA DEL ASISTENTE
- Gustos inferidos: ${assistantMemory?.likedGenres?.join(', ') || 'Sin señales claras'}
- Plataformas reforzadas: ${assistantMemory?.preferredPlatforms?.join(', ') || 'Sin señales claras'}
- Plataformas evitadas: ${assistantMemory?.avoidedPlatforms?.join(', ') || 'Sin señales claras'}
- Duración preferida: ${assistantMemory?.preferredDurations?.join(', ') || 'Sin señales claras'}
- Contexto de visionado: ${assistantMemory?.preferredViewingContexts?.join(', ') || 'Sin señales claras'}
- Señales negativas: ${assistantMemory?.negativeSignals?.join(', ') || 'Sin señales negativas'}
- Temas recientes: ${assistantMemory?.recentTopics?.join(', ') || 'Sin temas recientes'}

## HISTORIAL RECIENTE DEL ASISTENTE
${conversationHistory?.slice(-8)?.map(
    (message) => `- ${message.role === 'user' ? 'Usuario' : 'Asistente'}: ${message.content}`
  )
  .join('\n') || 'Sin conversación previa relevante'}

## EN EMISIÓN AHORA MISMO
${liveNow?.slice(0, 10)?.map(
    (program) =>
      `- ${program.time} · ${program.channel}: "${program.title}" [${program.genre}] (${program.type})${
        program.tmdbRating ? ` (TMDB: ${program.tmdbRating}/10)` : ''
      }`
  )
  .join('\n') || 'No hay datos relevantes en emisión ahora mismo'}

## ESTA NOCHE EN TV
${tonight?.slice(0, 12)?.map(
    (program) =>
      `- ${program.time} en ${program.channel}: "${program.title}" [${program.genre}] (${program.type})${
        program.tmdbRating ? ` (TMDB: ${program.tmdbRating}/10)` : ''
      }`
  )
  .join('\n') || 'No hay datos de programación disponibles'}

## STREAMING COMPATIBLE
${streamingMatches?.slice(0, 12)?.map(
    (item) =>
      `- ${item.title} [${item.genre}] en ${item.platform || 'streaming'} (${item.type})${
        item.tmdbRating ? ` (TMDB: ${item.tmdbRating}/10)` : ''
      }`
  )
  .join('\n') || 'No hay resultados relevantes en streaming'}

## INTENCIÓN DE LA CONSULTA ACTUAL
- Modo: ${queryIntent?.mode || 'general'}
- Tipos solicitados: ${queryIntent?.requestedTypes.join(', ') || 'sin preferencia'}
- Géneros explícitos: ${queryIntent?.explicitGenres.join(', ') || 'ninguno'}
- Plataformas explícitas: ${queryIntent?.explicitPlatforms.join(', ') || 'ninguna'}
- Familiar: ${queryIntent?.wantsFamily ? 'sí' : 'no'}
- Corto: ${queryIntent?.wantsShort ? 'sí' : 'no'}
- Señales negativas actuales: ${queryIntent?.negativeSignals?.join(', ') || 'ninguna'}

## INSTRUCCIONES
1. Responde SIEMPRE en español.
2. Sé útil y concreto. No repitas preguntas del usuario ni plantillas vacías.
3. Máximo 3 recomendaciones por respuesta.
4. Prioriza TV de hoy y plataformas compatibles con el perfil del usuario.
5. Si la consulta es sobre TV en directo o parrilla actual, responde primero con TV real. Solo ofrece streaming como alternativa si no hay coincidencias reales.
6. Si no hay coincidencias directas, dilo con honestidad y ofrece la siguiente mejor opción inmediata: más tarde esta noche, mañana o streaming compatible.
7. No digas que algo no encaja con su perfil salvo que sea realmente relevante; la prioridad es responder a la consulta exacta.
8. Usa horas y canales reales cuando recomiendes TV. No uses frases vagas como "explora Prime Video" si puedes dar títulos concretos.
9. Si la consulta es ambigua, haz como mucho una sola pregunta de aclaración útil.
10. Nunca inventes títulos, canales ni plataformas.
11. Devuelve SIEMPRE un JSON válido con este formato exacto:
{
  "text": "mensaje conversacional para el usuario",
  "recommendations": [
    {
      "title": "Nombre exacto",
      "type": "movie|series|program",
      "platform": "Netflix|Prime Video|TV|etc",
      "channel": "Nombre del canal si es TV",
      "time": "HH:MM si aplica",
      "reason": "una línea explicando por qué"
    }
  ],
  "moreRecommendations": [],
  "followUpSuggestions": ["otra pregunta útil", "segunda pregunta útil"]
}
`;
  }

  private parseResponse(text: string): ChatbotResponse {
    const raw = String(text || '').trim();
    const jsonPayload = this.extractJsonPayload(raw);

    if (jsonPayload) {
      try {
        const parsed = JSON.parse(jsonPayload);
        return this.normalizeResponse(parsed);
      } catch {
        // fall through to text fallback
      }
    }

    if (raw) {
      return {
        text: raw,
        recommendations: [],
        followUpSuggestions: [],
      };
    }

    return {
      text:
        'No encontré una recomendación clara con los datos actuales. Prueba a pedir algo más concreto, como género, plataforma o ambiente.',
      recommendations: [],
      followUpSuggestions: [
        '¿Qué hay esta noche en TV?',
        'Quiero una serie corta',
      ],
    };
  }

  private validateProviderPayload(text: string): string {
    const raw = String(text || '').trim();

    if (!raw) {
      throw new Error('AI provider returned empty payload');
    }

    const lowered = raw.toLowerCase();
    if (raw.startsWith('<') || raw.startsWith('<!--') || lowered.includes('<html')) {
      throw new Error('AI provider returned invalid payload');
    }

    return raw;
  }

  private normalizeResponse(value: any): ChatbotResponse {
    const normalizeRecommendations = (input: any): ChatbotRecommendationPayload[] =>
      Array.isArray(input)
        ? input
            .map((item: any) => ({
              catalogId: item?.catalogId ? String(item.catalogId) : undefined,
              detailPath: item?.detailPath ? String(item.detailPath) : undefined,
              source:
                item?.source === 'program' || item?.source === 'tmdb'
                  ? item.source
                  : undefined,
              title: String(item?.title || '').trim(),
              subtitle: item?.subtitle ? String(item.subtitle).trim() : undefined,
              type:
                item?.type === 'movie' || item?.type === 'series' || item?.type === 'program'
                  ? item.type
                  : 'program',
              platform: item?.platform ? String(item.platform) : undefined,
              channel: item?.channel ? String(item.channel) : undefined,
              time: item?.time ? String(item.time) : undefined,
              channelOrPlatform: item?.channelOrPlatform
                ? String(item.channelOrPlatform).trim()
                : undefined,
              startTime: item?.startTime ? String(item.startTime).trim() : undefined,
              endTime: item?.endTime ? String(item.endTime).trim() : undefined,
              liveNow: Boolean(item?.liveNow),
              reason: String(item?.reason || '').trim() || 'Encaja con tu perfil.',
              tmdbId:
                item?.tmdbId !== undefined && item?.tmdbId !== null
                  ? Number(item.tmdbId)
                  : undefined,
              image: item?.image ? String(item.image) : undefined,
              actions: {
                canOpenDetail: item?.actions?.canOpenDetail !== false,
                canSave: item?.actions?.canSave !== false,
                canTrack: item?.actions?.canTrack !== false,
              },
              badges: Array.isArray(item?.badges)
                ? item.badges
                    .map((badge: unknown) => String(badge || '').trim())
                    .filter(Boolean)
                    .slice(0, 4)
                : [],
            }))
            .filter((item: any) => Boolean(item.title))
        : [];

    return {
      text: String(value?.text || '').trim() || 'Aquí tienes una propuesta ajustada a tu perfil.',
      recommendations: normalizeRecommendations(value?.recommendations),
      moreRecommendations: normalizeRecommendations(value?.moreRecommendations),
      followUpSuggestions: Array.isArray(value?.followUpSuggestions)
        ? value.followUpSuggestions
            .map((item: any) => String(item || '').trim())
            .filter(Boolean)
            .slice(0, 4)
        : [],
      queryContext:
        value?.queryContext &&
        (value.queryContext.mode === 'tv_now' ||
          value.queryContext.mode === 'tv_tonight' ||
          value.queryContext.mode === 'streaming' ||
          value.queryContext.mode === 'general')
          ? {
              mode: value.queryContext.mode,
              requestedTypes: Array.isArray(value.queryContext.requestedTypes)
                ? value.queryContext.requestedTypes.filter((entry: any) =>
                    entry === 'movie' || entry === 'series' || entry === 'program'
                  )
                : [],
              totalMatches: Number(value.queryContext.totalMatches || 0),
              primaryMatches: Number(value.queryContext.primaryMatches || 0),
              shownCount: Number(value.queryContext.shownCount || 0),
              hasMore: Boolean(value.queryContext.hasMore),
              answerWindowLabel: String(value.queryContext.answerWindowLabel || '').trim(),
              hasAutonomicMatches: Boolean(value.queryContext.hasAutonomicMatches),
              autonomicPromptRequired: Boolean(
                value.queryContext.autonomicPromptRequired
              ),
              savedAutonomousCommunity: value.queryContext.savedAutonomousCommunity
                ? String(value.queryContext.savedAutonomousCommunity).trim()
                : undefined,
            }
          : undefined,
      assistantMemorySnapshot: value?.assistantMemorySnapshot
        ? {
            preferredPlatforms: Array.isArray(
              value.assistantMemorySnapshot.preferredPlatforms
            )
              ? value.assistantMemorySnapshot.preferredPlatforms
                  .map((entry: unknown) => String(entry || '').trim())
                  .filter(Boolean)
              : [],
            avoidedPlatforms: Array.isArray(
              value.assistantMemorySnapshot.avoidedPlatforms
            )
              ? value.assistantMemorySnapshot.avoidedPlatforms
                  .map((entry: unknown) => String(entry || '').trim())
                  .filter(Boolean)
              : [],
            likedGenres: Array.isArray(value.assistantMemorySnapshot.likedGenres)
              ? value.assistantMemorySnapshot.likedGenres
                  .map((entry: unknown) => String(entry || '').trim())
                  .filter(Boolean)
              : [],
            dislikedGenres: Array.isArray(
              value.assistantMemorySnapshot.dislikedGenres
            )
              ? value.assistantMemorySnapshot.dislikedGenres
                  .map((entry: unknown) => String(entry || '').trim())
                  .filter(Boolean)
              : [],
            negativeSignals: Array.isArray(
              value.assistantMemorySnapshot.negativeSignals
            )
              ? value.assistantMemorySnapshot.negativeSignals
                  .map((entry: unknown) => String(entry || '').trim())
                  .filter(Boolean)
              : [],
            preferredDurations: Array.isArray(
              value.assistantMemorySnapshot.preferredDurations
            )
              ? value.assistantMemorySnapshot.preferredDurations
                  .map((entry: unknown) => String(entry || '').trim())
                  .filter(Boolean)
              : [],
            preferredViewingContexts: Array.isArray(
              value.assistantMemorySnapshot.preferredViewingContexts
            )
              ? value.assistantMemorySnapshot.preferredViewingContexts
                  .map((entry: unknown) => String(entry || '').trim())
                  .filter(Boolean)
              : [],
            favoriteFranchisesOrTitles: Array.isArray(
              value.assistantMemorySnapshot.favoriteFranchisesOrTitles
            )
              ? value.assistantMemorySnapshot.favoriteFranchisesOrTitles
                  .map((entry: unknown) => String(entry || '').trim())
                  .filter(Boolean)
              : [],
            preferredAutonomousCommunity: value.assistantMemorySnapshot
              ?.preferredAutonomousCommunity
              ? String(
                  value.assistantMemorySnapshot.preferredAutonomousCommunity
                ).trim()
              : undefined,
            autonomicOptIn:
              typeof value.assistantMemorySnapshot?.autonomicOptIn !== 'undefined'
                ? value.assistantMemorySnapshot.autonomicOptIn
                : 'unknown',
          }
        : undefined,
    };
  }

  private extractJsonPayload(text: string): string | null {
    const clean = text.replace(/```json|```/gi, '').trim();
    if (!clean) {
      return null;
    }

    if (clean.startsWith('{') && clean.endsWith('}')) {
      return clean;
    }

    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return clean.slice(start, end + 1);
    }

    return null;
  }

  private resolvePrimaryProvider(options: AIRecommendationServiceOptions): AIProvider {
    const requested = String(options.provider || process.env.AI_PROVIDER || '').toLowerCase();

    if (requested === 'anthropic' && options.anthropicApiKey) {
      return 'anthropic';
    }

    if (requested === 'deepseek' && options.deepseekApiKey) {
      return 'deepseek';
    }

    if (options.deepseekApiKey) {
      return 'deepseek';
    }

    if (options.anthropicApiKey) {
      return 'anthropic';
    }

    throw new Error('No AI provider credentials configured');
  }

  private resolveFallbackProvider(
    options: AIRecommendationServiceOptions,
    primary: AIProvider
  ): AIProvider | null {
    if (primary !== 'deepseek' && options.deepseekApiKey) {
      return 'deepseek';
    }

    if (primary !== 'anthropic' && options.anthropicApiKey) {
      return 'anthropic';
    }

    return null;
  }

  private buildFailureResponse(error: unknown): ChatbotResponse {
    const rawMessage =
      error instanceof Error && error.message
        ? error.message
        : 'No pude consultar el proveedor de IA.';

    const message =
      rawMessage.includes('invalid payload') ||
      rawMessage.includes('empty payload') ||
      rawMessage.includes('Unexpected token')
        ? 'El servicio del asistente ha devuelto una respuesta no utilizable.'
        : rawMessage;

    return {
      text: `No he podido generar una recomendación útil ahora mismo. ${message}`,
      recommendations: [],
      followUpSuggestions: [
        '¿Qué hay ahora mismo en TV?',
        '¿Qué me recomiendas esta noche?',
      ],
    };
  }
}
