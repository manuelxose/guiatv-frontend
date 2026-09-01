# Real-time chat architecture (Guiatv)

Last verified: 2026-09-01

## 1. Architecture

```
Angular client (ChatService + ChatStateStore)
  |
  | authenticated Socket.IO  (path: /v2/ws, WebSocket-first, polling fallback)
  v
ChatSocketHub (backend realtime gateway)
  |  user rooms (user:<id>)  +  general room (chat:general)
  |  presence, typing, read receipts, notifications
  +-> PresenceStore (in-memory or Redis)
  +-> Mongo (persistence happens in ChatController, not the hub)
```

- **REST** is responsible for: conversation hydration, message history/pagination,
  user metadata, recovery/reconciliation.
- **Socket.IO** is responsible for: `chat:message:new`, `chat:conversation:update`,
  `chat:presence`, `chat:presence:snapshot`, `chat:typing`, `chat:read:updated`,
  `notification:new`.

## 2. Event contract

Server → client (all payloads are plain objects; message contents are never logged):

| Event | Payload |
|---|---|
| `chat:presence:snapshot` | `{ onlineUserIds: string[], onlineCount: number }` — sent to the connecting socket |
| `chat:presence` | `{ userId, isOnline, onlineCount }` — broadcast on connect/disconnect deltas |
| `chat:message:new` | `{ conversationId, message }` — message: `{ id, conversationId, senderId, clientMessageId?, text?, type, content?, createdAt, readBy }` |
| `chat:conversation:update` | `{ conversationId, updatedAt }` |
| `chat:read:updated` | `{ conversationId, userId, readAt }` |
| `chat:typing` | `{ conversationId, userId, isTyping }` |
| `notification:new` | notification payload for the recipient |

Client → server:

| Event | Payload | Validation |
|---|---|---|
| `chat:typing` | `{ conversationId, isTyping }` | auth + conversation membership (DM) + server-side throttle (1.2s) |
| `chat:read` | `{ conversationId }` | auth + conversation membership (DM) |

Typed definitions live in `apps/backend/src/presentation/realtime/chat.types.ts`.

## 3. Presence model

**Online = the backend currently holds at least one authenticated socket for the
user.** Nothing else. Un-expired `AuthSession` rows are never used as presence.

- `PresenceStore` interface (`apps/backend/src/presentation/realtime/PresenceStore.ts`):
  `register / unregister / getOnlineUserIds / getOnlineCount / isUserOnline / getSocketCount / dispose`.
- `InMemoryPresenceStore`: default; correct for the single-instance deployment.
- `RedisPresenceStore`: distributed store (sets + per-node heartbeat + crash sweep);
  activates with `REALTIME_PRESENCE=redis`.
- A user is marked offline only when their **last** socket disconnects. Multiple
  tabs/devices are preserved.
- `/v2/chat/online-users` returns only live-connected users (excluding self and
  blocked users), loaded with metadata from Mongo, plus `onlineUserIds` and
  `connectedUsersNow`.

## 4. Frontend state

- `ChatStateStore` (`apps/frontend/src/app/services/chat-state.store.ts`) is the
  single normalized source of truth: conversations, presence set, online users,
  connected count, messages per conversation, typing, realtime mode.
- Socket events mutate the store directly. REST is used for hydration, metadata
  resolution, and post-reconnect reconciliation — never for per-event refreshes.
- Message deduplication is by `id` and `clientMessageId`. Sender-side optimistic
  rows (`pending`) are replaced by the server confirmation; failures surface as
  `failed` with a retry action.
- Unread counts, conversation previews and ordering update locally on
  `chat:message:new` / `chat:read:updated`. No `refreshConversations()` per event.

## 5. Connection lifecycle (frontend)

- The socket connects **immediately** when the user is authenticated (browser only).
  There is no activation gate and no artificial delay.
- Options: `transports: ['websocket', 'polling']`, `reconnection: true`,
  `reconnectionAttempts: Infinity`, `reconnectionDelay: 500ms`,
  `reconnectionDelayMax: 15s`, `randomizationFactor: 0.5`, `timeout: 10s`.
- Reconnection is infinite while the session is valid. `auth` is a dynamic
  callback so every (re)connect re-resolves the current access token; token
  refreshes (`gtv-auth-restored`) trigger a reconnect when disconnected.
- Mode state: `idle → connecting → connected ⇄ reconnecting → degraded`.
- Tab visibility and `online` browser events force a reconnect when the socket is
  down. Backend restarts are transparent (client auto-reconnects).
- On reconnect: conversations + online users are re-hydrated, the open
  conversation's messages are refetched, and `reconnected$` notifies components.

## 6. Fallback mode

If the socket cannot be established or is lost, the client marks realtime as
`degraded`/`reconnecting` and runs a **bounded** polling loop (15s) over the same
REST endpoints. Socket reconnection keeps trying in the background; polling stops
the moment the socket reconnects. Polling is never the normal path.

## 7. Typing & read receipts

- Client-side throttle (2.5s per conversation) + server-side throttle (1.2s per
  socket+conversation). Typing indicators auto-expire after 4s and are cleared
  server-side when the typer disconnects.
- Read receipts: `chat:read` persists `readBy` server-side and broadcasts
  `chat:read:updated` to the conversation's members. The reader's own unread is
  cleared locally and optimistically.

## 8. Security

- Socket authentication is mandatory: JWT verified against `AuthService.getSession`
  (user exists, not suspended). Unauthorized handshakes are rejected and counted.
- Rooms are server-controlled; clients can never subscribe to another user's room.
- DM typing/read events validate conversation membership server-side; DM message
  sending validates membership and blocked relationships (`ChatController`).
- Server-side typing throttle, payload caps (`maxHttpBufferSize` 1MB), id/count
  length checks; malformed payloads are dropped without crashing.
- Never log message contents or tokens; auth failures log address only.

## 9. Scaling model

- **Current deployment is a single Node instance** (systemd `guiatv-api`):
  in-memory presence + local adapter are correct.
- With Valkey available (`VALKEY_URL` in production), the distributed path is
  already implemented and switchable per-instance without code changes:
  - `REALTIME_ADAPTER=redis` → official `@socket.io/redis-adapter` (cross-node
    rooms/broadcast via pub/sub).
  - `REALTIME_PRESENCE=redis` → `RedisPresenceStore` (cross-node presence with
    per-node heartbeat + stale-node sweep; crash recovery prevents stuck-online
    users).
- Both degrade gracefully to the single-instance defaults if Redis is
  unavailable.

## 10. Reverse proxy requirements (Nginx)

`/v2/ws` must be matched before the generic `/v2/` API location (already
configured in `/etc/nginx/sites-enabled/guiatv.conf` with `location ^~ /v2/ws`)
and must include:

```
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;   # map in nginx.conf http{}
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_buffering off;
proxy_read_timeout 120s;   # socket.io pings every 25s keep it alive
```

No caching must apply to `/v2/ws` (the snippet has none). The API `/v2/`
location's 30s read timeout does not apply because `^~ /v2/ws` wins.

## 11. Observability

- `ChatSocketHub.getDiagnostics()` → `{ activeSockets, onlineUsers,
  totalConnections, totalDisconnections, authFailures, rejectedSockets,
  messagesEmitted, presenceEventsEmitted, disconnectReasons, adapter,
  presenceStore }`.
- Exposed in `GET /v2/health` (`realtime` block) and logged every 60s
  (`Realtime metrics` structured log line). No message contents, no tokens.

## 12. Tests

- Backend (`node --test`, `apps/backend/src/presentation/realtime/*.test.ts`):
  hub integration over real sockets (auth reject, snapshot, deltas, multi-socket,
  DM/general emission, typing membership+throttle+disconnect-clear, read
  membership, malformed payloads, disconnect reasons), presence store semantics,
  and Redis presence integration (runs with `TEST_REDIS_URL`).
- Frontend (Karma): `ChatStateStore` pure-state specs and `ChatService` specs with
  a fake socket engine (immediate connect, reconnect options, snapshot/delta
  handling, local conversation mutation without HTTP, dedupe, optimistic
  send/failure, read marker, fallback polling, logout).
- E2E: `e2e/specs/chat-realtime.spec.ts` (two real users; run with
  `E2E_CHAT_USER_A_TOKEN` / `E2E_CHAT_USER_B_TOKEN`).

## 13. Troubleshooting

| Symptom | Cause / check |
|---|---|
| Messages only appear after refresh | Socket not connected (network/proxy). Check the header status indicator and `/v2/health` `realtime.activeSockets`. |
| Users remain online after closing | Stale presence. With Redis presence, the heartbeat sweep (30s) removes crashed nodes. Confirm `REALTIME_PRESENCE` consistency across instances. |
| Socket remains on polling | WebSocket upgrade failing: verify the Nginx `/v2/ws` location and `$connection_upgrade` map. |
| 401 Unauthorized socket | Expired/invalid token: confirm the client refreshes tokens (`gtv-auth-restored`) and `auth` callback re-resolves the token. |
| WebSocket 400/502 through Nginx | Missing `Upgrade`/`Connection` headers or wrong `proxy_http_version`. |
| Works locally but not production | Proxy path (`/v2/ws`) or origin/CORS config; compare with section 10. |
| Duplicate messages | Check `clientMessageId` propagation end to end (POST body → stored → socket payload → store dedupe). |
| Unread badge wrong | The badge derives from locally-mutated conversation state; force `refreshConversations()` on reconnect reconciliation. |

## 14. Rollout checklist

1. Backend build + tests; frontend lint + tests; full `npm run build`.
2. Deploy (`bash deploy-guiatv.sh`), confirm nginx `/v2/ws` unchanged.
3. `curl /v2/health` → `realtime` block present.
4. Two browsers: open Personas, both show online, exchange messages <1s,
   close one browser → other shows offline within seconds.
5. Restart `guiatv-api` → clients reconnect automatically (watch the
   Reconnecting indicator resolve).
6. If scaling out later: set `REALTIME_ADAPTER=redis` and
   `REALTIME_PRESENCE=redis` on every instance sharing the same Valkey.
