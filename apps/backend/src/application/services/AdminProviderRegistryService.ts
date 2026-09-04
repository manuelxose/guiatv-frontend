export type ProviderHealth = 'healthy' | 'degraded' | 'unconfigured' | 'disabled';
export interface AdminProviderStatus { id: string; displayName: string; domain: string; configured: boolean; enabled: boolean; health: ProviderHealth; capabilities: string[]; }

/** Safe operational registry: configuration is reported as a boolean only. */
export class AdminProviderRegistryService {
  list(): AdminProviderStatus[] {
    const configured = (keys: string[]) => keys.some((key) => Boolean(process.env[key]));
    const providers = [
      ['epg-tdtchannels', 'TDTChannels EPG', 'epg.tdtchannels.com', ['EPG_SOURCE_URL', 'SECONDARY_EPG_SOURCE_URL'], ['epg', 'channel-catalog']],
      ['tmdb', 'TMDB', 'themoviedb.org', ['TMDB_API_KEY'], ['media-catalog', 'images']],
      ['football', 'Football data', 'football-data.org', ['FOOTBALL_DATA_API_KEY'], ['football-fixtures']],
      ['ai', 'AI assistant', 'configured AI provider', ['OPENAI_API_KEY', 'AI_API_KEY'], ['assistant-generation']],
    ] as const;
    return providers.map(([id, displayName, domain, keys, capabilities]) => {
      const isConfigured = configured([...keys]);
      return { id, displayName, domain, configured: isConfigured, enabled: isConfigured, health: isConfigured ? 'healthy' : 'unconfigured', capabilities: [...capabilities] };
    });
  }
}
