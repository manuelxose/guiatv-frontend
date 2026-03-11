import { randomUUID } from 'crypto';
import { CATALOG_PLATFORM_REGISTRY, CatalogContentType } from '../dto/CatalogDTO';
import {
  ChatbotQueryContext,
  ChatbotMessage,
  ChatbotRecommendationPayload,
  ChatbotResponse,
} from '@/infrastructure/external/AIRecommendationService';
import {
  UserAssistantConversationModel,
  IUserAssistantConversationDocument,
} from '@/infrastructure/database/models/UserAssistantConversation.model';
import {
  UserAssistantMemoryModel,
  IUserAssistantMemoryDocument,
} from '@/infrastructure/database/models/UserAssistantMemory.model';
import {
  UserNotificationModel,
} from '@/infrastructure/database/models/UserNotification.model';
import mongoose from 'mongoose';

export interface AssistantMemorySnapshot {
  likedGenres: string[];
  dislikedGenres: string[];
  preferredPlatforms: string[];
  avoidedPlatforms: string[];
  preferredDurations: string[];
  preferredViewingContexts: string[];
  favoriteFranchisesOrTitles: string[];
  recentTopics: string[];
  negativeSignals: string[];
  preferredAutonomousCommunity?: string;
  autonomicOptIn?: boolean | 'unknown';
  lastCommunityConfirmationAt?: string;
  updatedAt?: string;
}

export interface AssistantHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  recommendations?: ChatbotRecommendationPayload[];
  moreRecommendations?: ChatbotRecommendationPayload[];
  followUpSuggestions?: string[];
  queryContext?: ChatbotQueryContext;
  feedback?: { rating: 'positive' | 'negative' };
}

export interface AssistantHistoryPayload {
  conversationId: string | null;
  sessionTitle?: string;
  messages: AssistantHistoryMessage[];
  memory: AssistantMemorySnapshot | null;
  updatedAt?: string;
}

export interface TrackAssistantActionInput {
  userId: string;
  conversationId?: string;
  action:
    | 'open_recommendation'
    | 'save_recommendation'
    | 'follow_recommendation'
    | 'ignore_recommendation'
    | 'rate_positive'
    | 'rate_negative';
  recommendation: {
    title: string;
    type?: CatalogContentType;
    platform?: string;
    channel?: string;
  };
}

const KNOWN_GENRES = [
  'Cine',
  'Series',
  'Acción',
  'Drama',
  'Comedia',
  'Terror',
  'Ciencia ficción',
  'Documental',
  'Deportes',
  'Infantil',
  'Suspense',
  'Romance',
  'Noticias',
  'Cultura',
];

const KNOWN_PLATFORMS = CATALOG_PLATFORM_REGISTRY.map((platform) => platform.name);
const NEGATIVE_TOKENS = [
  'sin ',
  'no ',
  'nada de ',
  'evita ',
  'odio ',
  'prefiero evitar ',
  'mejor sin ',
  'paso de ',
];
const MAX_STORED_MESSAGES = 24;
const AUTONOMOUS_COMMUNITIES: Array<{
  canonical: string;
  aliases: string[];
}> = [
  { canonical: 'Andalucía', aliases: ['andalucia', 'andalucía'] },
  { canonical: 'Aragón', aliases: ['aragon', 'aragón'] },
  { canonical: 'Asturias', aliases: ['asturias', 'principado de asturias'] },
  { canonical: 'Baleares', aliases: ['baleares', 'illes balears', 'islas baleares'] },
  { canonical: 'Canarias', aliases: ['canarias', 'islas canarias'] },
  { canonical: 'Cantabria', aliases: ['cantabria'] },
  { canonical: 'Castilla-La Mancha', aliases: ['castilla la mancha', 'castilla-la-mancha'] },
  { canonical: 'Castilla y León', aliases: ['castilla y leon', 'castilla y león'] },
  { canonical: 'Cataluña', aliases: ['cataluna', 'cataluña', 'catalunya'] },
  { canonical: 'Comunidad Valenciana', aliases: ['comunidad valenciana', 'valencia', 'pais valenciano', 'país valenciano'] },
  { canonical: 'Extremadura', aliases: ['extremadura'] },
  { canonical: 'Galicia', aliases: ['galicia'] },
  { canonical: 'La Rioja', aliases: ['la rioja', 'rioja'] },
  { canonical: 'Madrid', aliases: ['madrid', 'comunidad de madrid'] },
  { canonical: 'Murcia', aliases: ['murcia', 'region de murcia', 'región de murcia'] },
  { canonical: 'Navarra', aliases: ['navarra'] },
  { canonical: 'País Vasco', aliases: ['pais vasco', 'país vasco', 'euskadi'] },
];

export interface ConversationSummary {
  conversationId: string;
  sessionTitle: string;
  lastUsedAt: string;
  pinned: boolean;
  archived: boolean;
  messageCount: number;
  lastMessage?: string;
}

export class AssistantMemoryService {
  async listConversations(
    userId: string,
    options?: { archived?: boolean }
  ): Promise<ConversationSummary[]> {
    const filter: Record<string, unknown> = { userId };
    if (typeof options?.archived === 'boolean') {
      filter.archived = options.archived;
    }

    const conversations = await UserAssistantConversationModel.find(filter)
      .sort({ pinned: -1, lastUsedAt: -1 })
      .select('conversationId sessionTitle lastUsedAt pinned archived messages')
      .lean()
      .exec();

    return conversations.map((c) => ({
      conversationId: c.conversationId,
      sessionTitle: c.sessionTitle || 'Conversación',
      lastUsedAt: new Date(c.lastUsedAt).toISOString(),
      pinned: c.pinned || false,
      archived: c.archived || false,
      messageCount: c.messages?.length || 0,
      lastMessage: c.messages?.length
        ? c.messages[c.messages.length - 1].content?.slice(0, 120)
        : undefined,
    }));
  }

  async searchConversations(
    userId: string,
    query: string
  ): Promise<ConversationSummary[]> {
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
    if (!safeQuery) return [];

    const conversations = await UserAssistantConversationModel.find({
      userId,
      $or: [
        { sessionTitle: { $regex: safeQuery, $options: 'i' } },
        { 'messages.content': { $regex: safeQuery, $options: 'i' } },
      ],
    })
      .sort({ lastUsedAt: -1 })
      .limit(20)
      .select('conversationId sessionTitle lastUsedAt pinned archived messages')
      .lean()
      .exec();

    return conversations.map((c) => ({
      conversationId: c.conversationId,
      sessionTitle: c.sessionTitle || 'Conversación',
      lastUsedAt: new Date(c.lastUsedAt).toISOString(),
      pinned: c.pinned || false,
      archived: c.archived || false,
      messageCount: c.messages?.length || 0,
      lastMessage: c.messages?.length
        ? c.messages[c.messages.length - 1].content?.slice(0, 120)
        : undefined,
    }));
  }

  async getConversation(
    userId: string,
    conversationId: string
  ): Promise<AssistantHistoryPayload | null> {
    const [conversation, memory] = await Promise.all([
      UserAssistantConversationModel.findOne({ userId, conversationId })
        .lean(false)
        .exec(),
      this.getMemory(userId),
    ]);

    if (!conversation) return null;

    return {
      conversationId: conversation.conversationId,
      sessionTitle: conversation.sessionTitle,
      messages: this.mapMessages(conversation.messages || []),
      memory: memory ? this.mapMemory(memory) : null,
      updatedAt: conversation.updatedAt?.toISOString(),
    };
  }

  async updateConversation(
    userId: string,
    conversationId: string,
    updates: { sessionTitle?: string; pinned?: boolean; archived?: boolean }
  ): Promise<ConversationSummary | null> {
    const setFields: Record<string, unknown> = {};
    if (typeof updates.sessionTitle === 'string') {
      setFields.sessionTitle = updates.sessionTitle.trim().slice(0, 120);
    }
    if (typeof updates.pinned === 'boolean') {
      setFields.pinned = updates.pinned;
    }
    if (typeof updates.archived === 'boolean') {
      setFields.archived = updates.archived;
    }

    if (Object.keys(setFields).length === 0) return null;

    const conversation = await UserAssistantConversationModel.findOneAndUpdate(
      { userId, conversationId },
      { $set: setFields },
      { new: true }
    )
      .select('conversationId sessionTitle lastUsedAt pinned archived messages')
      .lean()
      .exec();

    if (!conversation) return null;

    return {
      conversationId: conversation.conversationId,
      sessionTitle: conversation.sessionTitle || 'Conversación',
      lastUsedAt: new Date(conversation.lastUsedAt).toISOString(),
      pinned: conversation.pinned || false,
      archived: conversation.archived || false,
      messageCount: conversation.messages?.length || 0,
      lastMessage: conversation.messages?.length
        ? conversation.messages[conversation.messages.length - 1].content?.slice(0, 120)
        : undefined,
    };
  }

  async deleteConversation(
    userId: string,
    conversationId: string
  ): Promise<boolean> {
    const result = await UserAssistantConversationModel.deleteOne({
      userId,
      conversationId,
    }).exec();
    return (result.deletedCount || 0) > 0;
  }

  async trackMessageFeedback(
    userId: string,
    conversationId: string,
    messageIndex: number,
    rating: 'positive' | 'negative'
  ): Promise<void> {
    const conversation = await UserAssistantConversationModel.findOne({
      userId,
      conversationId,
    })
      .lean(false)
      .exec();

    if (!conversation) return;

    const msg = conversation.messages?.[messageIndex];
    if (!msg || msg.role !== 'assistant') return;

    await UserAssistantConversationModel.updateOne(
      { userId, conversationId },
      {
        $set: {
          [`messages.${messageIndex}.feedback`]: {
            rating,
            createdAt: new Date(),
          },
        },
      }
    ).exec();
  }

  async createProgramReminder(
    userId: string,
    recommendation: {
      title: string;
      type?: string;
      channel?: string;
      platform?: string;
      startTime?: string;
    }
  ): Promise<boolean> {
    const title = String(recommendation.title || '').trim();
    if (!title) return false;

    const where = recommendation.channel
      ? `en ${recommendation.channel}`
      : recommendation.platform
        ? `en ${recommendation.platform}`
        : '';

    await new UserNotificationModel({
      recipientId: new mongoose.Types.ObjectId(userId),
      type: 'recommendation',
      title: `📺 ${title} empieza pronto`,
      description: `Tu programa ${where ? where + ' ' : ''}comienza a las ${recommendation.startTime || ''}. ¡No te lo pierdas!`.trim(),
      entityType: 'program',
      entityId: title,
      payload: {
        source: 'ai_reminder',
        programTitle: title,
        channel: recommendation.channel,
        platform: recommendation.platform,
        startTime: recommendation.startTime,
      },
    }).save();

    return true;
  }

  async saveCommunityPreference(input: {
    userId: string;
    preferredAutonomousCommunity?: string;
    autonomicOptIn?: boolean | 'unknown';
  }): Promise<void> {
    const memory = await this.ensureMemory(input.userId);

    if (typeof input.preferredAutonomousCommunity !== 'undefined') {
      memory.preferredAutonomousCommunity = String(
        input.preferredAutonomousCommunity || ''
      ).trim() || undefined;
    }

    if (typeof input.autonomicOptIn !== 'undefined') {
      memory.autonomicOptIn = input.autonomicOptIn;
    }

    memory.lastCommunityConfirmationAt = new Date();
    await memory.save();
  }

  async getHistory(
    userId: string,
    conversationId?: string
  ): Promise<AssistantHistoryPayload> {
    const [conversation, memory] = await Promise.all([
      this.findConversation(userId, conversationId),
      this.getMemory(userId),
    ]);

    return {
      conversationId: conversation?.conversationId || null,
      sessionTitle: conversation?.sessionTitle,
      messages: this.mapMessages(conversation?.messages || []),
      memory: memory ? this.mapMemory(memory) : null,
      updatedAt: conversation?.updatedAt?.toISOString(),
    };
  }

  async saveChatTurn(input: {
    userId: string;
    conversationId?: string;
    userMessage: string;
    assistantResponse: ChatbotResponse;
  }): Promise<{ conversationId: string; memory: AssistantMemorySnapshot }> {
    const now = new Date();
    const conversation =
      (await this.findConversation(input.userId, input.conversationId)) ||
      new UserAssistantConversationModel({
        userId: input.userId,
        conversationId: input.conversationId || randomUUID(),
        sessionTitle: this.buildSessionTitle(input.userMessage),
        messages: [],
      });

    if (!conversation.sessionTitle) {
      conversation.sessionTitle = this.buildSessionTitle(input.userMessage);
    }

    conversation.messages = [
      ...(conversation.messages || []).slice(-(MAX_STORED_MESSAGES - 2)),
      {
        role: 'user',
        content: input.userMessage,
        createdAt: now,
      },
      {
        role: 'assistant',
        content: input.assistantResponse.text,
        createdAt: now,
        recommendations: input.assistantResponse.recommendations || [],
        moreRecommendations: input.assistantResponse.moreRecommendations || [],
        followUpSuggestions: input.assistantResponse.followUpSuggestions || [],
        queryContext: input.assistantResponse.queryContext,
      },
    ];
    conversation.lastUsedAt = now;
    await conversation.save();

    const memory = await this.updateMemoryFromTurn(
      input.userId,
      input.userMessage,
      input.assistantResponse
    );

    return {
      conversationId: conversation.conversationId,
      memory,
    };
  }

  async saveClientMessages(input: {
    userId: string;
    conversationId?: string;
    messages: ChatbotMessage[];
  }): Promise<string> {
    const conversation =
      (await this.findConversation(input.userId, input.conversationId)) ||
      new UserAssistantConversationModel({
        userId: input.userId,
        conversationId: input.conversationId || randomUUID(),
        sessionTitle: this.buildSessionTitle(
          input.messages.find((message) => message.role === 'user')?.content || ''
        ),
        messages: [],
      });

    conversation.messages = input.messages
      .filter((message) => String(message.content || '').trim())
      .slice(-MAX_STORED_MESSAGES)
      .map((message) => ({
        role: message.role,
        content: String(message.content || '').trim(),
        createdAt: new Date(),
      }));
    conversation.lastUsedAt = new Date();
    await conversation.save();

    return conversation.conversationId;
  }

  async trackRecommendationAction(
    input: TrackAssistantActionInput
  ): Promise<AssistantMemorySnapshot> {
    const memory = await this.ensureMemory(input.userId);
    const title = String(input.recommendation.title || '').trim();
    const platform = String(input.recommendation.platform || '').trim();

    if (input.action !== 'ignore_recommendation') {
      memory.favoriteFranchisesOrTitles = this.pushUnique(
        memory.favoriteFranchisesOrTitles,
        title,
        16
      );
    }
    memory.recentTopics = this.pushUnique(
      memory.recentTopics,
      `${input.action}:${title}`,
      18
    );
    if (platform) {
      if (input.action === 'ignore_recommendation') {
        memory.avoidedPlatforms = this.pushUnique(
          memory.avoidedPlatforms,
          platform,
          12
        );
      } else {
        memory.preferredPlatforms = this.pushUnique(
          memory.preferredPlatforms,
          platform,
          12
        );
      }
    }
    if (title && input.action === 'ignore_recommendation') {
      memory.negativeSignals = this.pushUnique(
        memory.negativeSignals,
        `evitar ${title}`,
        18
      );
    }
    await memory.save();
    return this.mapMemory(memory);
  }

  async clearHistory(userId: string, conversationId?: string): Promise<boolean> {
    const conversation = await this.findConversation(userId, conversationId);
    if (!conversation) {
      return false;
    }

    await UserAssistantConversationModel.deleteOne({
      userId,
      conversationId: conversation.conversationId,
    }).exec();
    return true;
  }

  async updateMemory(
    userId: string,
    updates: Record<string, string[]>
  ): Promise<AssistantMemorySnapshot> {
    const memory = await this.ensureMemory(userId);

    for (const [field, values] of Object.entries(updates)) {
      if (field in memory && Array.isArray(values)) {
        (memory as any)[field] = values;
      }
    }

    await memory.save();
    return this.mapMemory(memory);
  }

  async syncFromProfile(
    userId: string,
    genres: string[],
    platforms: string[]
  ): Promise<void> {
    const memory = await this.ensureMemory(userId);
    if (genres.length > 0) {
      memory.likedGenres = genres.slice(0, 10);
    }
    if (platforms.length > 0) {
      memory.preferredPlatforms = platforms.slice(0, 10);
    }
    await memory.save();
  }

  private async updateMemoryFromTurn(
    userId: string,
    userMessage: string,
    assistantResponse: ChatbotResponse
  ): Promise<AssistantMemorySnapshot> {
    const memory = await this.ensureMemory(userId);
    const extracted = this.extractSignals(userMessage);

    memory.likedGenres = this.mergeValues(
      memory.likedGenres,
      extracted.likedGenres,
      10
    );
    memory.dislikedGenres = this.mergeValues(
      memory.dislikedGenres,
      extracted.dislikedGenres,
      10
    );
    memory.preferredPlatforms = this.mergeValues(
      memory.preferredPlatforms,
      extracted.preferredPlatforms,
      10
    );
    memory.avoidedPlatforms = this.mergeValues(
      memory.avoidedPlatforms,
      extracted.avoidedPlatforms,
      10
    );
    memory.preferredDurations = this.mergeValues(
      memory.preferredDurations,
      extracted.preferredDurations,
      6
    );
    memory.preferredViewingContexts = this.mergeValues(
      memory.preferredViewingContexts,
      extracted.preferredViewingContexts,
      6
    );
    memory.favoriteFranchisesOrTitles = this.mergeValues(
      memory.favoriteFranchisesOrTitles,
      extracted.favoriteFranchisesOrTitles,
      16
    );
    memory.negativeSignals = this.mergeValues(
      memory.negativeSignals,
      extracted.negativeSignals,
      16
    );
    if (typeof extracted.autonomicOptIn !== 'undefined') {
      memory.autonomicOptIn = extracted.autonomicOptIn;
      memory.lastCommunityConfirmationAt = new Date();
    }
    if (extracted.preferredAutonomousCommunity) {
      memory.preferredAutonomousCommunity =
        extracted.preferredAutonomousCommunity;
      memory.autonomicOptIn = true;
      memory.lastCommunityConfirmationAt = new Date();
    }
    memory.recentTopics = this.pushUnique(
      memory.recentTopics,
      this.normalizeTopic(userMessage),
      18
    );

    (assistantResponse.recommendations || []).forEach((recommendation) => {
      memory.favoriteFranchisesOrTitles = this.pushUnique(
        memory.favoriteFranchisesOrTitles,
        recommendation.title,
        16
      );
      if (recommendation.platform) {
        memory.preferredPlatforms = this.pushUnique(
          memory.preferredPlatforms,
          recommendation.platform,
          10
        );
      }
    });

    await memory.save();
    return this.mapMemory(memory);
  }

  private extractSignals(text: string): {
    likedGenres: string[];
    dislikedGenres: string[];
    preferredPlatforms: string[];
    avoidedPlatforms: string[];
    preferredDurations: string[];
    preferredViewingContexts: string[];
    favoriteFranchisesOrTitles: string[];
    negativeSignals: string[];
    preferredAutonomousCommunity?: string;
    autonomicOptIn?: boolean | 'unknown';
  } {
    const normalized = this.normalize(text);
    const likedGenres: string[] = [];
    const dislikedGenres: string[] = [];
    const preferredPlatforms: string[] = [];
    const avoidedPlatforms: string[] = [];
    const preferredDurations: string[] = [];
    const preferredViewingContexts: string[] = [];
    const favoriteFranchisesOrTitles = this.extractFavoriteReferences(text);
    const negativeSignals: string[] = [];
    const preferredAutonomousCommunity =
      this.extractAutonomousCommunity(normalized);
    const autonomicOptIn = this.extractAutonomicPreference(normalized);

    KNOWN_GENRES.forEach((genre) => {
      const token = this.normalize(genre);
      if (!normalized.includes(token)) {
        return;
      }

      if (this.isNegativeMention(normalized, token)) {
        dislikedGenres.push(genre);
        negativeSignals.push(`sin ${genre}`);
      } else {
        likedGenres.push(genre);
      }
    });

    KNOWN_PLATFORMS.forEach((platform) => {
      const token = this.normalize(platform);
      if (!normalized.includes(token)) {
        return;
      }

      if (this.isNegativeMention(normalized, token)) {
        avoidedPlatforms.push(platform);
        negativeSignals.push(`evitar ${platform}`);
      } else {
        preferredPlatforms.push(platform);
      }
    });

    if (/algo corto|corta|corto|episodios? cortos?|30 min/.test(normalized)) {
      preferredDurations.push('corto');
    }
    if (/larga|largo|peli larga|peliculas largas|películas largas/.test(normalized)) {
      preferredDurations.push('largo');
    }

    if (/familia|familiar|con ninos|con niños/.test(normalized)) {
      preferredViewingContexts.push('familia');
    }
    if (/pareja|con mi pareja|romantica|romántica/.test(normalized)) {
      preferredViewingContexts.push('pareja');
    }
    if (/solo|a solas|yo solo|para mi/.test(normalized)) {
      preferredViewingContexts.push('solo');
    }
    if (/amigos|con amigos|plan de grupo/.test(normalized)) {
      preferredViewingContexts.push('amigos');
    }

    if (/\brealit(?:y|ies)\b/.test(normalized) && this.isNegativeMention(normalized, 'realit')) {
      negativeSignals.push('sin realities');
    }

    return {
      likedGenres,
      dislikedGenres,
      preferredPlatforms,
      avoidedPlatforms,
      preferredDurations,
      preferredViewingContexts,
      favoriteFranchisesOrTitles,
      negativeSignals,
      preferredAutonomousCommunity,
      autonomicOptIn,
    };
  }

  private isNegativeMention(normalizedText: string, token: string): boolean {
    return NEGATIVE_TOKENS.some((prefix) =>
      normalizedText.includes(`${prefix}${token}`)
    );
  }

  private async findConversation(
    userId: string,
    conversationId?: string
  ): Promise<IUserAssistantConversationDocument | null> {
    if (conversationId) {
      return UserAssistantConversationModel.findOne({
        userId,
        conversationId,
      })
        .lean(false)
        .exec();
    }

    return UserAssistantConversationModel.findOne({ userId })
      .sort({ lastUsedAt: -1 })
      .lean(false)
      .exec();
  }

  async getMemorySnapshot(userId: string): Promise<AssistantMemorySnapshot | null> {
    const memory = await this.getMemory(userId);
    return memory ? this.mapMemory(memory) : null;
  }

  private async getMemory(
    userId: string
  ): Promise<IUserAssistantMemoryDocument | null> {
    return UserAssistantMemoryModel.findOne({ userId }).lean(false).exec();
  }

  private async ensureMemory(
    userId: string
  ): Promise<IUserAssistantMemoryDocument> {
    const existing = await this.getMemory(userId);
    if (existing) {
      return existing;
    }

    const created = new UserAssistantMemoryModel({
      userId,
      likedGenres: [],
      dislikedGenres: [],
      preferredPlatforms: [],
      avoidedPlatforms: [],
      preferredDurations: [],
      preferredViewingContexts: [],
      favoriteFranchisesOrTitles: [],
      recentTopics: [],
      negativeSignals: [],
      autonomicOptIn: 'unknown',
    });
    await created.save();
    return created;
  }

  private mapMessages(
    messages: IUserAssistantConversationDocument['messages']
  ): AssistantHistoryMessage[] {
    return (messages || []).map((message) => ({
      role: message.role,
      content: message.content,
      createdAt: new Date(message.createdAt).toISOString(),
      recommendations: (message.recommendations || []).map((recommendation) => ({
        ...recommendation,
        reason: recommendation.reason || 'Encaja con tus gustos.',
        actions: {
          canOpenDetail: recommendation.actions?.canOpenDetail !== false,
          canSave: recommendation.actions?.canSave !== false,
          canTrack: recommendation.actions?.canTrack !== false,
        },
        badges: recommendation.badges || [],
      })),
      moreRecommendations: (message.moreRecommendations || []).map((recommendation) => ({
        ...recommendation,
        reason: recommendation.reason || 'Encaja con tus gustos.',
        actions: {
          canOpenDetail: recommendation.actions?.canOpenDetail !== false,
          canSave: recommendation.actions?.canSave !== false,
          canTrack: recommendation.actions?.canTrack !== false,
        },
        badges: recommendation.badges || [],
      })),
      followUpSuggestions: message.followUpSuggestions || [],
      queryContext: message.queryContext
        ? {
          mode: message.queryContext.mode || 'general',
          requestedTypes: message.queryContext.requestedTypes || [],
          totalMatches: Number(message.queryContext.totalMatches || 0),
          primaryMatches: Number(message.queryContext.primaryMatches || 0),
          shownCount: Number(message.queryContext.shownCount || 0),
          hasMore: Boolean(message.queryContext.hasMore),
            answerWindowLabel: String(message.queryContext.answerWindowLabel || '').trim(),
            hasAutonomicMatches: Boolean(
              message.queryContext.hasAutonomicMatches
            ),
            autonomicPromptRequired: Boolean(
              message.queryContext.autonomicPromptRequired
            ),
            savedAutonomousCommunity: String(
              message.queryContext.savedAutonomousCommunity || ''
            ).trim() || undefined,
          }
        : undefined,
      feedback: message.feedback?.rating
        ? { rating: message.feedback.rating }
        : undefined,
    }));
  }

  private mapMemory(
    memory: IUserAssistantMemoryDocument
  ): AssistantMemorySnapshot {
    return {
      likedGenres: memory.likedGenres || [],
      dislikedGenres: memory.dislikedGenres || [],
      preferredPlatforms: memory.preferredPlatforms || [],
      avoidedPlatforms: memory.avoidedPlatforms || [],
      favoriteFranchisesOrTitles: memory.favoriteFranchisesOrTitles || [],
      preferredDurations: memory.preferredDurations || [],
      preferredViewingContexts: memory.preferredViewingContexts || [],
      recentTopics: memory.recentTopics || [],
      negativeSignals: memory.negativeSignals || [],
      preferredAutonomousCommunity: memory.preferredAutonomousCommunity || undefined,
      autonomicOptIn:
        typeof memory.autonomicOptIn === 'undefined'
          ? 'unknown'
          : memory.autonomicOptIn,
      lastCommunityConfirmationAt:
        memory.lastCommunityConfirmationAt?.toISOString(),
      updatedAt: memory.updatedAt?.toISOString(),
    };
  }

  private buildSessionTitle(content: string): string {
    const safe = String(content || '').trim();
    if (!safe) {
      return 'Conversación';
    }

    return safe.slice(0, 72);
  }

  private normalize(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private normalizeTopic(value: string): string {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 96);
  }

  private extractFavoriteReferences(value: string): string[] {
    const safeValue = String(value || '').trim();
    if (!safeValue) {
      return [];
    }

    const patterns = [
      /me encant[oó]\s+(.+)$/i,
      /me gust[oó]\s+mucho\s+(.+)$/i,
      /me gust[oó]\s+(.+)$/i,
      /quiero algo tipo\s+(.+)$/i,
      /algo tipo\s+(.+)$/i,
      /(.+)\s+es muy mi rollo$/i,
      /soy muy de\s+(.+)$/i,
    ];

    for (const pattern of patterns) {
      const match = safeValue.match(pattern);
      const extracted = match?.[1]?.trim();
      if (!extracted) {
        continue;
      }

      const cleaned = extracted
        .replace(/^[“"'¿¡\s]+|[”"'?!.,\s]+$/g, '')
        .trim()
        .slice(0, 80);

      if (cleaned.length >= 2) {
        return [cleaned];
      }
    }

    return [];
  }

  private mergeValues(
    existing: string[],
    incoming: string[],
    limit: number
  ): string[] {
    return incoming.reduce(
      (accumulator, value) => this.pushUnique(accumulator, value, limit),
      [...(existing || [])]
    );
  }

  private pushUnique(values: string[], value: string, limit: number): string[] {
    const safeValue = String(value || '').trim();
    if (!safeValue) {
      return [...values];
    }

    const filtered = values.filter(
      (entry) => this.normalize(entry) !== this.normalize(safeValue)
    );
    return [safeValue, ...filtered].slice(0, limit);
  }

  private extractAutonomousCommunity(normalizedText: string): string | undefined {
    const match = AUTONOMOUS_COMMUNITIES.find((community) =>
      community.aliases.some((alias) => normalizedText.includes(this.normalize(alias)))
    );
    return match?.canonical;
  }

  private extractAutonomicPreference(
    normalizedText: string
  ): boolean | 'unknown' | undefined {
    if (
      /no incluir autonomic|sin autonomic|no auton[oó]mic|no quiero autonomic/.test(
        normalizedText
      )
    ) {
      return false;
    }

    if (
      /autonomic/.test(normalizedText) &&
      /si |sí |usa|incluye|quiero|muestrame|muéstrame/.test(normalizedText)
    ) {
      return true;
    }

    return undefined;
  }
}
