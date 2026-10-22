import type { Server } from 'http';

export interface ShutdownDeps {
  server: Server;
  /** Disconnects Socket.IO clients. Must run first: upgraded websockets keep `server.close()` pending forever. */
  closeRealtime: () => Promise<void>;
  cleanup: () => Promise<void>;
  exit: (code: number) => void;
  warn: (message: string, meta?: unknown) => void;
  graceMs?: number;
  forceMs?: number;
}

/** Realtime first, then the HTTP server (idle keep-alives dropped now, stragglers after `graceMs`), then the container; exit 0. */
export function createShutdown(deps: ShutdownDeps): () => Promise<void> {
  const { server, closeRealtime, cleanup, exit, warn, graceMs = 5000, forceMs = 10000 } = deps;
  let running = false;
  return async () => {
    if (running) return;
    running = true;
    const force = setTimeout(() => exit(1), forceMs);
    force.unref();
    const grace = setTimeout(() => server.closeAllConnections(), graceMs);
    grace.unref();
    try {
      await closeRealtime();
    } catch (error) {
      warn('Error while closing chat socket hub', { error });
    }
    // io.close() already closes the HTTP server it was attached to; a second close reports ERR_SERVER_NOT_RUNNING.
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeIdleConnections();
    });
    try {
      await cleanup();
    } catch (error) {
      warn('Error while cleaning up container during shutdown', { error });
    }
    clearTimeout(grace);
    clearTimeout(force);
    exit(0);
  };
}
