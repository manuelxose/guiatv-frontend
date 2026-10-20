import { Injectable } from '@angular/core';
import { FetchBackend, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Hostnames the SSR server accepts (`SSR_ALLOWED_HOSTS` in scripts/ssr-server.mjs). Angular resolves a relative
 * `/v2/...` URL against the incoming request's host, which is always one of these.
 */
const SITE_HOSTNAMES = new Set(['guiaprogramaciontv.com', 'www.guiaprogramaciontv.com', '127.0.0.1', 'localhost']);

const INTERNAL_API_ORIGIN = new URL(
  (typeof process !== 'undefined' && (process.env['SSR_API_BASE_URL'] || process.env['API_ORIGIN'])) ||
    'http://127.0.0.1:4000'
).origin;

/**
 * The internal URL for a server-side request to this site's own API, or null to send it unchanged.
 *
 * Only GET/HEAD to `/v2` on a site hostname qualify. The target origin is fixed configuration: the request's host
 * and port are dropped, so a client-supplied Host header cannot pick the target, and anything else (third-party
 * APIs, non-API paths) is never rewritten. Dot segments are already resolved by the URL parser.
 *
 * ponytail: POST stays on the public route. Loopback reads are exempt from the API's per-IP limits
 * (rateLimit.ts `isDirectLocalRead`), writes are not, and SSR peaks at ~220 POST /v2/affiliate/resolve per minute,
 * over the 100/min general limit one shared 127.0.0.1 bucket would allow. Upgrade path: a dedicated SSR credential.
 */
export function toInternalApiUrl(url: string, method: string, internalOrigin = INTERNAL_API_ORIGIN): string | null {
  if (method !== 'GET' && method !== 'HEAD') return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password || !SITE_HOSTNAMES.has(parsed.hostname)) return null;
  if (parsed.pathname !== '/v2' && !parsed.pathname.startsWith('/v2/')) return null;
  return `${internalOrigin}${parsed.pathname}${parsed.search}`;
}

/**
 * Server-only HttpBackend: sends this site's API reads to the internal API origin instead of out through public
 * DNS and Cloudflare. It runs after every interceptor, so the transfer-cache key stays the URL the browser uses.
 * Never provided in the browser.
 */
@Injectable()
export class InternalApiBackend extends FetchBackend {
  override handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const url = toInternalApiUrl(req.url, req.method);
    return super.handle(url ? req.clone({ url }) : req);
  }
}
