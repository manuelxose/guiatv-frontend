export const ASSISTANT_MAX_MESSAGES = 24;
export const ASSISTANT_MAX_USER_MESSAGE_CHARS = 2_000;
export const ASSISTANT_MAX_ASSISTANT_MESSAGE_CHARS = 6_000;
export const ASSISTANT_MAX_TOTAL_MESSAGE_CHARS = 24_000;

export type AssistantContextKind =
  | 'global'
  | 'programme'
  | 'movie'
  | 'series'
  | 'channel'
  | 'football_match'
  | 'football_team'
  | 'football_competition';

export interface AssistantLaunchContext {
  kind: AssistantContextKind;
  entityId?: string;
  title?: string;
  channel?: string;
  kickoff?: string;
  competition?: string;
  homeTeam?: string;
  awayTeam?: string;
  broadcasters?: string[];
}

export interface AssistantRequestMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantRequestPayload {
  messages: AssistantRequestMessage[];
  conversationId?: string;
  context?: AssistantLaunchContext;
}

const CONTEXT_KINDS = new Set<AssistantContextKind>([
  'global',
  'programme',
  'movie',
  'series',
  'channel',
  'football_match',
  'football_team',
  'football_competition',
]);

export class AssistantRequestValidationError extends Error {}

function boundedString(
  value: unknown,
  field: string,
  maximumLength: number,
  required = false
): string | undefined {
  if (typeof value !== 'string') {
    if (required) throw new AssistantRequestValidationError(`${field} must be a string`);
    return undefined;
  }
  const normalized = value.trim();
  if (!normalized) {
    if (required) throw new AssistantRequestValidationError(`${field} is required`);
    return undefined;
  }
  if (normalized.length > maximumLength) {
    throw new AssistantRequestValidationError(`${field} exceeds maximum length ${maximumLength}`);
  }
  return normalized;
}

function parseContext(value: unknown): AssistantLaunchContext | undefined {
  if (typeof value === 'undefined' || value === null) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AssistantRequestValidationError('context must be an object');
  }
  const input = value as Record<string, unknown>;
  if (typeof input.kind !== 'string' || !CONTEXT_KINDS.has(input.kind as AssistantContextKind)) {
    throw new AssistantRequestValidationError('Unsupported context kind');
  }

  const broadcasters = typeof input.broadcasters === 'undefined'
    ? undefined
    : Array.isArray(input.broadcasters)
      ? input.broadcasters
          .map((entry) => boundedString(entry, 'context.broadcasters[]', 80))
          .filter((entry): entry is string => Boolean(entry))
          .slice(0, 8)
      : (() => { throw new AssistantRequestValidationError('context.broadcasters must be an array'); })();

  const context: AssistantLaunchContext = { kind: input.kind as AssistantContextKind };
  const optionalFields = {
    entityId: boundedString(input.entityId, 'context.entityId', 160),
    title: boundedString(input.title, 'context.title', 200),
    channel: boundedString(input.channel, 'context.channel', 100),
    kickoff: boundedString(input.kickoff, 'context.kickoff', 64),
    competition: boundedString(input.competition, 'context.competition', 120),
    homeTeam: boundedString(input.homeTeam, 'context.homeTeam', 120),
    awayTeam: boundedString(input.awayTeam, 'context.awayTeam', 120),
  };
  if (optionalFields.entityId) context.entityId = optionalFields.entityId;
  if (optionalFields.title) context.title = optionalFields.title;
  if (optionalFields.channel) context.channel = optionalFields.channel;
  if (optionalFields.kickoff) context.kickoff = optionalFields.kickoff;
  if (optionalFields.competition) context.competition = optionalFields.competition;
  if (optionalFields.homeTeam) context.homeTeam = optionalFields.homeTeam;
  if (optionalFields.awayTeam) context.awayTeam = optionalFields.awayTeam;
  if (broadcasters?.length) context.broadcasters = broadcasters;
  return context;
}

/** Validates and normalizes the untrusted HTTP body before orchestration. */
export function parseAssistantRequestPayload(value: unknown): AssistantRequestPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AssistantRequestValidationError('Request body must be an object');
  }
  const input = value as Record<string, unknown>;
  if (!Array.isArray(input.messages) || input.messages.length === 0) {
    throw new AssistantRequestValidationError('messages array is required');
  }
  if (input.messages.length > ASSISTANT_MAX_MESSAGES) {
    throw new AssistantRequestValidationError(`messages must contain at most ${ASSISTANT_MAX_MESSAGES} entries`);
  }

  let totalChars = 0;
  const messages = input.messages.map((entry, index): AssistantRequestMessage => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new AssistantRequestValidationError(`messages[${index}] must be an object`);
    }
    const message = entry as Record<string, unknown>;
    if (message.role !== 'user' && message.role !== 'assistant') {
      throw new AssistantRequestValidationError(`messages[${index}].role is invalid`);
    }
    const maximumLength = message.role === 'user'
      ? ASSISTANT_MAX_USER_MESSAGE_CHARS
      : ASSISTANT_MAX_ASSISTANT_MESSAGE_CHARS;
    const content = boundedString(
      message.content,
      `messages[${index}].content`,
      maximumLength,
      true
    ) as string;
    totalChars += content.length;
    return { role: message.role, content };
  });

  if (totalChars > ASSISTANT_MAX_TOTAL_MESSAGE_CHARS) {
    throw new AssistantRequestValidationError(
      `messages exceed maximum total length ${ASSISTANT_MAX_TOTAL_MESSAGE_CHARS}`
    );
  }

  const conversationId = boundedString(input.conversationId, 'conversationId', 160);
  if (conversationId && !/^[A-Za-z0-9:_-]+$/.test(conversationId)) {
    throw new AssistantRequestValidationError('conversationId contains invalid characters');
  }

  return {
    messages,
    conversationId,
    context: parseContext(input.context),
  };
}
