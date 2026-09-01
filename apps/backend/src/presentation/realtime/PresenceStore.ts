/**
 * Presence store abstraction.
 *
 * "Online" is defined exclusively by live socket presence: a user is online
 * while they hold at least one authenticated socket on any backend instance.
 * AuthSession data is never used here.
 *
 * Implementations:
 * - InMemoryPresenceStore  (default, single-instance)
 * - RedisPresenceStore     (distributed, activates with REALTIME_PRESENCE=redis)
 */

export interface PresenceStore {
  /**
   * Register a socket for a user.
   * @returns becameOnline - true when this socket made the user online.
   */
  register(userId: string, socketId: string): Promise<boolean>;

  /**
   * Unregister a socket.
   * @returns userId when the socket belonged to a known user and
   *          becameOffline - true when the user's last socket went away.
   */
  unregister(
    socketId: string
  ): Promise<{ userId: string | null; becameOffline: boolean }>;

  /** All user ids that currently hold at least one socket. */
  getOnlineUserIds(): Promise<string[]>;

  /** Number of distinct online users. */
  getOnlineCount(): Promise<number>;

  /** Whether a user currently holds at least one socket. */
  isUserOnline(userId: string): Promise<boolean>;

  /** Number of sockets a user currently holds (0 when offline). */
  getSocketCount(userId: string): Promise<number>;

  /** Release any external resources (e.g. Redis client). */
  dispose(): Promise<void>;
}

/**
 * In-memory presence store. Correct for a single backend instance.
 */
export class InMemoryPresenceStore implements PresenceStore {
  private readonly socketUserMap = new Map<string, string>();
  private readonly userSocketMap = new Map<string, Set<string>>();

  async register(userId: string, socketId: string): Promise<boolean> {
    this.socketUserMap.set(socketId, userId);
    const current = this.userSocketMap.get(userId) || new Set<string>();
    const becameOnline = current.size === 0;
    current.add(socketId);
    this.userSocketMap.set(userId, current);
    return becameOnline;
  }

  async unregister(
    socketId: string
  ): Promise<{ userId: string | null; becameOffline: boolean }> {
    const userId = this.socketUserMap.get(socketId) || null;
    if (!userId) {
      return { userId: null, becameOffline: false };
    }

    this.socketUserMap.delete(socketId);
    const sockets = this.userSocketMap.get(userId);
    if (!sockets) {
      return { userId, becameOffline: false };
    }

    sockets.delete(socketId);
    if (sockets.size > 0) {
      return { userId, becameOffline: false };
    }

    this.userSocketMap.delete(userId);
    return { userId, becameOffline: true };
  }

  async getOnlineUserIds(): Promise<string[]> {
    return Array.from(this.userSocketMap.keys());
  }

  async getOnlineCount(): Promise<number> {
    return this.userSocketMap.size;
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return Boolean(this.userSocketMap.get(userId)?.size);
  }

  async getSocketCount(userId: string): Promise<number> {
    return this.userSocketMap.get(userId)?.size || 0;
  }

  async dispose(): Promise<void> {
    this.socketUserMap.clear();
    this.userSocketMap.clear();
  }
}
