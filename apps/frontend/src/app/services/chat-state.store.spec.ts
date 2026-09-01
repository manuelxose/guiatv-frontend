import { ChatStateStore, ChatMessageWithState } from './chat-state.store';
import { ChatConversation, ChatMessage, UserFriend } from '../interfaces/user.interface';

function user(id: string, name = id): UserFriend {
  return {
    id,
    name,
    username: id,
    avatar: '',
    isOnline: false,
    lastActivity: '',
    favoriteGenres: [],
    following: false,
  };
}

function conversation(id: string, participants: UserFriend[]): ChatConversation {
  return {
    id,
    participants,
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
    isGroup: participants.length > 2,
  };
}

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'u2',
    text: 'hola',
    type: 'text',
    createdAt: new Date().toISOString(),
    readBy: [],
    ...overrides,
  };
}

describe('ChatStateStore', () => {
  let store: ChatStateStore;

  beforeEach(() => {
    store = new ChatStateStore();
    store.setCurrentUserId('me');
  });

  it('applies a presence snapshot atomically and excludes the current user', () => {
    store.applyPresenceSnapshot(['me', 'u1', 'u2'], 3);
    let count = 0;
    store.getConnectedCount().subscribe((value) => (count = value));
    expect(count).toBe(3);

    store.hydrateOnlineUsers([user('u1'), user('u2')]);
    let online: UserFriend[] = [];
    store.getOnlineUsers().subscribe((value) => (online = value));
    expect(online.map((u) => u.id)).toEqual(['u1', 'u2']);
    expect(online.every((u) => u.isOnline)).toBe(true);
  });

  it('applies presence deltas and reports unknown user ids for hydration', () => {
    const unknown = store.applyPresenceDelta('u1', true, 1);
    expect(unknown).toEqual(['u1']);

    store.hydrateOnlineUsers([user('u1')]);
    const known = store.applyPresenceDelta('u2', true, 2);
    expect(known).toEqual(['u2']);

    // u2 has no metadata yet: the list only renders users we can display.
    let online: UserFriend[] = [];
    store.getOnlineUsers().subscribe((value) => (online = value));
    expect(online.map((u) => u.id)).toEqual(['u1']);

    store.hydrateOnlineUsers([user('u2')]);
    expect(online.map((u) => u.id)).toEqual(['u1', 'u2']);

    store.applyPresenceDelta('u1', false, 1);
    expect(online.map((u) => u.id)).toEqual(['u2']);
    let count = 0;
    store.getConnectedCount().subscribe((value) => (count = value));
    expect(count).toBe(1);
  });

  it('overlays presence onto conversation participants', () => {
    store.applyConversations([conversation('c1', [user('me'), user('u1')])]);
    let convs: ChatConversation[] = [];
    store.getConversations().subscribe((value) => (convs = value));
    expect(convs[0].participants.find((p) => p.id === 'u1')!.isOnline).toBe(false);

    store.applyPresenceDelta('u1', true, 1);
    expect(convs[0].participants.find((p) => p.id === 'u1')!.isOnline).toBe(true);

    store.applyPresenceDelta('u1', false, 0);
    expect(convs[0].participants.find((p) => p.id === 'u1')!.isOnline).toBe(false);
  });

  it('deduplicates incoming messages by id and clientMessageId', () => {
    store.applyConversations([conversation('c1', [user('me'), user('u2')])]);
    const first = message({ id: 'm1', clientMessageId: 'c1', senderId: 'u2' });
    expect(store.upsertMessage('c1', first)).toBe(false);
    expect(store.upsertMessage('c1', first)).toBe(true);

    const sameClientIdOtherId = message({ id: 'm2', clientMessageId: 'c1' });
    expect(store.upsertMessage('c1', sameClientIdOtherId)).toBe(true);

    let messages: ChatMessage[] = [];
    store.getMessages('c1').subscribe((value) => (messages = value));
    expect(messages.length).toBe(1);
  });

  it('bumps unread only for non-active, non-own incoming messages', () => {
    store.applyConversations([conversation('c1', [user('me'), user('u2')])]);

    // Not active: unread should bump.
    store.upsertMessage('c1', message({ id: 'm1', senderId: 'u2' }));
    let convs = store.getConversationsValue();
    expect(convs[0].unreadCount).toBe(1);

    // Own message: never bumps.
    store.upsertMessage('c1', message({ id: 'm2', senderId: 'me' }));
    convs = store.getConversationsValue();
    expect(convs[0].unreadCount).toBe(1);

    // Active conversation: no bump.
    store.setActiveConversation('c1');
    store.upsertMessage('c1', message({ id: 'm3', senderId: 'u2' }));
    convs = store.getConversationsValue();
    expect(convs[0].unreadCount).toBe(1);
  });

  it('updates conversation preview and reorders the list on new messages', () => {
    const older = conversation('c-old', [user('me'), user('u2')]);
    older.updatedAt = '2026-01-01T00:00:00.000Z';
    const newer = conversation('c-new', [user('me'), user('u3')]);
    newer.updatedAt = '2026-01-02T00:00:00.000Z';
    store.applyConversations([older, newer]);

    const incoming = message({ id: 'm9', conversationId: 'c-old', text: 'nuevo' });
    incoming.createdAt = '2026-02-01T00:00:00.000Z';
    store.upsertMessage('c-old', incoming);

    const convs = store.getConversationsValue();
    expect(convs[0].id).toBe('c-old');
    expect(convs[0].lastMessage?.text).toBe('nuevo');
  });

  it('merges read receipts and clears unread when the reader is me', () => {
    store.applyConversations([conversation('c1', [user('me'), user('u2')])]);
    store.upsertMessage('c1', message({ id: 'm1', senderId: 'me' }));

    store.applyReadUpdated('c1', 'u2', new Date().toISOString());
    let messages: ChatMessageWithState[] = [];
    store.getMessages('c1').subscribe((value) => (messages = value));
    expect(messages[0].readBy).toContain('u2');

    // Incoming message from u2 while the conversation is closed bumps unread.
    store.upsertMessage('c1', message({ id: 'm2', senderId: 'u2' }));
    expect(store.getConversationsValue()[0].unreadCount).toBe(1);

    // The read receipt from ourselves clears it locally.
    store.applyReadUpdated('c1', 'me');
    expect(store.getConversationsValue()[0].unreadCount).toBe(0);
  });

  it('expires typing indicators', () => {
    store.setTyping('c1', 'u2', true);
    let typing: { userId: string }[] = [];
    store.getTyping('c1').subscribe((value) => (typing = value));
    expect(typing.length).toBe(1);

    store.setTyping('c1', 'u2', false);
    expect(typing.length).toBe(0);

    store.setTyping('c1', 'u2', true);
    store.pruneExpiredTyping(Date.now() + 10_000);
    expect(typing.length).toBe(0);
  });

  it('preserves optimistic rows across server snapshot merges', () => {
    const server = [message({ id: 'm1', senderId: 'u2' })];
    store.applyServerMessages('c1', server);

    store.addPendingMessage('c1', {
      clientMessageId: 'pending-1',
      text: 'optimista',
      type: 'text',
      senderId: 'me',
    });
    let messages: ChatMessageWithState[] = [];
    store.getMessages('c1').subscribe((value) => (messages = value));
    expect(messages.length).toBe(2);

    // A second server snapshot must not drop the optimistic row.
    store.applyServerMessages('c1', server);
    expect(messages.length).toBe(2);

    // Server confirmation replaces the optimistic row (same clientMessageId).
    store.upsertMessage('c1', message({ id: 'm2', clientMessageId: 'pending-1', senderId: 'me' }));
    expect(messages.length).toBe(2);
    expect(messages.some((m) => m.pending)).toBe(false);
  });

  it('resets all state', () => {
    store.applyPresenceSnapshot(['u1'], 1);
    store.applyConversations([conversation('c1', [user('me')])]);
    store.reset();
    expect(store.getConversationsValue().length).toBe(0);
    let count = -1;
    store.getConnectedCount().subscribe((value) => (count = value));
    expect(count).toBe(0);
  });
});
