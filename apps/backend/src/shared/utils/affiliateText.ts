/**
 * Normalizes free-text provider references for alias matching: lowercase,
 * accent-stripped, whitespace-collapsed. "Movistar+", "M+", " Movistar  Plus "
 * all normalize predictably so `AffiliateMerchant.aliases` can resolve them
 * to one canonical merchant regardless of spelling/casing/whitespace.
 *
 * Combining diacritical marks range built from char codes (rather than a
 * literal regex escape) to avoid any accidental literal-character transcription.
 */
const COMBINING_DIACRITICS_START = 0x0300;
const COMBINING_DIACRITICS_END = 0x036f;
const COMBINING_DIACRITICS = new RegExp(
  `[\\u${COMBINING_DIACRITICS_START.toString(16).padStart(4, '0')}-\\u${COMBINING_DIACRITICS_END.toString(16).padStart(4, '0')}]`,
  'g'
);

export function normalizeAffiliateText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
