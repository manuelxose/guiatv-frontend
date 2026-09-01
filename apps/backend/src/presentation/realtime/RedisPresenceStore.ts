/**
 * Redis-backed presence store (Valkey-compatible).
 *
 * Activates with REALTIME_PRESENCE=redis and makes presence correct across
 * multiple backend instances:
 *
 *   gtv:chat:presence:socket:{socketId}   -> userId
 *   gtv:chat:presence:sockets:{userId}    -> SET socketIds
 *   gtv:chat:presence:online              -> SET userIds
 *   gtv:chat:presence:node:{nodeId}       -> SET socketIds owned by a node
 *   gtv:chat:presence:heartbeat:{nodeId}  -> SETEX, refreshed every 10s
 *
 * A periodic sweep removes sockets whose node heartbeat expired (crash
 * recovery), so users are never stuck "online" after a node dies.
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../../shared/utils/logger';
import { PresenceStore } from './PresenceStore';

const KEY_SOCKET = 'gtv:chat:presence:socket:';
const KEY_SOCKETS = 'gtv:chat:presence:sockets:';
const KEY_ONLINE = 'gtv:chat:presence:online';
const KEY_NODE = 'gtv:chat:presence:node:';
const KEY_HEARTBEAT = 'gtv:chat:presence:heartbeat:';
const SWEEP_LOCK_KEY = 'gtv:chat:presence:sweep-lock';

const HEARTBEAT_INTERVAL_MS = 10_000;
const HEARTBEAT_TTL_SECONDS = 30;
const SWEEP_INTERVAL_MS = 30_000;
const SWEEP_LOCK_TTL_SECONDS = 20;

export class RedisPresenceStore implements PresenceStore {
  private readonly client: RedisClientType;
  private readonly nodeId: string;
  private readonly keyPrefix: string;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private sweepTimer: ReturnType<typeof setInterval> | null = null;
  private connected = false;
  private disposed = false;

  constructor(
    redisUrl: string,
    nodeId?: string,
    options?: { connectTimeoutMs?: number; keyPrefix?: string }
  ) {
    this.nodeId =
      nodeId ||
      `${process.env.HOSTNAME || 'node'}-${process.pid}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
    this.keyPrefix = options?.keyPrefix || '';

    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (this.disposed) return new Error('Presence store disposed');
          if (retries > 50) {
            return new Error('Presence Redis max retries reached');
          }
          return Math.min(retries * 100, 5_000);
        },
        connectTimeout: options?.connectTimeoutMs || 10_000,
      },
    });

    this.client.on('error', (error: Error) => {
      this.connected = false;
      logger.error('Redis presence store error', error);
    });
    this.client.on('ready', () => {
      this.connected = true;
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.connected = true;
    await this.purgeNodeSockets();
    this.heartbeatTimer = setInterval(() => {
      void this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
    this.sweepTimer = setInterval(() => {
      void this.sweepStaleNodes();
    }, SWEEP_INTERVAL_MS);
    await this.sendHeartbeat();
    logger.info('Redis presence store connected', { nodeId: this.nodeId });
  }

  async register(userId: string, socketId: string): Promise<boolean> {
    try {
      if (!this.connected) return false;
      const results = await this.client
        .multi()
        .set(this.key(KEY_SOCKET + socketId), userId)
        .sAdd(this.key(KEY_SOCKETS + userId), socketId)
        .sAdd(this.key(KEY_NODE + this.nodeId), socketId)
        .exec();
      // Index 1 is SADD sockets:{userId}: 1 = first socket -> became online.
      const socketsAdded = Number(results?.[1] || 0);
      const becameOnline = socketsAdded === 1;
      if (becameOnline) {
        await this.client.sAdd(this.key(KEY_ONLINE), userId);
      }
      return becameOnline;
    } catch (error) {
      logger.error('Redis presence store register failed', { error });
      return false;
    }
  }

  async unregister(
    socketId: string
  ): Promise<{ userId: string | null; becameOffline: boolean }> {
    try {
      if (!this.connected) return { userId: null, becameOffline: false };
      const userId = await this.client.get(this.key(KEY_SOCKET + socketId));
      if (!userId) return { userId: null, becameOffline: false };

      const results = await this.client
        .multi()
        .del(this.key(KEY_SOCKET + socketId))
        .sRem(this.key(KEY_SOCKETS + userId), socketId)
        .sRem(this.key(KEY_NODE + this.nodeId), socketId)
        .sCard(this.key(KEY_SOCKETS + userId))
        .exec();

      const remaining = Number(results?.[3] || 0);
      if (remaining <= 0) {
        await this.client
          .multi()
          .del(this.key(KEY_SOCKETS + userId))
          .sRem(this.key(KEY_ONLINE), userId)
          .exec();
        return { userId, becameOffline: true };
      }
      return { userId, becameOffline: false };
    } catch (error) {
      logger.error('Redis presence store unregister failed', { error });
      return { userId: null, becameOffline: false };
    }
  }

  async getOnlineUserIds(): Promise<string[]> {
    try {
      if (!this.connected) return [];
      return await this.client.sMembers(this.key(KEY_ONLINE));
    } catch (error) {
      logger.error('Redis presence store getOnlineUserIds failed', { error });
      return [];
    }
  }

  async getOnlineCount(): Promise<number> {
    try {
      if (!this.connected) return 0;
      return await this.client.sCard(this.key(KEY_ONLINE));
    } catch (error) {
      logger.error('Redis presence store getOnlineCount failed', { error });
      return 0;
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    try {
      if (!this.connected) return false;
      return Boolean(
        await this.client.sIsMember(this.key(KEY_ONLINE), userId)
      );
    } catch (error) {
      logger.error('Redis presence store isUserOnline failed', { error });
      return false;
    }
  }

  async getSocketCount(userId: string): Promise<number> {
    try {
      if (!this.connected) return 0;
      return await this.client.sCard(this.key(KEY_SOCKETS + userId));
    } catch (error) {
      logger.error('Redis presence store getSocketCount failed', { error });
      return 0;
    }
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    this.heartbeatTimer = null;
    this.sweepTimer = null;
    try {
      if (this.connected) {
        await this.purgeNodeSockets();
        await this.client.quit();
      }
    } catch (error) {
      logger.error('Redis presence store dispose failed', { error });
    }
    this.connected = false;
  }

  /**
   * Remove this node's own socket registrations (clean shutdown / restart of
   * the same node id) and drop users whose last socket lived on this node.
   */
  private async purgeNodeSockets(): Promise<void> {
    try {
      if (!this.connected) return;
      const socketIds = await this.client.sMembers(
        this.key(KEY_NODE + this.nodeId)
      );
      for (const socketId of socketIds) {
        await this.unregister(socketId);
      }
      await this.client.del(this.key(KEY_NODE + this.nodeId));
      await this.client.del(this.key(KEY_HEARTBEAT + this.nodeId));
    } catch (error) {
      logger.error('Redis presence store purgeNodeSockets failed', { error });
    }
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      if (!this.connected || this.disposed) return;
      await this.client.setEx(
        this.key(KEY_HEARTBEAT + this.nodeId),
        HEARTBEAT_TTL_SECONDS,
        '1'
      );
    } catch (error) {
      logger.warn('Redis presence store heartbeat failed', { error });
    }
  }

  /**
   * Remove presence entries owned by nodes whose heartbeat expired.
   * Locked so multiple instances do not need to run it concurrently.
   */
  private async sweepStaleNodes(): Promise<void> {
    try {
      if (!this.connected || this.disposed) return;
      const lockAcquired = await this.client.set(
        this.key(SWEEP_LOCK_KEY),
        this.nodeId,
        {
          NX: true,
          EX: SWEEP_LOCK_TTL_SECONDS,
        }
      );
      if (lockAcquired !== 'OK') return;

      const nodeKeys: string[] = [];
      for await (const key of this.scanKeys(KEY_NODE + '*')) {
        nodeKeys.push(key);
      }

      for (const nodeKey of nodeKeys) {
        const ownerNodeId = nodeKey.slice(this.key(KEY_NODE).length);
        const alive = await this.client.exists(
          this.key(KEY_HEARTBEAT + ownerNodeId)
        );
        if (alive) continue;

        const socketIds = await this.client.sMembers(nodeKey);
        for (const socketId of socketIds) {
          const userId = await this.client.get(
            this.key(KEY_SOCKET + socketId)
          );
          if (!userId) continue;
          const remaining = await this.client
            .multi()
            .del(this.key(KEY_SOCKET + socketId))
            .sRem(this.key(KEY_SOCKETS + userId), socketId)
            .sCard(this.key(KEY_SOCKETS + userId))
            .exec();
          if (Number(remaining?.[2] || 0) <= 0) {
            await this.client
              .multi()
              .del(this.key(KEY_SOCKETS + userId))
              .sRem(this.key(KEY_ONLINE), userId)
              .exec();
          }
        }
        await this.client.del(nodeKey);
        await this.client.del(this.key(KEY_HEARTBEAT + ownerNodeId));
      }

      await this.client.del(this.key(SWEEP_LOCK_KEY));
    } catch (error) {
      logger.warn('Redis presence store sweep failed', { error });
      try {
        await this.client.del(this.key(SWEEP_LOCK_KEY));
      } catch {
        // ignore
      }
    }
  }

  private async *scanKeys(pattern: string): AsyncGenerator<string> {
    let cursor = 0;
    do {
      const reply = await this.client.scan(cursor.toString(), {
        MATCH: this.key(pattern),
        COUNT: 100,
      });
      cursor = Number(reply.cursor);
      for (const key of reply.keys) {
        yield key;
      }
    } while (cursor !== 0);
  }

  private key(raw: string): string {
    return `${this.keyPrefix}${raw}`;
  }
}
