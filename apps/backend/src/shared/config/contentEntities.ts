const truthy = (value: string | undefined) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());

/**
 * Phase 2D-1 flag for persistent content identity. Off by default. While off, nothing creates,
 * writes `content_entities`, `content_slugs` or `content_title_keys`; turning it on
 * only creates those (empty) collections and their indexes at boot. Rollback: unset + restart.
 */
export function isContentEntitiesEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return truthy(env.CONTENT_ENTITIES_ENABLED);
}

export interface ContentIdentityFlags {
  /** CONTENT_IDENTITY_SHADOW: match every rebuilt day and log aggregates. Reads only. */
  shadow: boolean;
  /**
   * CONTENT_IDENTITY_WRITES: persist entities, slugs and title keys. Needs the 2D-1 flag, and the
   * value must be the name of the connected database: "true" never enables writes, so a copied
   * env file can't write into another database by accident.
   */
  writes: boolean;
  /** CONTENT_IDENTITY_AIRING_REFS: write `program.entityId` on airings. Needs writes, and the hand-built airing index (checked at run time). */
  airingRefs: boolean;
}

/**
 * 2D-2 ingestion flags, all off by default and independent of each other except where a later
 * stage needs an earlier one. Phase 3A public reads use a separate, default-off flag and never
 * enable these write or ingestion capabilities.
 */
export function readContentIdentityFlags(env: NodeJS.ProcessEnv, databaseName: string | undefined): ContentIdentityFlags {
  const target = String(env.CONTENT_IDENTITY_WRITES || '').trim();
  const writes = isContentEntitiesEnabled(env) && Boolean(databaseName) && target === databaseName;
  return {
    shadow: truthy(env.CONTENT_IDENTITY_SHADOW),
    writes,
    airingRefs: writes && truthy(env.CONTENT_IDENTITY_AIRING_REFS),
  };
}

/**
 * EPG_YEAR_PROVENANCE (2D-2G, off): when TMDB enrichment sets a programme's `year`, the sync also
 * keeps the feed's own year in `sourceProvenance.yearProvenance`. `year` keeps its meaning, so no
 * public output changes; turning it on adds that field to programme documents written afterwards.
 */
export function isEpgYearProvenanceEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return truthy(env.EPG_YEAR_PROVENANCE);
}

/** Upper bound on entities created by one rebuild; the rest wait for the next run (counted as deferred). */
export function contentIdentityMaxCreates(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number.parseInt(String(env.CONTENT_IDENTITY_MAX_CREATES || ''), 10);
  return Number.isFinite(n) && n >= 0 ? n : 1000;
}
