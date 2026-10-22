import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLinkContext, linkCatalogueRow, LinkProgram, LinkRow } from './catalogueLinker';

const heat: LinkRow = { id: 'r1', tmdbId: 949, tmdbType: 'movie', title: 'Heat', originalTitle: 'Heat', normalizedTitle: 'heat' };
const prog = (over: Partial<LinkProgram> = {}): LinkProgram => ({ title: 'Heat', tmdbId: 949, editorialCategory: 'Cine', ...over });
const decide = (p: LinkProgram, rows: LinkRow[], batch: LinkProgram[] = [p]) => linkCatalogueRow(p, buildLinkContext(batch, rows));
const is = (d: ReturnType<typeof decide>, decision: string, reason: string) => assert.deepEqual([d.decision, d.reason], [decision, reason]);

test('exact identity with matching type and title key is LINKABLE, with evidence', () => {
  const d = decide(prog(), [heat]);
  is(d, 'LINKABLE', 'strict_match');
  assert.deepEqual(d.evidence, { rule: 'tmdb-type-titlekey-unique', version: 1, tmdbId: 949, tmdbType: 'movie', titleKey: d.evidence.titleKey, candidateCount: 1, mediaId: 'r1' });
});
test('original-title key is accepted; normalized-equivalent titles match', () => {
  is(decide(prog({ title: 'HEAT' }), [{ ...heat, title: 'Fuego contra fuego', originalTitle: 'Heat' }]), 'LINKABLE', 'strict_match');
  is(decide(prog({ title: '  Heat  ' }), [heat]), 'LINKABLE', 'strict_match');
});
test('wrong content type is rejected', () => is(decide(prog({ editorialCategory: 'Series' }), [heat]), 'REJECTED', 'wrong_content_type'));
test('missing TMDB id / non-positive id', () => {
  is(decide(prog({ tmdbId: undefined }), [heat]), 'REJECTED', 'missing_tmdb_id');
  is(decide(prog({ tmdbId: 0 }), [heat]), 'REJECTED', 'missing_tmdb_id');
  is(decide(prog({ tmdbId: 9.5 }), [heat]), 'REJECTED', 'missing_tmdb_id');
});
test('missing catalogue row', () => is(decide(prog(), []), 'REJECTED', 'missing_catalogue_row'));
test('duplicate candidates are AMBIGUOUS (unknown category, movie+tv rows)', () => {
  is(decide(prog({ editorialCategory: 'Otros' }), [heat, { ...heat, id: 'r2', tmdbType: 'tv' }]), 'AMBIGUOUS', 'duplicate_candidates');
  is(decide(prog(), [heat, { ...heat, id: 'r2' }]), 'AMBIGUOUS', 'duplicate_candidates');
});
test('unknown category with a valid row plus an invalid row of another type is AMBIGUOUS', () =>
  is(decide(prog({ editorialCategory: 'Otros' }), [heat, { ...heat, id: 'r2', tmdbType: 'tv', normalizedTitle: '' }]), 'AMBIGUOUS', 'ambiguous_content_type'));
test('existing valid mediaId is ALREADY_LINKED and never replaced', () => {
  const d = decide(prog({ mediaId: 'r1' }), [heat, { ...heat, id: 'r2', tmdbType: 'tv' }]);
  is(d, 'ALREADY_LINKED', 'existing_media_id_valid');
  assert.equal(d.evidence.mediaId, 'r1');
});
test('existing mediaId that is unknown, for another TMDB id, or invalid is a conflict, not overwritten', () => {
  is(decide(prog({ mediaId: 'zzz' }), [heat]), 'REJECTED', 'conflicting_media_id');
  is(decide(prog({ mediaId: 'r1' }), []), 'REJECTED', 'conflicting_media_id');
  is(decide(prog({ mediaId: 'r1' }), [{ ...heat, normalizedTitle: '' }]), 'REJECTED', 'conflicting_media_id');
});
test('invalid catalogue rows are excluded', () => {
  is(decide(prog(), [{ ...heat, normalizedTitle: '' }]), 'REJECTED', 'invalid_catalogue_row');
  is(decide(prog(), [{ ...heat, title: ' ' }]), 'REJECTED', 'invalid_catalogue_row');
  is(decide(prog({ editorialCategory: 'Otros' }), [{ ...heat, tmdbType: null }]), 'REJECTED', 'invalid_catalogue_row');
  is(decide(prog(), [{ ...heat, normalizedTitle: '' }, { ...heat, id: 'r2' }]), 'LINKABLE', 'strict_match');
});
test('title-key mismatch, similarity and unsupported aliases never link', () => {
  is(decide(prog({ title: 'Heat 2' }), [heat]), 'REJECTED', 'title_key_mismatch');
  is(decide(prog({ title: 'Heatt' }), [heat]), 'REJECTED', 'title_key_mismatch');
  is(decide(prog({ title: 'Heat (El Silencio)' }), [heat]), 'REJECTED', 'title_key_mismatch');
});
test('malformed / empty titles have no key', () => {
  for (const title of ['', '   ', '···', null, undefined]) is(decide(prog({ title }), [heat]), 'REJECTED', 'invalid_title_key');
});
test('a TMDB id shared by other titles in the batch blocks linking', () => {
  const other = prog({ title: 'Otra cosa' });
  is(decide(prog(), [heat], [prog(), other]), 'REJECTED', 'tmdb_id_shared_by_other_titles');
});
test('idempotent and does not mutate inputs', () => {
  const rows = Object.freeze([Object.freeze({ ...heat })]) as LinkRow[];
  const p = Object.freeze(prog());
  const ctx = buildLinkContext([p], rows);
  assert.deepEqual(linkCatalogueRow(p, ctx), linkCatalogueRow(p, ctx));
});
test('M03-L2: an existing mediaId on a row of the other kind is rejected as cross-type; the TMDB number alone proves nothing', () => {
  const show: LinkRow = { ...heat, id: 'r2', tmdbType: 'tv' };
  is(decide(prog({ editorialCategory: 'Series', mediaId: 'r1' }), [heat]), 'REJECTED', 'cross_type_media_id');
  is(decide(prog({ editorialCategory: 'Cine', mediaId: 'r2' }), [show]), 'REJECTED', 'cross_type_media_id');
  // Same numeric id 949 under both kinds: each category keeps only its own kind's row.
  is(decide(prog({ editorialCategory: 'Series', mediaId: 'r2' }), [heat, show]), 'ALREADY_LINKED', 'existing_media_id_valid');
  is(decide(prog({ editorialCategory: 'Series', mediaId: 'r1' }), [heat, show]), 'REJECTED', 'cross_type_media_id');
  is(decide(prog({ editorialCategory: 'Cine', mediaId: 'r1' }), [heat, show]), 'ALREADY_LINKED', 'existing_media_id_valid');
  // A category that names no kind keeps a valid row of either kind (no type evidence to contradict it).
  is(decide(prog({ editorialCategory: 'Documental', mediaId: 'r2' }), [heat, show]), 'ALREADY_LINKED', 'existing_media_id_valid');
});
