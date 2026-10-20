/**
 * Phase 2D-1 flag for persistent content identity. Off by default. While off, nothing creates,
 * reads or writes `content_entities`, `content_slugs` or `content_title_keys`; turning it on
 * only creates those (empty) collections and their indexes at boot. Rollback: unset + restart.
 */
export function isContentEntitiesEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return ['1', 'true', 'yes', 'on'].includes(String(env.CONTENT_ENTITIES_ENABLED || '').trim().toLowerCase());
}
