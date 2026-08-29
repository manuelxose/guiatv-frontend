/**
 * @deprecated Thin backward-compatibility shim. The TMDB id -> tag table and
 * `mapTmdbGenreIdsToTags` now live in the canonical genre taxonomy at
 * `../taxonomy/genreTaxonomy`, which also normalizes EPG/chatbot/search
 * genre values against the same table. Import from there directly in new code.
 */
export { TMDB_GENRE_TAGS, mapTmdbGenreIdsToTags } from '../taxonomy/genreTaxonomy';
