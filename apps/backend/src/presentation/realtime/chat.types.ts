/**
 * Realtime chat event contract.
 *
 * These types define the payloads exchanged over Socket.IO between the
 * frontend ChatService and ChatSocketHub. The REST layer stays responsible
 * for hydration (history, metadata), Socket.IO for live state changes.
 */

/** Socket.IO server events (server -> client). */
export const SERVER_CHAT_EVENTS = {
  /** A new message persisted and broadcast to the target conversation room(s). */
  MESSAGE_NEW: 'chat:message:new',
  /** A conversation's summary changed (updatedAt moved, new last message). */
  CONVERSATION_UPDATE: 'chat:conversation:update',
  /** A user marked a conversation read. */
  READ_UPDATED: 'chat:read:updated',
  /** Presence delta: one user connected or disconnected. */
  PRESENCE: 'chat:presence',
  /** Presence snapshot: full online set, sent to the connecting socket. */
  PRESENCE_SNAPSHOT: 'chat:presence:snapshot',
  /** Typing indicator from another user. */
  TYPING: 'chat:typing',
  /** A new in-app notification for the recipient. */
  NOTIFICATION_NEW: 'notification:new',
} as const;

/** Socket.IO client events (client -> server). */
export const CLIENT_CHAT_EVENTS = {
  /** Client marks a conversation read. */
  READ: 'chat:read',
  /** Client reports typing start/stop for a conversation. */
  TYPING: 'chat:typing',
} as const;

export interface MessageNewPayload {
  conversationId: string;
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    clientMessageId?: string;
    text?: string;
    type: 'text' | 'image' | 'recommendation' | 'list';
    content?: unknown;
    createdAt: string;
    readBy: string[];
  };
}

export interface ConversationUpdatePayload {
  conversationId: string;
  updatedAt: string;
}

export interface ReadUpdatedPayload {
  conversationId: string;
  userId: string;
  readAt: string;
}

export interface PresenceDeltaPayload {
  userId: string;
  isOnline: boolean;
  onlineCount: number;
}

export interface PresenceSnapshotPayload {
  onlineUserIds: string[];
  onlineCount: number;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

/** Structured metrics exposed by ChatSocketHub for diagnostics. */
export interface RealtimeStats {
  activeSockets: number;
  onlineUsers: number;
  totalConnections: number;
  totalDisconnections: number;
  authFailures: number;
  rejectedSockets: number;
  messagesEmitted: number;
  presenceEventsEmitted: number;
  disconnectReasons: Record<string, number>;
  adapter: 'local' | 'redis';
  presenceStore: 'memory' | 'redis';
}
