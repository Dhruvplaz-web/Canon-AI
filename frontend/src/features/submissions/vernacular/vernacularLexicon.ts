/**
 * Indian Statutory Vernacular & Surrogate Lexicon
 * Grounded in:
 * - Guidelines for Prevention of Misleading Advertisements and Endorsements for Misleading Advertisements, 2022 (CCPA) (Guideline 9: Surrogate Advertising)
 * - ASCI Code for Self-Regulation of Advertising Content in India (Chapter III: Surrogate Advertising)
 * - Guidelines for Prevention and Regulation of Dark Patterns, 2023 (CCPA)
 * - Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954 (Section 3: Prohibited Claims)
 * - Reserve Bank of India (Digital Lending) Directions, 2025 (RBI/2025-26/36, 8 May 2025)
 * - SEBI (Prohibition of Fraudulent and Unfair Trade Practices relating to Securities Market) Regulations, 2003
 */

export interface SurrogateGroup {
  category: "SURROGATE_ALCOBEV" | "SURROGATE_TOBACCO" | "SURROGATE_BETTING";
  ruleCode: string;
  ruleTitle: string;
  statutoryCitation: string;
  penaltyInr: number;
  restrictedBrands: string[];
  innocuousExtensions: string[];
  explanation: string;
  suggestedAction: string;
}

export const SURROGATE_KNOWLEDGE_BASE: SurrogateGroup[] = [
  {
    category: "SURROGATE_ALCOBEV",
    ruleCode: "ASCI-SURR-ALCO",
    ruleTitle: "Prohibited Surrogate Alcobev Marketing",
    statutoryCitation: "ASCI Code Chapter III & CCPA Guidelines (2022) Guideline 9(1)",
    penaltyInr: 1000000, // ₹10 Lakhs base under CPA 2019 Sec 21
    restrictedBrands: [
      "royal challenge",
      "royal select",
      "mcdowell",
      "officers choice",
      "imperial blue",
      "blenders pride",
      "royal stag",
      "kingfisher",
      "tuborg",
      "carlsberg",
      "haywards",
      "bagpiper",
      "corona",
      "signature",
      "johnnie walker",
      "chivas",
      "bacardi",
      "100 pipers",
      "teachers",
      "magic moments",
      "seagram",
    ],
    innocuousExtensions: [
      "club soda",
      "soda",
      "packaged drinking water",
      "drinking water",
      "mineral water",
      "packaged water",
      "sparkling water",
      "music cds",
      "cassettes",
      "crystal glassware",
      "playing cards",
      "superhit nights",
      "calendar",
      "crisps",
      "snacks",
    ],
    explanation:
      "Indirect promotion of restricted alcoholic beverages disguised under an innocuous brand extension (Club Soda, Packaged Drinking Water, or Music CDs).",
    suggestedAction:
      "Remove alcoholic master brand trademark or furnish independent audited sales certificates proving >₹5 Cr independent turnover and FSSAI statutory product independence.",
  },
  {
    category: "SURROGATE_TOBACCO",
    ruleCode: "COTPA-SURR-TOB",
    ruleTitle: "Prohibited Surrogate Pan Masala & Tobacco Ad",
    statutoryCitation: "COTPA 2003 Section 5 & CCPA Guidelines (2022) Guideline 9(2)",
    penaltyInr: 1000000,
    restrictedBrands: [
      "vimal",
      "kamla pasand",
      "rajnigandha",
      "dilbagh",
      "pan bahar",
      "shikhar",
      "manikchand",
      "v1",
      "rajshree",
      "chaini khaini",
      "zubaan kesari",
      "miraj",
      "gutkha",
      "pan parag",
      "hukum",
    ],
    innocuousExtensions: [
      "silver elaichi",
      "elaichi",
      "mouth freshener",
      "kesar candy",
      "cardamom seeds",
      "paan flavour",
      "silver pearls",
      "scent",
      "supari",
      "meetha pan",
    ],
    explanation:
      "Indirect advertising of restricted tobacco/pan masala products disguised as mouth fresheners, silver pearls, or elaichi using identical trademark architecture.",
    suggestedAction:
      "Strictly prohibited under COTPA Section 5. Cease advertising master brand trademarks across all digital and print channels.",
  },
  {
    category: "SURROGATE_BETTING",
    ruleCode: "MEITY-BETTING-01",
    ruleTitle: "Illegal Offshore Betting Surrogate Promotion",
    statutoryCitation: "Promotion and Regulation of Online Gaming Act, 2025 (Act 32 of 2025)",
    penaltyInr: 1000000,
    restrictedBrands: [
      "1xbet",
      "parimatch",
      "fairplay",
      "lotus365",
      "betway",
      "dafabet",
      "stake",
      "wolf777",
      "khelplay",
      "melbet",
      "mostbet",
      "winbuzz",
      "mahadev",
      "dafanews",
      "bajivn",
      "cricket bet 9",
    ],
    innocuousExtensions: [
      "news",
      "sports news",
      "news portal",
      "sports magazine",
      "prediction league",
      "gaming community",
      "sports updates",
      "cricket analysis",
      "live scores app",
      "sports club",
    ],
    explanation:
      "Offshore illegal sports betting platform promoted via surrogate 'News Portal' or 'Sports Analysis' brand extensions in direct defiance of Ministry of Information and Broadcasting (MIB) and MeitY directives.",
    suggestedAction:
      "Immediate campaign takedown required. Direct statutory violation under Promotion and Regulation of Online Gaming Act, 2025 (Act 32 of 2025).",
  },
];

export interface VernacularPatternRule {
  id: string;
  ruleCode: string;
  ruleTitle: string;
  category:
    | "PREDATORY_FINTECH_PROMISE"
    | "FALSE_URGENCY_DARK_PATTERN"
    | "PROHIBITED_MAGIC_REMEDY";
  statutoryCitation: string;
  severity: "CRITICAL" | "HIGH";
  penaltyInr: number;
  regexPatterns: RegExp[];
  explanation: string;
  suggestedAction: string;
}

export const VERNACULAR_PATTERN_RULES: VernacularPatternRule[] = [
  {
    id: "HNG-FINTECH-01",
    ruleCode: "RBI-VERN-01",
    ruleTitle: "Deceptive 'Bina Document' Unregulated Credit Promise",
    category: "PREDATORY_FINTECH_PROMISE",
    statutoryCitation: "Reserve Bank of India (Digital Lending) Directions, 2025 (RBI/2025-26/36, 8 May 2025)",
    severity: "CRITICAL",
    penaltyInr: 1000000,
    regexPatterns: [
      /(bina|bagair|binaa)\s+(kisi\s+)?(document|kagaz|paper|cibil|salary\s*slip|verification|jhanjhat|magajmari)/i,
      /sirf\s+(aadhaar|aadhar|pan|mobile)\s*(do|pe|par)\s*(instant\s*)?(loan|paisa|credit)/i,
      /(chutki|jhatpat|palak\s*jhapakte|turant|fatafat)\s+(me\s+)?(loan|credit|paisa|cash)/i,
    ],
    explanation:
      "Unsubstantiated promise of unconditional loans without statutory KYC, underwriting, or credit bureau checks.",
    suggestedAction:
      "Digital pre-qualification subject to credit bureau assessment and RBI-regulated NBFC verification.",
  },
  {
    id: "HNG-FINTECH-02",
    ruleCode: "SEBI-VERN-02",
    ruleTitle: "Prohibited 'Paisa Double' / Guaranteed Return Promise",
    category: "PREDATORY_FINTECH_PROMISE",
    statutoryCitation: "SEBI (Prohibition of Fraudulent and Unfair Trade Practices relating to Securities Market) Regulations, 2003",
    severity: "CRITICAL",
    penaltyInr: 1000000,
    regexPatterns: [
      /(paisa|paise|pesa|rakam|capital|investment)\s+(double|dugna|3x|triple|pakka\s*double)/i,
      /(100%\s*pakka|pakka\s*guarantee|shartiya|jhakaas)\s*(munafa|return|profit|kamai|yields)/i,
      /(bina\s*risk|zero\s*risk)\s*(me\s+)?(paisa|crorepati|kamaye)/i,
    ],
    explanation:
      "Strict statutory prohibition on promises of guaranteed wealth doubling or risk-free investment returns.",
    suggestedAction:
      "Mutual fund and market investments are subject to market risks. Read all scheme related documents carefully.",
  },
  {
    id: "HNG-DARK-01",
    ruleCode: "CCPA-DARK-URGENCY",
    ruleTitle: "CCPA False Urgency & Manufactured Scarcity Dark Pattern",
    category: "FALSE_URGENCY_DARK_PATTERN",
    statutoryCitation: "CCPA Guidelines for Prevention of Dark Patterns (2023) Schedule 1",
    severity: "CRITICAL",
    penaltyInr: 500000,
    regexPatterns: [
      /(sirf|bas)\s*(\d+|do|teen|paanch|das|ek)\s*(minute|min|ghante|ghanta|din)\s*(bache|shesh)/i,
      /(jaldi\s*karo|der\s*mat\s*karo)\s*varna\s*(offer|mauka|chance|deal)\s*(khatam|gaya|hamesha)/i,
      /(aakhri\s*mauka|last\s*chance)\s*(miss\s*mat\s*karna|hath\s*se\s*na\s*jane\s*de)/i,
      /offer\s*hamesha\s*ke\s*liye\s*khatam/i,
      /(loot\s*lo|mahaloot|dhamaka\s*deal\s*khatam)/i,
    ],
    explanation:
      "Manufacturing artificial countdown timers or psychological panic to force immediate consumer purchasing.",
    suggestedAction:
      "State transparent commercial campaign dates (e.g. 'Campaign valid from Nov 1 to Nov 7, 2026') without false panic.",
  },
  {
    id: "HNG-MAGIC-01",
    ruleCode: "DMRA-MAGIC-01",
    ruleTitle: "Prohibited Magic Remedy 'Shartiya Ilaaj' Claim",
    category: "PROHIBITED_MAGIC_REMEDY",
    statutoryCitation: "Drugs and Magic Remedies (Objectionable Advertisements) Act 1954 Sec 3",
    severity: "CRITICAL",
    penaltyInr: 1000000,
    regexPatterns: [
      /(shartiya|100%\s*guaranteed|pakka)\s*(ilaaj|ilaj|upchar|cure|nateeja)/i,
      /(jad\s*se\s*khatam|hamesha\s*ke\s*liye\s*gayab|chamatkari\s*dawa)/i,
      /(sugar|diabetes|cancer|hair\s*fall|arthritis)\s*(hamesha\s*ke\s*liye\s*)?(theek|khatam|cure)/i,
      /(motapa\s*kam|bal\s*ugaye|pathri\s*nikale)/i,
    ],
    explanation:
      "Criminal offense under Section 3 of DMRA 1954 to claim guaranteed cures or eradication of scheduled lifestyle conditions.",
    suggestedAction:
      "Remove all cure guarantees. State: 'May support symptom management as part of a doctor-supervised wellness regimen.'",
  },
];
