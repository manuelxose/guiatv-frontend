import { ErrorHandler, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConsoleLoggerService } from './logger.service';

const CHUNK_RELOAD_KEY = 'gtv_chunk_reload_once';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly logger: ConsoleLoggerService
  ) {}

  handleError(error: unknown): void {
    if (this.isChunkLoadError(error) && this.tryRecoverChunkLoad()) {
      return;
    }

    this.logger.error('Unhandled application error', error);
  }

  private tryRecoverChunkLoad(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    try {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY);

      if (alreadyReloaded === currentPath) {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        return false;
      }

      sessionStorage.setItem(CHUNK_RELOAD_KEY, currentPath);
      window.location.reload();
      return true;
    } catch {
      window.location.reload();
      return true;
    }
  }

  private isChunkLoadError(error: unknown): boolean {
    const message = this.extractMessage(error);
    // Do not match a bare `chunk-*.js` from an ordinary stack trace: every
    // runtime exception in a split bundle contains one and used to trigger
    // reload loops unrelated to chunk loading.
    return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk [\w-]+ failed|ERR_MODULE_NOT_FOUND/i.test(
      message
    );
  }

  private extractMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      const source = error as Record<string, unknown>;
      return [
        source['message'],
        source['stack'],
        (source['rejection'] as Record<string, unknown> | undefined)?.['message'],
      ]
        .map((value) => String(value || ''))
        .join(' ');
    }

    return String(error || '');
  }
}
