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
    const anthropicModel = this.resolveAnthropicModel(context);

    try {
      return await this.executeWithProvider(this.provider, messages, prompt, anthropicModel);
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
            prompt,
            anthropicModel
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
    const anthropicModel = this.resolveAnthropicModel(context);

    try {
      yield* this.executeStreamWithProvider(this.provider, messages, prompt, anthropicModel);
    } catch (primaryError) {
      logger.warn('Primary AI stream provider failed', {
        provider: this.provider,
        error: primaryError instanceof Error ? primaryError.message : 'unknown',
      });
      if (this.fallbackProvider) {
        try {
          yield* this.executeStreamWithProvider(this.fallbackProvider, messages, prompt, anthropicModel);
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
    systemPrompt: string,
    anthropicModelOverride?: string
  ): AsyncGenerator<string> {
    if (provider === 'deepseek') {
      yield* this.chatWithDeepSeekStream(messages, systemPrompt);
    } else {
      yield* this.chatWithAnthropicStream(messages, systemPrompt, anthropicModelOverride);
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
      { responseType: 'stream', timeout: 22000 }
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
    systemPrompt: string,
    modelOverride?: string
  ): AsyncGenerator<string> {
    if (!this.anthropicClient) throw new Error('Anthropic client is not configured');

    const response = await this.anthropicClient.post(
      '/messages',
      {
        model: modelOverride ?? this.anthropicModel,
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      },
      { responseType: 'stream', timeout: 22000 }
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
    systemPrompt: string,
    anthropicModelOverride?: string
  ): Promise<ChatbotResponse> {
    const text =
      provider === 'deepseek'
        ? await this.chatWithDeepSeek(messages, systemPrompt)
        : await this.chatWithAnthropic(messages, systemPrompt, anthropicModelOverride);

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
    systemPrompt: string,
    modelOverride?: string
  ): Promise<string> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client is not configured');
    }

    const response = await this.anthropicClient.post('/messages', {
      model: modelOverride ?? this.anthropicModel,
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

  // Static portion of the system prompt — never changes between calls, avoids recomputing tokens.
  private static readonly SYSTEM_STATIC = [
    'Eres el asistente de GuíaTV. Ayudas a encontrar qué ver en TV española y streaming.',
    'Responde SIEMPRE en español. Sé concreto. Usa horas y canales reales. Máximo 3 recomendaciones.',
    'Nunca inventes títulos, canales ni plataformas. Si la consulta es ambigua haz solo una pregunta.',
    'Devuelve SIEMPRE JSON válido:',
    '{"text":"...","recommendations":[{"title":"","type":"movie|series|program","platform":"","channel":"","time":"","reason":""}],"moreRecommendations":[],"followUpSuggestions":[]}',
    'followUpSuggestions: 3 preguntas concretas. tv_now→siguiente franja o género alternativo; tv_tonight→qué hay ahora o en streaming; streaming→otra plataforma o género similar; general→búsqueda más específica.',
  ].join('\n');

  private buildCompactProfile(ctx: ChatbotContext): string {
    const p = ctx.userProfile;
    const m = ctx.assistantMemory;
    const parts: string[] = [`Usuario: ${p.name}`];
    const genres = [...new Set([...p.favoriteGenres.slice(0, 4), ...(m?.likedGenres?.slice(0, 3) ?? [])])];
    if (genres.length) parts.push(`Géneros: ${genres.join(', ')}`);
    const avoid = [...new Set([...(p.dislikedGenres ?? []), ...(m?.negativeSignals?.slice(0, 3) ?? [])])];
    if (avoid.length) parts.push(`Evitar: ${avoid.slice(0, 4).join(', ')}`);
    const platforms = [...new Set([...p.preferredPlatforms.slice(0, 4), ...(m?.preferredPlatforms?.slice(0, 3) ?? [])])];
    if (platforms.length) parts.push(`Plataformas: ${platforms.slice(0, 5).join(', ')}`);
    if (m?.preferredAutonomousCommunity) parts.push(`CC.AA.: ${m.preferredAutonomousCommunity}`);
    const mode = ctx.queryIntent?.mode;
    if (mode && mode !== 'general') parts.push(`Modo: ${mode}`);
    return `PERFIL: ${parts.join(' | ')}`;
  }

  private buildCompactMemory(ctx: ChatbotContext): string {
    const history = ctx.conversationHistory?.slice(-6) ?? [];
    if (!history.length) return '';
    const lines = history.map((m) =>
      `${m.role === 'user' ? 'U' : 'A'}: ${m.content.slice(0, m.role === 'user' ? 300 : 200)}`
    );
    return `CHAT:\n${lines.join('\n')}`;
  }

  private buildCompactLiveData(ctx: ChatbotContext): string {
    const parts: string[] = [];
    if (ctx.liveNow?.length) {
      parts.push(
        'AHORA:\n' +
          ctx.liveNow
            .slice(0, 6)
            .map((p) => `${p.time} ${p.channel}: "${p.title}" [${p.genre}]${p.tmdbRating ? ` ★${p.tmdbRating}` : ''}`)
            .join('\n')
      );
    }
    if (ctx.tonight?.length) {
      parts.push(
        'ESTA NOCHE:\n' +
          ctx.tonight
            .slice(0, 6)
            .map((p) => `${p.time} ${p.channel}: "${p.title}" [${p.genre}]${p.tmdbRating ? ` ★${p.tmdbRating}` : ''}`)
            .join('\n')
      );
    }
    if (ctx.streamingMatches?.length) {
      parts.push(
        'STREAMING:\n' +
          ctx.streamingMatches
            .slice(0, 8)
            .map((p) => `${p.title} [${p.genre}] ${p.platform ?? ''}${p.tmdbRating ? ` ★${p.tmdbRating}` : ''}`)
            .join('\n')
      );
    }
    return parts.join('\n\n');
  }

  private buildSystemPrompt(context: ChatbotContext): string {
    const prompt = [
      AIRecommendationService.SYSTEM_STATIC,
      this.buildCompactProfile(context),
      this.buildCompactMemory(context),
      this.buildCompactLiveData(context),
    ]
      .filter(Boolean)
      .join('\n\n');

    // Rough token estimate: ~4 chars per token. Log so we can track prompt size trends.
    logger.info('[AIRecommendationService] PROMPT_TOKENS', {
      estimatedTokens: Math.ceil(prompt.length / 4),
      promptChars: prompt.length,
      mode: context.queryIntent?.mode ?? 'unknown',
    });

    return prompt;
  }

  /** Selects Haiku for lightweight TV schedule intents, Sonnet/default for general/streaming. */
  private resolveAnthropicModel(context: ChatbotContext): string {
    const mode = context.queryIntent?.mode;
    if (mode === 'tv_now' || mode === 'tv_tonight') {
      return process.env.AI_CHATBOT_ANTHROPIC_HAIKU_MODEL ?? 'claude-haiku-4-5-20251001';
    }
    return this.anthropicModel;
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
