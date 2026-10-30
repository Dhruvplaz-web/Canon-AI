/**
 * Indian Statutory Vernacular & Surrogate Lexicon
 * Grounded in:
 * - CCPA Misleading Advertisements Guidelines 2022 (Guideline 9: Surrogate Advertising)
 * - ASCI Code Chapter III (Prohibition of Indirect / Surrogate Advertising)
 * - CCPA Dark Patterns Guidelines 2023 (Schedule 1: False Urgency)
 * - Drugs and Magic Remedies Act 1954 (Section 3: Prohibited Claims)
 * - RBI Digital Lending Guidelines 2022 (Section 3: Regulated Entity Transparency)
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
    ],
    explanation:
      "Indirect promotion of restricted alcoholic beverages disguised under an innocuous brand extension (Club Soda/Water).",
    suggestedAction:
      "Remove alcoholic master brand trademark or furnish independent audited sales certificates proving >₹5 Cr independent turnover.",
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
    ],
    innocuousExtensions: [
      "silver elaichi",
      "elaichi",
      "mouth freshener",
      "kesar candy",
      "cardamom seeds",
      "paan flavour",
    ],
    explanation:
      "Indirect advertising of restricted tobacco/pan masala products disguised as mouth fresheners or silver elaichi.",
    suggestedAction:
      "Prohibited under COTPA Section 5. Cease advertising master brand trademarks across digital channels.",
  },
  {
    category: "SURROGATE_BETTING",
    ruleCode: "MEITY-BETTING-01",
    ruleTitle: "Illegal Offshore Betting Surrogate Promotion",
    statutoryCitation: "MeitY Advisory on Online Betting (2023) & CCPA 2022 Guideline 9",
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
    ],
    innocuousExtensions: [
      "news",
      "sports news",
      "news portal",
      "sports magazine",
      "prediction league",
      "gaming community",
      "sports updates",
    ],
    explanation:
      "Offshore illegal sports betting platform promoted via surrogate 'News' or 'Sports Portal' brand extensions.",
    suggestedAction:
      "Immediate deletion required. Direct statutory violation under MeitY 2023 and Public Gambling Act.",
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
    statutoryCitation: "RBI Digital Lending Guidelines (2022) & CCPA 2022 Section 4",
    severity: "CRITICAL",
    penaltyInr: 1000000,
    regexPatterns: [
      /(bina|bagair|binaa)\s+(kisi\s+)?(document|kagaz|paper|cibil|salary\s*slip|verification)/i,
      /sirf\s+(aadhaar|aadhar|pan|mobile)\s*(do|pe|par)\s*(instant\s*)?(loan|paisa|credit)/i,
      /(chutki|jhatpat|palak\s*jhapakte|turant)\s+(me\s+)?(loan|credit|paisa|cash)/i,
    ],
    explanation:
      "Unsubstantiated promise of unconditional loans without statutory KYC, underwriting, or credit bureau checks.",
    suggestedAction:
      "State: 'Digital pre-qualification subject to credit bureau assessment and RBI-regulated NBFC verification.'",
  },
  {
    id: "HNG-FINTECH-02",
    ruleCode: "SEBI-VERN-02",
    ruleTitle: "Prohibited 'Paisa Double' / Guaranteed Return Promise",
    category: "PREDATORY_FINTECH_PROMISE",
    statutoryCitation: "SEBI Advertisement Code (2023) & CCPA Misleading Ads Sec 4",
    severity: "CRITICAL",
    penaltyInr: 1000000,
    regexPatterns: [
      /(paisa|paise|pesa|rakam|capital|investment)\s+(double|dugna|3x|triple|pakka\s*double)/i,
      /(100%\s*pakka|pakka\s*guarantee|shartiya)\s*(munafa|return|profit|kamai)/i,
      /(bina\s*risk|zero\s*risk)\s*(me\s+)?(paisa|crorepati|kamaye)/i,
    ],
    explanation:
      "Strict statutory prohibition on promises of guaranteed wealth doubling or risk-free investment returns.",
    suggestedAction:
      "Disclose investment risk: 'Mutual fund / equity investments are subject to market risks. Read all scheme documents carefully.'",
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
    ],
    explanation:
      "Criminal offense under Section 3 of DMRA 1954 to claim guaranteed cures or eradication of scheduled lifestyle conditions.",
    suggestedAction:
      "Remove all cure guarantees. State: 'May support symptom management as part of a doctor-supervised wellness regimen.'",
  },
];
