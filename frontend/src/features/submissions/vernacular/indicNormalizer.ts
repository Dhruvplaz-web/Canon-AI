/**
 * Indic Phonetic Normalization Utility (Soundex-Indic)
 * Collapses spelling variations in transliterated Latin-script Hindi/Hinglish
 * to canonical phonetic stems for deterministic statutory matching.
 */

export function normalizeIndicPhonetics(text: string): string {
  if (!text) return "";

  let normalized = text.toLowerCase();

  // 1. Collapse arbitrary character repetitions (>2 of same char -> 1)
  // e.g. "jalddddiii" -> "jaldi", "sooodaaa" -> "soda"
  normalized = normalized.replace(/(.)\1{2,}/g, "$1");

  // 2. Normalize elongated vowel transliterations to canonical short forms
  normalized = normalized
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/ai/g, "e")
    .replace(/ay/g, "e")
    .replace(/ou/g, "u")
    .replace(/au/g, "o");

  // 3. Compress aspirated consonants to canonical plosives
  // Hindi transliterators frequently alternate 'kh'/'k', 'ph'/'f', etc.
  normalized = normalized
    .replace(/kh/g, "k")
    .replace(/gh/g, "g")
    .replace(/ch/g, "c")
    .replace(/jh/g, "j")
    .replace(/th/g, "t")
    .replace(/dh/g, "d")
    .replace(/ph/g, "f")
    .replace(/bh/g, "b");

  // 4. Sibilant harmonization (sh / s)
  normalized = normalized.replace(/sh/g, "s");

  // 5. Double consonant reduction (e.g., "pakka" -> "paka", "chutki" remains, "khatm" -> "khatam")
  normalized = normalized
    .replace(/kk/g, "k")
    .replace(/pp/g, "p")
    .replace(/tt/g, "t")
    .replace(/dd/g, "d")
    .replace(/mm/g, "m")
    .replace(/nn/g, "n");

  return normalized;
}

/**
 * Normalizes text while preserving a word token mapping
 * for accurate bounding of original character offsets.
 */
export function tokenizeWithOffsets(text: string): { token: string; start: number; end: number }[] {
  const tokens: { token: string; start: number; end: number }[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      token: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return tokens;
}
