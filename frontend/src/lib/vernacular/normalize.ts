/**
 * Layer 0: Vernacular Normalizer with Accurate Original Character Offset Tracking
 * Reuses Soundex-Indic phonetic normalizer principles while preserving
 * bidirectional character offset maps.
 */

import { NormalizedText, NormalizedCharOffset } from "./types";

/**
 * Checks if a string contains single-letter spacing tricks like "c l u b"
 * and collapses them while preserving original character offsets.
 */
function collapseSpacingTricks(chars: NormalizedCharOffset[]): NormalizedCharOffset[] {
  const result: NormalizedCharOffset[] = [];
  let i = 0;

  while (i < chars.length) {
    // Check if we are at the start of a spaced single-letter sequence (e.g. "c l u b")
    if (/[a-zA-Z0-9]/.test(chars[i].char)) {
      // Look ahead to see if followed by (whitespace + single alphanumeric) repeatedly
      let j = i;
      const sequence: NormalizedCharOffset[] = [chars[i]];

      while (j + 2 < chars.length && /\s/.test(chars[j + 1].char) && /[a-zA-Z0-9]/.test(chars[j + 2].char)) {
        // Ensure whitespace is strictly single or double space between single letters
        if (j + 3 < chars.length && /[a-zA-Z0-9]/.test(chars[j + 3].char)) {
          // Next is not a single letter, break
          break;
        }
        sequence.push(chars[j + 2]);
        j += 2;
      }

      // If sequence has at least 3 letters (e.g. "c l u b" or "b o s s"), collapse the spaces
      if (sequence.length >= 3) {
        for (const item of sequence) {
          result.push(item);
        }
        i = j + 1;
        continue;
      }
    }

    result.push(chars[i]);
    i++;
  }

  return result;
}

/**
 * Transforms Devanagari characters into Romanized Hinglish phonemes with offset tracking
 */
function transliterateDevanagariWithOffsets(chars: NormalizedCharOffset[]): NormalizedCharOffset[] {
  const charMap: Record<string, string> = {
    "अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo",
    "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "अं": "an", "अः": "ah",
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
    "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
    "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
    "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
    "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh", "ष": "sh", "स": "s", "ह": "h",
    "ा": "a", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo", "ृ": "ri",
    "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ं": "n", "ँ": "n", "ः": "h",
    "्": "", "़": "", "ॅ": "e", "ॉ": "o",
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
    "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
  };

  const result: NormalizedCharOffset[] = [];

  for (const item of chars) {
    const ch = item.char;
    if (charMap[ch] !== undefined) {
      const mapped = charMap[ch];
      for (const mc of Array.from(mapped)) {
        result.push({
          char: mc,
          origStart: item.origStart,
          origEnd: item.origEnd,
        });
      }
    } else {
      result.push(item);
    }
  }

  return result;
}

/**
 * Replaces substrings while maintaining original offset continuity.
 */
function replaceSubstringsWithOffsets(
  chars: NormalizedCharOffset[],
  replacements: [string, string][]
): NormalizedCharOffset[] {
  let current = chars;

  for (const [target, replacement] of replacements) {
    const next: NormalizedCharOffset[] = [];
    let i = 0;
    const tLen = target.length;

    while (i < current.length) {
      let matches = true;
      if (i + tLen <= current.length) {
        for (let j = 0; j < tLen; j++) {
          if (current[i + j].char !== target[j]) {
            matches = false;
            break;
          }
        }
      } else {
        matches = false;
      }

      if (matches) {
        const spanStart = current[i].origStart;
        const spanEnd = current[i + tLen - 1].origEnd;

        if (replacement.length === 0) {
          // suppressed
        } else {
          for (let k = 0; k < replacement.length; k++) {
            next.push({
              char: replacement[k],
              origStart: spanStart,
              origEnd: spanEnd,
            });
          }
        }
        i += tLen;
      } else {
        next.push(current[i]);
        i++;
      }
    }
    current = next;
  }

  return current;
}

/**
 * Main Normalization function with bidirectional offset tracking.
 */
export function normalizeDraft(rawText: string): NormalizedText {
  if (!rawText || typeof rawText !== "string") {
    return {
      originalText: "",
      normalizedText: "",
      offsetMap: [],
      tokens: [],
    };
  }

  // 1. Initial character stream with original indices (handling Unicode surrogate pairs)
  const codePoints = Array.from(rawText);
  let charOffsets: NormalizedCharOffset[] = [];
  let rawIdx = 0;

  for (const cp of codePoints) {
    const cpLen = cp.length;
    charOffsets.push({
      char: cp.normalize("NFC"),
      origStart: rawIdx,
      origEnd: rawIdx + cpLen,
    });
    rawIdx += cpLen;
  }

  // 2. Collapse single-letter spacing tricks like "c l u b"
  charOffsets = collapseSpacingTricks(charOffsets);

  // 3. Devanagari Transliteration if native script is present
  if (/[\u0900-\u097F]/.test(rawText)) {
    charOffsets = transliterateDevanagariWithOffsets(charOffsets);
  }

  // 4. Lowercase
  charOffsets = charOffsets.map((c) => ({
    char: c.char.toLowerCase(),
    origStart: c.origStart,
    origEnd: c.origEnd,
  }));

  // 5. Repeated character compression (e.g. "sooodaaa" -> "soda")
  const compressed: NormalizedCharOffset[] = [];
  let i = 0;

  while (i < charOffsets.length) {
    let j = i;
    while (j < charOffsets.length && charOffsets[j].char === charOffsets[i].char) {
      j++;
    }

    const count = j - i;
    if (count >= 3) {
      // Collapse elongated sequence to 1 character
      compressed.push({
        char: charOffsets[i].char,
        origStart: charOffsets[i].origStart,
        origEnd: charOffsets[j - 1].origEnd,
      });
    } else {
      for (let k = i; k < j; k++) {
        compressed.push(charOffsets[k]);
      }
    }
    i = j;
  }
  charOffsets = compressed;

  // 6. Soundex-Indic Phonetic Normalization
  // Step A: Vowel Harmonization
  charOffsets = replaceSubstringsWithOffsets(charOffsets, [
    ["aa", "a"],
    ["ee", "i"],
    ["oo", "u"],
    ["ai", "e"],
    ["ay", "e"],
    ["ou", "u"],
    ["au", "o"],
  ]);

  // Step B: Aspirated Consonants
  charOffsets = replaceSubstringsWithOffsets(charOffsets, [
    ["kh", "k"],
    ["gh", "g"],
    ["ch", "c"],
    ["jh", "j"],
    ["th", "t"],
    ["dh", "d"],
    ["ph", "f"],
    ["bh", "b"],
  ]);

  // Step C: Sibilants (sh -> s)
  charOffsets = replaceSubstringsWithOffsets(charOffsets, [
    ["sh", "s"],
  ]);

  // Step D: Geminates (kk -> k, tt -> t, etc.)
  charOffsets = replaceSubstringsWithOffsets(charOffsets, [
    ["kk", "k"],
    ["pp", "p"],
    ["tt", "t"],
    ["dd", "d"],
    ["mm", "m"],
    ["nn", "n"],
    ["ll", "l"],
  ]);

  const normalizedText = charOffsets.map((c) => c.char).join("");

  // 7. Tokenize normalized text and compute word tokens with original boundaries
  const tokens: NormalizedText["tokens"] = [];
  const wordRegex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(normalizedText)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;
    const origStart = charOffsets[start]?.origStart ?? 0;
    const origEnd = charOffsets[Math.min(end - 1, charOffsets.length - 1)]?.origEnd ?? rawText.length;

    tokens.push({
      token: rawText.substring(origStart, origEnd),
      start,
      end,
      origStart,
      origEnd,
      normToken: match[0],
    });
  }

  return {
    originalText: rawText,
    normalizedText,
    offsetMap: charOffsets,
    tokens,
  };
}

/**
 * Maps a slice [normStart, normEnd] of normalizedText back to [origStart, origEnd] in original draft.
 */
export function mapNormalizedSpanToOriginal(
  offsetMap: NormalizedCharOffset[],
  normStart: number,
  normEnd: number,
  rawLength: number
): { start: number; end: number } {
  if (offsetMap.length === 0 || normStart >= normEnd) {
    return { start: 0, end: rawLength };
  }

  const boundedStart = Math.max(0, Math.min(normStart, offsetMap.length - 1));
  const boundedEnd = Math.max(0, Math.min(normEnd - 1, offsetMap.length - 1));

  const start = offsetMap[boundedStart]?.origStart ?? 0;
  const end = offsetMap[boundedEnd]?.origEnd ?? rawLength;

  return {
    start: Math.min(start, rawLength),
    end: Math.min(Math.max(start, end), rawLength),
  };
}
