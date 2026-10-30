/**
 * Indic Phonetic Normalization Utility (Soundex-Indic)
 * Collapses spelling variations in transliterated Latin-script Hindi/Hinglish
 * as well as native Devanagari Unicode script to canonical phonetic stems
 * for deterministic statutory matching.
 */

export interface PhoneticTraceStep {
  stage: string;
  before: string;
  after: string;
  ruleApplied: string;
}

/**
 * Transliterates Devanagari Unicode characters (U+0900 - U+097F)
 * into standard Romanized Hinglish phonetic characters.
 */
export function transliterateDevanagariToLatin(text: string): string {
  if (!text) return "";
  if (!/[\u0900-\u097F]/.test(text)) return text;

  const charMap: Record<string, string> = {
    // Independent Vowels
    "अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo",
    "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "अं": "an", "अः": "ah",
    // Consonants
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
    "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
    "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
    "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
    "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh", "ष": "sh", "स": "s", "ह": "h",
    // Matras (Dependent Vowels)
    "ा": "a", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo", "ृ": "ri",
    "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ं": "n", "ँ": "n", "ः": "h",
    "्": "", // Virama suppresses intrinsic vowel
    "़": "", // Nukta sign
    "ॅ": "e", "ॉ": "o",
    // Hindi Numerals
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
    "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
  };

  let result = "";
  const chars = Array.from(text);

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (charMap[ch] !== undefined) {
      result += charMap[ch];
    } else {
      result += ch;
    }
  }

  return result;
}

export function getPhoneticTransformationTrace(text: string): {
  original: string;
  canonical: string;
  steps: PhoneticTraceStep[];
} {
  const steps: PhoneticTraceStep[] = [];
  const raw = text || "";

  // Step 0: Devanagari Transliteration if native Hindi script is present
  let current = raw;
  if (/[\u0900-\u097F]/.test(raw)) {
    const step0 = transliterateDevanagariToLatin(raw);
    steps.push({
      stage: "Devanagari Transliteration",
      before: raw,
      after: step0,
      ruleApplied: "Converted native Devanagari Unicode graphemes to Romanized Hinglish phonemes",
    });
    current = step0;
  }

  current = current.toLowerCase().trim();

  // Step 1: Character repetition reduction (e.g. "sooodaaa" -> "soda", "jaldddiii" -> "jaldi")
  const step1 = current.replace(/(.)\1{2,}/g, "$1");
  if (step1 !== current) {
    steps.push({
      stage: "Repetition Compression",
      before: current,
      after: step1,
      ruleApplied: "Collapsed elongated character sequences (e.g. 'sooodaaa' -> 'soda')",
    });
    current = step1;
  }

  // Step 2: Vowel normalization
  const step2 = current
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/ai/g, "e")
    .replace(/ay/g, "e")
    .replace(/ou/g, "u")
    .replace(/au/g, "o");
  if (step2 !== current) {
    steps.push({
      stage: "Indic Vowel Harmonization",
      before: current,
      after: step2,
      ruleApplied: "Reduced elongated matra vowels (aa->a, ee->i, oo->u, ai->e)",
    });
    current = step2;
  }

  // Step 3: Aspirated plosive compression
  const step3 = current
    .replace(/kh/g, "k")
    .replace(/gh/g, "g")
    .replace(/ch/g, "c")
    .replace(/jh/g, "j")
    .replace(/th/g, "t")
    .replace(/dh/g, "d")
    .replace(/ph/g, "f")
    .replace(/bh/g, "b");
  if (step3 !== current) {
    steps.push({
      stage: "Aspirated Consonant Mapping",
      before: current,
      after: step3,
      ruleApplied: "Normalized aspirated plosives (kh->k, th->t, ph->f, bh->b)",
    });
    current = step3;
  }

  // Step 4: Sibilant harmonization (Talavya / Murdhanya 'sh' -> Dental 's')
  const step4 = current.replace(/sh/g, "s");
  if (step4 !== current) {
    steps.push({
      stage: "Sibilant Harmonization",
      before: current,
      after: step4,
      ruleApplied: "Mapped talavya/murdhanya sibilants to canonical dental 's'",
    });
    current = step4;
  }

  // Step 5: Double consonant reduction
  const step5 = current
    .replace(/kk/g, "k")
    .replace(/pp/g, "p")
    .replace(/tt/g, "t")
    .replace(/dd/g, "d")
    .replace(/mm/g, "m")
    .replace(/nn/g, "n")
    .replace(/ll/g, "l");
  if (step5 !== current) {
    steps.push({
      stage: "Geminate Consonant Reduction",
      before: current,
      after: step5,
      ruleApplied: "Reduced geminate double consonants (kk->k, tt->t, ll->l)",
    });
    current = step5;
  }

  return {
    original: text,
    canonical: current,
    steps,
  };
}

export function normalizeIndicPhonetics(text: string): string {
  if (!text) return "";
  return getPhoneticTransformationTrace(text).canonical;
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
