/**
 * Concept Groups Overlay
 * Extends vernacular concept groups, restricted brand pairings, and proximity
 * heuristics in code without modifying the canonical data JSON files.
 */

export interface GroupOverlay {
  groupId: string;
  additionalWords: string[];
}

// Additional vernacular words identified from tune split analysis
export const CONCEPT_GROUPS_OVERLAY: GroupOverlay[] = [
  {
    groupId: "ALCOHOL_HINT",
    additionalWords: [
      "festival", "blenders", "oak", "celebrations", "acoustics",
      "master blenders", "late-night", "late night", "distinguished gatherings",
      "smooth rhythm", "party pack", "bold taste", "royal spirit", "aged oak",
    ],
  },
  {
    groupId: "TOBACCO_HINT",
    additionalWords: [
      "silver elaichi", "elaichi chabao", "kattha", "kattha essence",
      "chabaao", "paan masala", "supari", "chaini candy", "mouth freshener",
      "discerning gentlemen", "dabang", "anokhi shaan",
    ],
  },
  {
    groupId: "BETTING_PLAY",
    additionalWords: [
      "khelo", "jeeto", "stake", "stake game", "fantasy challenges",
      "toss winner", "crypto earnings", "ball-by-ball", "match-winner odds",
      "session pe", "bhav", "rate", "lagao paisa",
    ],
  },
  {
    groupId: "NO_DOCUMENTS",
    additionalWords: [
      "bina kisi document", "bina document", "bank statement", "bina salary slip",
      "bina aadhar", "unconditionally", "unconditional financing",
      "without cumbersome", "employment verification", "lifestyle financing",
    ],
  },
  {
    groupId: "URGENCY",
    additionalWords: [
      "abhi le le", "mauka nikal gaya", "pachtayega", "varna", "cart checkout",
      "offer gayab", "sada ke liye samapt", "limited seats", "subsidized tariff",
      "booking privileges", "revoked", "sixty-second",
    ],
  },
  {
    groupId: "CURE_CLAIM",
    additionalWords: [
      "charbi pighlao", "zero figure", "mombatti jaise", "baldness reversal",
      "hair follicles", "adipose dissolution", "pan-metabolic", "follicular regeneration",
      "bio-resonance", "blood sugar eliminate", "diabetes ka 100% shartiya ilaj",
    ],
  },
  {
    groupId: "GUARANTEE",
    additionalWords: [
      "pakka", "shartiya", "unconditionally", "unconditionally granted",
      "deterministic", "free from market fluctuations",
    ],
  },
  {
    groupId: "MONEY_GAIN",
    additionalWords: [
      "double", "200% profit", "arbitrage", "capital appreciation",
      "kacha cash", "crypto earnings", "instant cash reward",
    ],
  },
  {
    groupId: "INNOCENT_PRODUCT",
    additionalWords: [
      "sports news portal", "sports news", "news portal", "music cd",
      "packaged drinking water", "artisanal packaged drinking water",
      "silver elaichi", "fantasy challenges", "community forum",
    ],
  },
];

// Brand extension surrogacy: pairing a restricted brand with an innocuous commodity extension
export const SURROGATE_COMMODITY_EXTENSIONS = [
  "club soda", "soda", "packaged drinking water", "drinking water", "water",
  "music cd", "music cds", "music", "elaichi", "mouth freshener", "cardamom",
  "sports news", "news portal", "news app", "scorecard", "gaming news",
];

