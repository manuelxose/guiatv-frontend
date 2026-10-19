/**
 * TMDB issues two credentials: a v4 "API Read Access Token" (a JWT, sent as a Bearer header) and a v3 "API Key"
 * (32 hex characters, sent as the `api_key` query parameter). A v3 key sent as a Bearer token is rejected with 401.
 */
export function tmdbAuth(apiKey: string): {
  headers: Record<string, string>;
  params: Record<string, string>;
} {
  const key = String(apiKey || '').trim();
  const isReadToken = key.includes('.');
  return {
    headers: isReadToken ? { Authorization: `Bearer ${key}` } : {},
    params: !isReadToken && key ? { api_key: key } : {},
  };
}
