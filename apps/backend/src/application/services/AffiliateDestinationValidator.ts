/**
 * Shared destination-safety gate for the Affiliate Engine. Ported verbatim
 * from `MonetizationService.isAllowedDestination` (the check every current
 * outbound redirect already goes through) and generalized so every future
 * deep-link adapter and the migration/seed path share one implementation —
 * no adapter or provider can bypass it.
 *
 * Non-negotiable per docs/affiliate-engine-architecture.md §17:
 *  - https-only
 *  - destination host must be present in the offer/program's allowlist
 *  - no `javascript:`/`data:`/other non-http(s) scheme can ever pass
 */
export interface AffiliateDestinationValidationResult {
  safe: boolean;
  reason?: string;
  hostname?: string;
}

export function isAllowedAffiliateDestination(rawUrl: string, allowedHosts: string[]): boolean {
  return validateAffiliateDestination(rawUrl, allowedHosts).safe;
}

export function validateAffiliateDestination(
  rawUrl: string,
  allowedHosts: string[]
): AffiliateDestinationValidationResult {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { safe: false, reason: 'invalid_url' };
  }

  if (url.protocol !== 'https:') {
    return { safe: false, reason: 'non_https_protocol', hostname: url.hostname };
  }

  const normalizedHosts = (allowedHosts || []).map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (normalizedHosts.length === 0) {
    return { safe: false, reason: 'empty_allowlist', hostname: url.hostname };
  }

  const hostname = url.hostname.toLowerCase();
  const allowed = normalizedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  if (!allowed) {
    return { safe: false, reason: 'host_not_allowlisted', hostname };
  }

  return { safe: true, hostname };
}

const IP_LITERAL = /^\d{1,3}(\.\d{1,3}){3}$/;
const HOSTNAME_SHAPE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

/**
 * Admin-input gate for `AffiliateProgram.allowedHosts` entries — a bare
 * hostname, never a full URL, scheme, path, or wildcard. Rejects anything
 * that isn't a plausible public DNS hostname (`localhost`, IP literals, and
 * malformed input included) so a mistyped or malicious host can never enter
 * an allowlist that `validateAffiliateDestination` later trusts verbatim.
 */
export function isSafeAllowedHost(rawHost: string): boolean {
  const host = String(rawHost || '').trim().toLowerCase();
  if (!host) return false;
  if (host.includes('://') || host.includes('/') || host.includes('*') || /\s/.test(host)) return false;
  if (host === 'localhost' || IP_LITERAL.test(host)) return false;
  return HOSTNAME_SHAPE.test(host);
}

/**
 * Validates the static/config parts of an offer destination that don't
 * require resolving a secret first (used by the seed/migration path and by
 * schema-level validation). A `url_template`/`network_redirect`/`tag_param`/
 * `api_generated` strategy is only checked for scheme/shape here — the fully
 * built URL is re-checked by `validateAffiliateDestination` again at resolve
 * time, per the safety gate being mandatory on every strategy's output.
 */
export function isSafeAffiliateBaseUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}
