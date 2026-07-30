const HTTPS_UPGRADE_HOSTS = ['img.3cat.cat'] as const;

function canUpgradeToHttps(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return HTTPS_UPGRADE_HOSTS.some(
    (host) => normalized === host || normalized.endsWith(`.${host}`)
  );
}

function normalizeAbsoluteUrl(raw: string): string | undefined {
  try {
    const parsed = new URL(raw);

    if (parsed.protocol === 'http:') {
      if (!canUpgradeToHttps(parsed.hostname)) {
        return undefined;
      }
      parsed.protocol = 'https:';
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'data:' && parsed.protocol !== 'blob:') {
      return undefined;
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function normalizePublicImageUrl(
  raw: string | null | undefined,
  assetBaseUrl?: string
): string | undefined {
  const safeRaw = String(raw || '').trim();
  if (!safeRaw) {
    return undefined;
  }

  if (safeRaw.startsWith('data:') || safeRaw.startsWith('blob:')) {
    return safeRaw;
  }

  if (safeRaw.startsWith('//')) {
    return normalizeAbsoluteUrl(`https:${safeRaw}`);
  }

  if (safeRaw.startsWith('http://') || safeRaw.startsWith('https://')) {
    return normalizeAbsoluteUrl(safeRaw);
  }

  const base =
    String(assetBaseUrl || '').trim() ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  if (!base) {
    return safeRaw.startsWith('/') ? safeRaw : undefined;
  }

  if (safeRaw.startsWith('/')) {
    return `${base}${safeRaw}`;
  }

  return `${base}/${safeRaw.replace(/^\/+/, '')}`;
}
