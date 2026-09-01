/**
 * Fuzzy keyword → known platform logo (TMDB image CDN), shared by
 * PlatformBadgeComponent and AffiliateCTAComponent so both fall back to the
 * same real provider icon when a merchant/platform record has no logo URL
 * of its own, instead of duplicating this list per consumer.
 */
const KNOWN_PLATFORM_LOGOS: ReadonlyArray<readonly [string, string]> = [
  ['netflix', 'https://image.tmdb.org/t/p/w92/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg'],
  ['prime video', 'https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg'],
  ['amazon', 'https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg'],
  ['disney', 'https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg'],
  ['hbo', 'https://image.tmdb.org/t/p/original/6Q3KKEFIL3dIFqx51poNXseNoSk.jpg'],
  ['max', 'https://image.tmdb.org/t/p/original/6Q3KKEFIL3dIFqx51poNXseNoSk.jpg'],
  ['movistar', 'https://image.tmdb.org/t/p/original/cDQbECpn23odNRHUVR5JcAKbhDs.jpg'],
  ['skyshowtime', 'https://image.tmdb.org/t/p/original/hR9vWd8hWEVQKD6eOnBneKRFEW3.jpg'],
  ['apple tv', 'https://image.tmdb.org/t/p/original/6uhKBfmtzFqOcLousHwZuzcrScK.jpg'],
  ['filmin', 'https://image.tmdb.org/t/p/original/bFb9IJXZ0IVnYuKbWAJbjYRPccY.jpg'],
  ['rtve', 'https://image.tmdb.org/t/p/original/oy4e1BSJhiUHTNwwbHqcJ5X4Gzf.jpg'],
  ['atresplayer', 'https://image.tmdb.org/t/p/original/k9UiVfG9ArLdaxWdvfS2nSIxEYj.jpg'],
  ['mitele', 'https://image.tmdb.org/t/p/original/6Cxs2ffW2XKGIJLE7CW0qtchd4K.jpg'],
  ['pluto', 'https://image.tmdb.org/t/p/original/t6N57S17sdXRXmZDAkaGP0NHNG0.jpg'],
  ['rakuten', 'https://image.tmdb.org/t/p/original/5GEbAhFW2S5T8QwqOuaFpgZFzPi.jpg'],
  ['mubi', 'https://image.tmdb.org/t/p/original/bVR4Z1LCHY7gidXAJF5pMa4QrDS.jpg'],
  ['starz', 'https://image.tmdb.org/t/p/original/xbhHHa1YejSO5943BmzXRDmZqa1.jpg'],
];

/**
 * Resolves a small (w92) provider logo URL for `label` (a merchant/platform
 * name). `providedUrl`, when non-empty, is normalized to the same w92 size
 * and always wins — the keyword list is a fallback for records without a
 * logo of their own, not an override.
 */
export function resolvePlatformLogoUrl(label: string, providedUrl?: string | null): string {
  const provided = String(providedUrl || '').trim();
  if (provided) return provided.replace('/t/p/original/', '/t/p/w92/');

  const normalized = String(label || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  for (const [keyword, url] of KNOWN_PLATFORM_LOGOS) {
    if (normalized.includes(keyword)) return url.replace('/t/p/original/', '/t/p/w92/');
  }

  return '';
}
