const HTTPS_UPGRADE_HOSTS = ['img.3cat.cat'] as const;

function canUpgradeToHttps(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return HTTPS_UPGRADE_HOSTS.some(
    (host) => normalized === host || normalized.endsWith(`.${host}`)
  );
}

export function normalizeExternalMediaUrl(
  value: string | null | undefined
): string | undefined {
  const raw = String(value || '').trim();
  if (!raw) {
    return undefined;
  }

  if (raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }

  const candidate = raw.startsWith('//') ? `https:${raw}` : raw;

  if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
    return candidate;
  }

  try {
    const parsed = new URL(candidate);

    if (parsed.protocol === 'http:') {
      if (!canUpgradeToHttps(parsed.hostname)) {
        return undefined;
      }
      parsed.protocol = 'https:';
    }

    if (parsed.protocol !== 'https:') {
      return undefined;
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}
