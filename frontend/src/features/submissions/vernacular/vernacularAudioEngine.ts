/**
 * Canon Vernacular Audio Cadence & Speech Compliance Engine
 * Implements ASCI Guidelines Chapter IV & CCPA 2023 Audio Obscuration Rules.
 * Statutory Speed Limit: <= 2.5 Syllables per Second (SPS) or <= 160 Words per Minute (WPM).
 */

export interface AudioCadenceMetrics {
  text: string;
  syllableCount: number;
  wordCount: number;
  speechRateMultiplier: number;
  estimatedDurationSeconds: number;
  syllablesPerSecond: number;
  wordsPerMinute: number;
  complianceStatus: "COMPLIANT" | "BORDERLINE" | "CRITICAL_VIOLATION";
  statutoryThresholdSps: number;
  excessSps: number;
  statutoryCitation: string;
  riskLevel: "LOW" | "ELEVATED" | "SEVERE";
  penaltyExposureInr: number;
  backgroundMusicSnrDb: number;
  isAudioMasked: boolean;
  remediation: {
    recommendedMultiplier: number;
    recommendedDurationSeconds: number;
    additionalAirtimeRequiredSeconds: number;
  };
}

export interface AudioPresetDisclaimer {
  id: string;
  title: string;
  category: string;
  language: "Hindi" | "Hinglish" | "Tamil" | "Bengali" | "Indian English";
  disclaimerText: string;
  defaultMultiplier: number;
  advertiserContext: string;
}

export const AUDIO_DISCLAIMER_PRESETS: AudioPresetDisclaimer[] = [
  {
    id: "MUTUAL_FUND_CHIPMUNK",
    title: "Mutual Fund Statutory Risk (High-Speed Voiceover)",
    category: "FINTECH_SEBI",
    language: "Hindi",
    disclaimerText: "म्यूचुअल फंड निवेश बाजार जोखिमों के अधीन हैं, योजना से जुड़े सभी दस्तावेजों को ध्यान से पढ़ें।",
    defaultMultiplier: 2.3, // Accelerated chipmunk speed (ASCI violation)
    advertiserContext: "FastWealth AMC — 15s National Radio & TVC Campaign",
  },
  {
    id: "PREDATORY_LOAN_HINGLISH",
    title: "Instant Loan APR Fine-Print Obscuration",
    category: "RBI_DIGITAL_LENDING",
    language: "Hinglish",
    disclaimerText: "Terms apply. Annual interest rate 48 percent per annum, processing fee 14 percent upfront non-refundable. Repayment period strictly 60 days.",
    defaultMultiplier: 2.5, // 5.2 syllables/sec (Critical CCPA violation)
    advertiserContext: "RupeeFast Digital Credit App — YouTube Pre-Roll Ad",
  },
  {
    id: "TAMIL_BETTING_DISCLAIMER",
    title: "Online Real-Money Gaming Addictive Risk (Tamil)",
    category: "MEITY_GAMING",
    language: "Tamil",
    disclaimerText: "இந்த விளையாட்டில் நிதி அபாயம் மற்றும் பழக்கமாக மாறும் அபாயம் உள்ளது. உங்கள் சொந்த பொறுப்பில் விளையாடவும்.",
    defaultMultiplier: 2.0, // Tamil Nadu Online Gaming Act 2022 violation
    advertiserContext: "Jackpot11 Fantasy Sports — IPL Regional Broadcast",
  },
  {
    id: "ALCOBEV_SODA_SURROGATE",
    title: "Packaged Water / Club Soda Disclaimer",
    category: "ASCI_SURROGATE",
    language: "Hindi",
    disclaimerText: "रॉयल चैलेंज पैकेज्ड ड्रिंकिंग वाटर एवं क्लब सोडा। सिर्फ 18 वर्ष से ऊपर के वयस्कों के लिए।",
    defaultMultiplier: 1.0, // Standard pace
    advertiserContext: "Royal Challenge Celebration Series — Star Sports TV Spot",
  },
];

/**
 * Counts syllables for Latin / Hinglish text
 */
function countLatinSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;

  // Handle common Hinglish diphthongs and long vowels
  const normalized = cleaned
    .replace(/(?:aa|ee|oo|ai|au|ou|oi)/g, "a")
    .replace(/(?:ing|tion|sion|ment|ed|es|ly)$/g, "");

  const matches = normalized.match(/[aeiouy]+/g);
  let count = matches ? matches.length : 1;

  // Trailing 'e' is usually silent unless word is short
  if (cleaned.endsWith("e") && !cleaned.endsWith("le") && count > 1) {
    count -= 1;
  }

  return Math.max(1, count);
}

/**
 * Counts syllables for Indic Unicode scripts (Devanagari, Tamil, Bengali)
 */
function countIndicSyllables(text: string): number {
  // Matches independent vowels and dependent vowel signs (matras)
  // Devanagari: \u0904-\u0914 (vowels), \u093E-\u094C (matras)
  // Tamil: \u0B85-\u0B94 (vowels), \u0BBE-\u0BCC (matras)
  // Bengali: \u0985-\u0994 (vowels), \u09BE-\u09CC (matras)
  const indicVowelRegex = /[\u0904-\u0914\u093E-\u094C\u0962\u0963\u0B85-\u0B94\u0BBE-\u0BCC\u0985-\u0994\u09BE-\u09CC]/g;
  const matches = text.match(indicVowelRegex);
  if (matches && matches.length > 0) {
    return matches.length;
  }

  // Fallback: count words * 2.2 avg syllables for Indic languages
  const words = text.split(/\s+/).filter(Boolean);
  return Math.max(1, Math.round(words.length * 2.2));
}

/**
 * Total syllable count across multilingual mixed text
 */
export function countTotalSyllables(text: string): number {
  if (!text || !text.trim()) return 0;

  const words = text.trim().split(/\s+/).filter(Boolean);
  let total = 0;

  for (const word of words) {
    // Check if word contains Indic characters
    const hasIndic = /[\u0900-\u097F\u0B80-\u0BFF\u0980-\u09FF]/.test(word);
    if (hasIndic) {
      total += countIndicSyllables(word);
    } else {
      total += countLatinSyllables(word);
    }
  }

  return Math.max(1, total);
}

/**
 * Evaluates audio cadence against ASCI Chapter IV and CCPA Section 2(28)
 */
export function analyzeAudioCadence(
  text: string,
  speedRateMultiplier: number = 1.0,
  bgmDuckingLevelDb: number = -18 // Default ducked BGM
): AudioCadenceMetrics {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const syllableCount = countTotalSyllables(text);

  // Baseline reading rate at 1.0x is approximately 2.1 syllables per second (ASCI Gold Standard)
  const baselineSeconds = Math.max(0.5, syllableCount / 2.1);
  const actualDurationSeconds = Math.max(0.2, baselineSeconds / Math.max(0.2, speedRateMultiplier));

  // Actual syllables per second (SPS) and words per minute (WPM)
  const syllablesPerSecond = Number((syllableCount / actualDurationSeconds).toFixed(2));
  const wordsPerMinute = Math.round((wordCount / actualDurationSeconds) * 60);

  const statutoryThresholdSps = 2.5; // ASCI Chapter IV upper legal bound
  const excessSps = Number(Math.max(0, syllablesPerSecond - statutoryThresholdSps).toFixed(2));

  // ASCI Audio Masking test: BGM louder than -12dB relative to voice is considered audio masking
  const isAudioMasked = bgmDuckingLevelDb > -12;

  let complianceStatus: "COMPLIANT" | "BORDERLINE" | "CRITICAL_VIOLATION" = "COMPLIANT";
  let riskLevel: "LOW" | "ELEVATED" | "SEVERE" = "LOW";
  let penaltyExposureInr = 0;

  if (syllablesPerSecond > 3.2 || isAudioMasked) {
    complianceStatus = "CRITICAL_VIOLATION";
    riskLevel = "SEVERE";
    // CCPA Section 89: Penalty for false/misleading audio advertising up to ₹10 Lakhs (first offence) to ₹50 Lakhs
    penaltyExposureInr = syllablesPerSecond > 4.5 ? 5000000 : 1000000;
  } else if (syllablesPerSecond > 2.5) {
    complianceStatus = "BORDERLINE";
    riskLevel = "ELEVATED";
    penaltyExposureInr = 500000;
  } else {
    complianceStatus = "COMPLIANT";
    riskLevel = "LOW";
    penaltyExposureInr = 0;
  }

  // Calculate statutory remediation recommendation
  const recommendedMultiplier = Number(Math.min(1.0, (2.1 / syllablesPerSecond) * speedRateMultiplier).toFixed(2));
  const recommendedDurationSeconds = Number((syllableCount / 2.1).toFixed(2));
  const additionalAirtimeRequiredSeconds = Number(
    Math.max(0, recommendedDurationSeconds - actualDurationSeconds).toFixed(2)
  );

  return {
    text,
    syllableCount,
    wordCount,
    speechRateMultiplier: Number(speedRateMultiplier.toFixed(2)),
    estimatedDurationSeconds: Number(actualDurationSeconds.toFixed(2)),
    syllablesPerSecond,
    wordsPerMinute,
    complianceStatus,
    statutoryThresholdSps,
    excessSps,
    statutoryCitation:
      complianceStatus === "CRITICAL_VIOLATION"
        ? "ASCI Guidelines Chapter IV Clause 4.2 & CCPA 2023 Sec 4(2)(e)"
        : complianceStatus === "BORDERLINE"
        ? "ASCI Audio Advisory on Intelligible Broadcast Cadence"
        : "ASCI Compliant Audio Standard (<= 2.5 Syllables/Sec)",
    riskLevel,
    penaltyExposureInr,
    backgroundMusicSnrDb: bgmDuckingLevelDb,
    isAudioMasked,
    remediation: {
      recommendedMultiplier: Math.min(1.0, Math.max(0.7, recommendedMultiplier)),
      recommendedDurationSeconds,
      additionalAirtimeRequiredSeconds,
    },
  };
}
