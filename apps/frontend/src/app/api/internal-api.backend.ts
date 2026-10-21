import { Injectable } from '@angular/core';
import { FetchBackend, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Hostnames the SSR server accepts (`SSR_ALLOWED_HOSTS` in scripts/ssr-server.mjs). Angular resolves a relative
 * `/v2/...` URL against the incoming request's host, which is always one of these.
 */
const SITE_HOSTNAMES = new Set(['guiaprogramaciontv.com', 'www.guiaprogramaciontv.com', '127.0.0.1', 'localhost']);

/**
 * POSTs that only read (no side effect: `AffiliateResolverService.resolveOffers` builds offers from the catalogue).
 * They take the internal route like GETs, and the API counts them as local reads (rateLimit.ts `isDirectLocalRead`).
 * Over Cloudflare this one stalled renders up to the 20 s SSR timeout (nginx 504 after 30 s) and drew 429s in crawls.
 */
export const READ_SHAPED_POSTS = new Set(['/v2/affiliate/resolve']);

/**
 * Total-duration cap per SSR API request. The whole render has 20 s (SSR_TIMEOUT_MS in scripts/ssr-server.mjs) and
 * the deepest page chains three calls, so one stalled dependency can no longer use it all. Enforced by FetchBackend's
 * own `timeout`: measured from the start (headers and body), it aborts the fetch and fails the request with an
 * HttpErrorResponse (status 0, TimeoutError). Optional sections already fall back to empty; required data still turns
 * the page into a 503. A shorter timeout set by the caller is kept.
 */
export const SSR_API_TIMEOUT_MS = 6000;

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
 * Writes stay on the public route: loopback reads (and the read-shaped POSTs above) are exempt from the API's
 * per-IP limits (rateLimit.ts `isDirectLocalRead`), writes are not.
 * ponytail: the exemption trusts any loopback caller without forwarding headers; upgrade path: a dedicated SSR credential.
 */
export function toInternalApiUrl(url: string, method: string, internalOrigin = INTERNAL_API_ORIGIN): string | null {
  if (method !== 'GET' && method !== 'HEAD' && method !== 'POST') return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password || !SITE_HOSTNAMES.has(parsed.hostname)) return null;
  if (parsed.pathname !== '/v2' && !parsed.pathname.startsWith('/v2/')) return null;
  if (method === 'POST' && !READ_SHAPED_POSTS.has(parsed.pathname)) return null;
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
    const url = toInternalApiUrl(req.url, req.method) ?? req.url;
    const timeout = Math.min(req.timeout || SSR_API_TIMEOUT_MS, SSR_API_TIMEOUT_MS);
    return super.handle(req.clone({ url, timeout }));
  }
}
