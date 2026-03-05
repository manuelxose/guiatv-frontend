import { GoogleAuth } from 'google-auth-library';
import { existsSync } from 'fs';
import { LogMetadata } from '../../shared/utils/logger';

const WEBMASTERS_SCOPE = 'https://www.googleapis.com/auth/webmasters';
const DEFAULT_SITE_URL = 'https://guiaprogramaciontv.com';
const DEFAULT_SITEMAP_URL = `${DEFAULT_SITE_URL}/sitemap.xml`;

type LogLevel = 'info' | 'warn' | 'error';

export interface SearchConsoleLogger {
  info?: (message: string, metadata?: LogMetadata) => void;
  warn?: (message: string, metadata?: LogMetadata) => void;
  error?: (message: string, metadata?: LogMetadata) => void;
}

export interface SubmitSitemapOptions {
  enabled?: boolean;
  siteUrl?: string;
  sitemapUrl?: string;
  throwOnError?: boolean;
  logger?: SearchConsoleLogger;
}

export interface SubmitSitemapResult {
  attempted: boolean;
  submitted: boolean;
  skipped: boolean;
  reason?: string;
  status?: number;
  endpoint?: string;
}

const isTruthy = (value: string | undefined): boolean =>
  /^(1|true|yes|on)$/i.test((value || '').trim());

const normalizeSiteUrl = (raw: string): string => {
  const value = (raw || '').trim();
  if (value.startsWith('sc-domain:')) {
    return value;
  }
  return value.replace(/\/+$/, '');
};

const safeLog = (
  logger: SearchConsoleLogger | undefined,
  level: LogLevel,
  message: string,
  meta?: LogMetadata
): void => {
  if (logger && typeof logger[level] === 'function') {
    logger[level]!(message, meta);
    return;
  }

  const fallback =
    level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fallback(message, meta);
};

/**
 * Submits sitemap URL to Google Search Console API.
 * Uses service account credentials available through GOOGLE_APPLICATION_CREDENTIALS.
 */
export const submitSitemapToSearchConsole = async (
  options: SubmitSitemapOptions = {}
): Promise<SubmitSitemapResult> => {
  const enabled =
    typeof options.enabled === 'boolean'
      ? options.enabled
      : isTruthy(process.env.GSC_AUTO_SUBMIT_ENABLED);

  if (!enabled) {
    return {
      attempted: false,
      submitted: false,
      skipped: true,
      reason: 'GSC_AUTO_SUBMIT_ENABLED is false',
    };
  }

  const siteUrl = normalizeSiteUrl(
    options.siteUrl ||
      process.env.GSC_SITE_URL ||
      process.env.SITE_URL ||
      process.env.PUBLIC_SITE_URL ||
      DEFAULT_SITE_URL
  );
  const sitemapUrl = (
    options.sitemapUrl ||
    process.env.GSC_SITEMAP_URL ||
    DEFAULT_SITEMAP_URL
  ).trim();

  if (!siteUrl || !sitemapUrl) {
    return {
      attempted: false,
      submitted: false,
      skipped: true,
      reason: 'Missing siteUrl or sitemapUrl for Search Console submit',
    };
  }

  const credentialsPath = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  if (credentialsPath && !existsSync(credentialsPath)) {
    safeLog(options.logger, 'warn', 'Search Console submit skipped: credentials file missing', {
      credentialsPath,
    });
    return {
      attempted: false,
      submitted: false,
      skipped: true,
      reason: `Missing credentials file: ${credentialsPath}`,
    };
  }

  const endpoint =
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}` +
    `/sitemaps/${encodeURIComponent(sitemapUrl)}`;

  try {
    const auth = new GoogleAuth({
      scopes: [WEBMASTERS_SCOPE],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken =
      typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

    if (!accessToken) {
      throw new Error('No access token available for Search Console API');
    }

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(
        `Search Console API error ${response.status}: ${body.slice(0, 300)}`
      );
    }

    safeLog(options.logger, 'info', 'Search Console sitemap submitted', {
      siteUrl,
      sitemapUrl,
      status: response.status,
    });

    return {
      attempted: true,
      submitted: true,
      skipped: false,
      status: response.status,
      endpoint,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Search Console submit error';

    safeLog(options.logger, 'error', 'Search Console sitemap submit failed', {
      siteUrl,
      sitemapUrl,
      endpoint,
      error: message,
    });

    if (options.throwOnError) {
      throw error;
    }

    return {
      attempted: true,
      submitted: false,
      skipped: false,
      reason: message,
      endpoint,
    };
  }
};
