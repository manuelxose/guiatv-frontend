export const PRIMARY_EPG_SOURCE_URL =
  'https://iptv-epg.org/files/epg-es.xml.gz';
export const SECONDARY_EPG_SOURCE_URL =
  'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guiatv_sincolor.xml.gz';
export const TDTCHANNELS_EPG_SOURCE_URL =
  'https://www.tdtchannels.com/epg/TV.xml.gz';

export const DEFAULT_EPG_SOURCE_URLS = [
  PRIMARY_EPG_SOURCE_URL,
  SECONDARY_EPG_SOURCE_URL,
  TDTCHANNELS_EPG_SOURCE_URL,
];

function uniqueUrls(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const safe = String(value || '').trim();
    if (!safe || seen.has(safe)) {
      return;
    }

    seen.add(safe);
    result.push(safe);
  });

  return result;
}

export function getConfiguredEpgSourceUrls(rawValue?: string | null): string[] {
  const safeRaw = String(rawValue ?? process.env.EPG_SOURCE_URLS ?? '').trim();
  if (!safeRaw) {
    return [...DEFAULT_EPG_SOURCE_URLS];
  }

  return uniqueUrls(safeRaw.split(',').map((value) => value.trim()));
}

export function getPrimaryEpgSourceUrl(rawValue?: string | null): string {
  return getConfiguredEpgSourceUrls(rawValue)[0] || PRIMARY_EPG_SOURCE_URL;
}

export function isTdtChannelsSourceUrl(value: string | null | undefined): boolean {
  return /tdtchannels\.com\/epg\/tv\.xml(?:\.gz)?$/i.test(String(value || '').trim());
}
