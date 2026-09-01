import { TestBed, fakeAsync, flush, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { ChatService, CHAT_SOCKET_FACTORY } from './chat.service';
import { ChatStateStore } from './chat-state.store';
import { UserService } from './user.service';
import { ChatConversation, UserFriend } from '../interfaces/user.interface';

type EventHandler = (...args: any[]) => void;

class FakeSocket {
  connected = false;
  handlers = new Map<string, EventHandler[]>();
  sent = new Map<string, unknown[]>();
  constructor(public readonly options: any) {}
  on(event: string, handler: EventHandler): this {
    const list = this.handlers.get(event) || [];
    list.push(handler);
    this.handlers.set(event, list);
    return this;
  }
  emit(event: string, payload: unknown): this {
    const list = this.sent.get(event) || [];
    list.push(payload);
    this.sent.set(event, list);
    return this;
  }
  trigger(event: string, ...args: any[]): void {
    if (event === 'disconnect') {
      this.connected = false;
    }
    if (event === 'connect') {
      this.connected = true;
    }
    for (const handler of this.handlers.get(event) || []) {
      handler(...args);
    }
  }
  connect(): this {
    this.connected = true;
    this.trigger('connect');
    return this;
  }
  disconnect(): this {
    this.connected = false;
    this.trigger('disconnect', 'io client disconnect');
    return this;
  }
  removeAllListeners(): void {
    this.handlers.clear();
  }
}

function userFriend(id: string, name = id): UserFriend {
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

function convFixture(id: string, unread = 0): ChatConversation {
  return {
    id,
    participants: [userFriend('me'), userFriend('u2')],
    unreadCount: unread,
    updatedAt: new Date().toISOString(),
    isGroup: false,
  };
}

describe('ChatService', () => {
  let http: HttpTestingController;
  let service: ChatService;
  let store: ChatStateStore;
  let fakeIo: { sockets: FakeSocket[] };
  let authenticated$: BehaviorSubject<boolean>;
  let profile$: BehaviorSubject<any>;
  let userServiceStub: any;

  const flushChatHttp = (conversations: ChatConversation[] = []) => {
    try {
      http.expectOne('/v2/chat/conversations').flush({
        success: true,
        data: { conversations },
      });
    } catch {
      // no pending request
    }
    try {
      http.expectOne('/v2/chat/online-users').flush({
        success: true,
        data: { users: [], onlineUserIds: [], connectedUsersNow: 0 },
      });
    } catch {
      // no pending request
    }
  };

  beforeEach(() => {
    authenticated$ = new BehaviorSubject<boolean>(false);
    profile$ = new BehaviorSubject<any>({ id: 'me', name: 'Yo' });
    userServiceStub = {
      isAuthenticated$: authenticated$.asObservable(),
      getProfile: () => profile$.asObservable(),
      fetchUnreadNotificationsCount: () => of(0),
      fetchNotifications: () => of([]),
    };
    localStorage.clear();
    localStorage.setItem('gtv_id_token', 'token-a');
    fakeIo = { sockets: [] };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: UserService, useValue: userServiceStub },
        {
          provide: CHAT_SOCKET_FACTORY,
          useValue: () =>
            Promise.resolve({
              io: (url: string, options: any) => {
                const socket = new FakeSocket(options);
                fakeIo.sockets.push(socket);
                return socket as any;
              },
            } as any),
        },
      ],
    });

    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(ChatStateStore);
    service = TestBed.inject(ChatService);
  });

  afterEach(() => {
    if (authenticated$) {
      authenticated$.next(false);
    }
    http.verify();
  });

  it('connects immediately on authentication with reconnection enabled and websocket first', fakeAsync(() => {
    authenticated$.next(true);
    flush();

    expect(fakeIo.sockets.length).toBe(1);
    const options = fakeIo.sockets[0].options;
    expect(options.reconnection).toBe(true);
    expect(options.reconnectionAttempts).toBe(Infinity);
    expect(options.transports[0]).toBe('websocket');
    expect(typeof options.auth).toBe('function');
    // No artificial delay: connection exists without advancing timers.
    flushChatHttp();
    discardPeriodicTasks();
  }));

  it('reconciles after connect and applies the presence snapshot', fakeAsync(() => {
    authenticated$.next(true);
    flush();
    flushChatHttp();

    fakeIo.sockets[0].connect();
    flush();
    // Reconnect reconciliation fires these two hydration calls.
    http.expectOne('/v2/chat/conversations').flush({
      success: true,
      data: { conversations: [convFixture('c1')] },
    });
    http.expectOne('/v2/chat/online-users').flush({
      success: true,
      data: {
        users: [userFriend('u1', 'Uno'), userFriend('u2', 'Dos')],
        onlineUserIds: ['u1', 'u2'],
        connectedUsersNow: 2,
      },
    });

    let mode = '';
    store.getRealtimeMode().subscribe((value) => (mode = value));
    expect(mode).toBe('connected');

    let count = -1;
    store.getConnectedCount().subscribe((value) => (count = value));
    expect(count).toBe(2);

    let online: UserFriend[] = [];
    store.getOnlineUsers().subscribe((value) => (online = value));
    expect(online.map((u) => u.id).sort()).toEqual(['u1', 'u2']);

    // Snapshot shrinks the live set atomically.
    fakeIo.sockets[0].trigger('chat:presence:snapshot', {
      onlineUserIds: ['u1'],
      onlineCount: 1,
    });
    expect(online.map((u) => u.id)).toEqual(['u1']);
    expect(count).toBe(1);

    // The snapshot schedules a bounded metadata hydration call.
    http.expectOne('/v2/chat/online-users').flush({
      success: true,
      data: {
        users: [userFriend('u1', 'Uno')],
        onlineUserIds: ['u1'],
        connectedUsersNow: 1,
      },
    });
    discardPeriodicTasks();
  }));

  it('applies presence deltas without relying on HTTP polling', fakeAsync(() => {
    authenticated$.next(true);
    flush();
    flushChatHttp();

    fakeIo.sockets[0].connect();
    flush();
    http.expectOne('/v2/chat/conversations').flush({
      success: true,
      data: { conversations: [convFixture('c1')] },
    });
    http.expectOne('/v2/chat/online-users').flush({
      success: true,
      data: {
        users: [userFriend('u1', 'Uno'), userFriend('u2', 'Dos')],
        onlineUserIds: ['u1', 'u2'],
        connectedUsersNow: 2,
      },
    });

    let online: UserFriend[] = [];
    store.getOnlineUsers().subscribe((value) => (online = value));
    expect(online.map((u) => u.id).sort()).toEqual(['u1', 'u2']);

    fakeIo.sockets[0].trigger('chat:presence', {
      userId: 'u1',
      isOnline: false,
      onlineCount: 1,
    });
    expect(online.map((u) => u.id)).toEqual(['u2']);

    fakeIo.sockets[0].trigger('chat:presence', {
      userId: 'u1',
      isOnline: true,
      onlineCount: 2,
    });
    expect(online.map((u) => u.id).sort()).toEqual(['u1', 'u2']);
    discardPeriodicTasks();
  }));

  it('updates the conversation locally when a realtime message arrives', fakeAsync(() => {
    authenticated$.next(true);
    flush();
    flushChatHttp();

    fakeIo.sockets[0].connect();
    flush();
    flushChatHttp([convFixture('c1')]);

    const incoming = {
      conversationId: 'c1',
      message: {
        id: 'm1',
        conversationId: 'c1',
        senderId: 'u2',
        clientMessageId: 'cm-1',
        text: 'hola',
        type: 'text',
        createdAt: new Date().toISOString(),
        readBy: [],
      },
    };

    expect(fakeIo.sockets.length).toBe(1);

    fakeIo.sockets[0].trigger('chat:message:new', incoming);
    flush();

    const convs = store.getConversationsValue();
    expect(convs[0].lastMessage?.text).toBe('hola');
    expect(convs[0].unreadCount).toBe(1);

    // Same message again: no duplicate, no extra unread.
    fakeIo.sockets[0].trigger('chat:message:new', incoming);
    flush();

    expect(store.getConversationsValue()[0].unreadCount).toBe(1);
    let messages: any[] = [];
    store.getMessages('c1').subscribe((value) => (messages = value));
    expect(messages.length).toBe(1);

    // No polling-based conversation refresh was triggered by the events.
    http.expectNone('/v2/chat/conversations');
    discardPeriodicTasks();
  }));

  it('emits a read marker when the active conversation receives a message', fakeAsync(() => {
    authenticated$.next(true);
    flush();
    flushChatHttp();

    fakeIo.sockets[0].connect();
    flush();
    flushChatHttp([convFixture('c1')]);

    service.setActiveConversation('c1');
    fakeIo.sockets[0].trigger('chat:message:new', {
      conversationId: 'c1',
      message: {
        id: 'm2',
        conversationId: 'c1',
        senderId: 'u2',
        text: 'activo',
        type: 'text',
        createdAt: new Date().toISOString(),
        readBy: [],
      },
    });
    flush();
    expect(store.getConversationsValue()[0].unreadCount).toBe(0);
    const reads = fakeIo.sockets[0].sent.get('chat:read') || [];
    // The socket emitted a read marker for the active conversation.
    expect(reads.length).toBeGreaterThan(0);
    discardPeriodicTasks();
  }));

  it('sends optimistically and reconciles with the server-confirmed message', fakeAsync(() => {
    authenticated$.next(true);
    flush();
    flushChatHttp();

    fakeIo.sockets[0].connect();
    flush();
    flushChatHttp([convFixture('c1')]);

    let messages: any[] = [];
    store.getMessages('c1').subscribe((value) => (messages = value));

    let confirmed: any = null;
    service.sendMessage('c1', 'hola').subscribe((message) => (confirmed = message));
    expect(messages.length).toBe(1);
    expect(messages[0].pending).toBe(true);

    const postReq = http.expectOne('/v2/chat/conversations/c1/messages');
    const clientMessageId = postReq.request.body.clientMessageId;
    expect(typeof clientMessageId).toBe('string');
    postReq.flush({
      success: true,
      data: {
        message: {
          id: 'srv-1',
          conversationId: 'c1',
          senderId: 'me',
          clientMessageId,
          text: 'hola',
          type: 'text',
          createdAt: new Date().toISOString(),
          readBy: ['me'],
        },
      },
    });
    flush();

    expect(confirmed.id).toBe('srv-1');
    expect(messages.length).toBe(1);
    expect(messages[0].pending).toBeUndefined();
    discardPeriodicTasks();
  }));

  it('marks the message failed when the POST fails', fakeAsync(() => {
    authenticated$.next(true);
    flush();
    flushChatHttp();

    fakeIo.sockets[0].connect();
    flush();
    flushChatHttp([convFixture('c1')]);

    let messages: any[] = [];
    store.getMessages('c1').subscribe((value) => (messages = value));

    service.sendMessage('c1', 'hola').subscribe();
    const postReq = http.expectOne('/v2/chat/conversations/c1/messages');
    postReq.flush(null, { status: 500, statusText: 'Server Error' });
    flush();

    expect(messages[0].failed).toBe(true);
    discardPeriodicTasks();
  }));

  it('enters reconnecting state and starts bounded fallback polling on disconnect', fakeAsync(() => {
    authenticated$.next(true);
    flush();
    flushChatHttp();

    fakeIo.sockets[0].connect();
    flush();
    flushChatHttp([convFixture('c1')]);

    let mode: string = '';
    store.getRealtimeMode().subscribe((value) => (mode = value));

    fakeIo.sockets[0].trigger('disconnect', 'transport close');
    expect(mode).toBe('reconnecting');

    tick(15_000);
    // Degraded polling is bounded HTTP traffic, not continuous socket churn.
    http.expectOne('/v2/chat/conversations').flush({
      success: true,
      data: { conversations: [] },
    });
    http.expectOne('/v2/chat/online-users').flush({
      success: true,
      data: { users: [], onlineUserIds: [], connectedUsersNow: 0 },
    });
    flush();

    // Socket recovers: fallback polling stops and reconciliation runs.
    fakeIo.sockets[0].connect();
    flush();
    flushChatHttp([convFixture('c1')]);
    expect(mode).toBe('connected');
    http.expectNone('/v2/chat/conversations');
    http.expectNone('/v2/chat/online-users');
    discardPeriodicTasks();
  }));

  it('returns to idle when the session ends (logout)', fakeAsync(() => {
    authenticated$.next(true);
    flush();
    flushChatHttp();

    fakeIo.sockets[0].connect();
    flush();
    flushChatHttp([]);

    let mode: string = '';
    store.getRealtimeMode().subscribe((value) => (mode = value));
    expect(mode).toBe('connected');

    authenticated$.next(false);
    flush();
    expect(mode).toBe('idle');
    expect(store.getConversationsValue().length).toBe(0);
    discardPeriodicTasks();
  }));
});
