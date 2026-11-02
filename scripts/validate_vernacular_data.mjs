#!/usr/bin/env node
/**
 * validate_vernacular_data.mjs  v2.1
 * Zero-dependency validator for the three vernacular data files.
 * Exit 0 = all checks pass. Exit 1 = one or more failures.
 *
 * Usage (run from repo root):
 *   node scripts/validate_vernacular_data.mjs
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dir, "..");

const PATHS = {
  exemplars:    resolve(ROOT, "data/vernacular_exemplars.json"),
  conceptGroups:resolve(ROOT, "data/vernacular_concept_groups.json"),
  stressTests:  resolve(ROOT, "data/vernacular_stress_tests.json"),
};

// ── Known codes ───────────────────────────────────────────────────────────────
const KNOWN_CATEGORIES = new Set([
  "SURROGATE_ALCOBEV","SURROGATE_TOBACCO","SURROGATE_BETTING",
  "PREDATORY_FINTECH_PROMISE","FALSE_URGENCY_DARK_PATTERN","PROHIBITED_MAGIC_REMEDY",
]);
const KNOWN_RULE_CODES = new Set([
  "ASCI-SURR-ALCO","COTPA-SURR-TOB","MEITY-BETTING-01",
  "RBI-VERN-01","SEBI-VERN-02","CCPA-DARK-URGENCY","DMRA-MAGIC-01",
]);
const VALID_STYLES_VIOLATION = new Set([
  "direct_branded","indirect_no_brand","non_latin_script","slangy_short","polite_disguised",
]);
const VALID_SCRIPTS   = new Set(["romanized","devanagari","tamil","bengali","mixed"]);
const VALID_LANGUAGES = new Set(["hinglish","hindi","marathi","tanglish","banglish","english","bengali","tamil"]);
const VALID_SEVERITIES= new Set(["CRITICAL","WARNING","INFO"]);
const NON_LATIN_SCRIPTS = new Set(["devanagari","tamil","bengali"]);

const REQUIRED_GROUPS = [
  "MONEY_GAIN","GUARANTEE","NO_DOCUMENTS","URGENCY","BETTING_PLAY",
  "ALCOHOL_HINT","TOBACCO_HINT","CURE_CLAIM","INNOCENT_PRODUCT",
  "MONEY_GAIN_WEAK","SPEED","LOAN_CREDIT","INVESTMENT_SCHEME","TIMER_PATTERNS",
];

const REQUIRED_STATUTE_FIELDS = [
  "statute_id", "name", "provision", "instrument_type", "binding", "status",
  "source_quality", "url_status", "replaced_from", "notes", "action_for_human",
  "verbatim_excerpt", "verified_by", "verified_on", "quote_verified"
];

const VALID_INSTRUMENT_TYPES = new Set(["statute", "regulation", "guideline", "self_regulatory_code"]);
const VALID_STATUSES         = new Set(["in_force", "repealed", "draft_only_seen"]);
const VALID_SOURCE_QUALITIES = new Set(["primary_opened", "secondary_only"]);
const VALID_URL_STATUSES     = new Set(["confirmed_opened", "seen_in_footnote_unconfirmed", "to_find"]);

const FORBIDDEN_NAME_SUBSTRINGS = ["MeitY Advisory", "SEBI Advertisement Code", "Digital Lending Guidelines 2022"];
const EXPECTED_TEXT_HASH = "8608f8a0797d6959967757a3de524b37babd3c2f64525907ea788afe5cf98555";

// ── Helpers ───────────────────────────────────────────────────────────────────
let failures = 0;
let warnings = 0;

function fail(msg) { console.error(`  ✗ FAIL  ${msg}`); failures++; }
function warn(msg) { console.warn( `  ⚠ WARN  ${msg}`); warnings++; }
function pass(msg) { console.log(  `  ✓       ${msg}`); }
function section(t) {
  console.log(`\n${"═".repeat(72)}`);
  console.log(`  ${t}`);
  console.log(`${"═".repeat(72)}`);
}
function loadJson(label, path) {
  if (!existsSync(path)) { fail(`File not found: ${path}`); process.exit(1); }
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch(e) { fail(`Invalid JSON in ${label}: ${e.message}`); process.exit(1); }
}

// ── Load ──────────────────────────────────────────────────────────────────────
section("0. FILE EXISTENCE & JSON PARSE");
const exData  = loadJson("vernacular_exemplars.json",      PATHS.exemplars);
const cgData  = loadJson("vernacular_concept_groups.json", PATHS.conceptGroups);
const stData  = loadJson("vernacular_stress_tests.json",   PATHS.stressTests);
pass("All 3 files found and parsed as valid JSON");

// ════════════════════════════════════════════════════════════════════════════
// FILE 1: vernacular_exemplars.json
// ════════════════════════════════════════════════════════════════════════════
section("1. vernacular_exemplars.json");

// 1a. Top-level keys
for (const k of ["version","statutes","verification_notes","entries"])
  if (exData[k] === undefined) fail(`Missing top-level key: ${k}`);
pass(`version = "${exData.version}"`);

// 1b. Text Hash Invariant Check
const entries = exData.entries || [];
const currentTexts = entries.map((e) => e.text).join("\x00");
const currentHash = crypto.createHash("sha256").update(currentTexts, "utf8").digest("hex");
if (currentHash === EXPECTED_TEXT_HASH) {
  pass("ENTRY TEXT UNCHANGED: OK");
} else {
  fail(`ENTRY TEXT HASH MISMATCH! Expected ${EXPECTED_TEXT_HASH}, got ${currentHash}`);
}

// 1c. Statutes array schema and validation
const statutes = exData.statutes || [];
pass(`statutes count = ${statutes.length}`);
if (statutes.length < 1) fail("statutes array is empty");
const statuteIds = new Set();
const repealedStatuteIds = new Set();

statutes.forEach((s, i) => {
  REQUIRED_STATUTE_FIELDS.forEach((f) => {
    if (!(f in s)) fail(`statute[${i}] (${s.statute_id || i}) missing field: ${f}`);
  });

  if (s.instrument_type && !VALID_INSTRUMENT_TYPES.has(s.instrument_type))
    fail(`statute ${s.statute_id}: invalid instrument_type "${s.instrument_type}"`);
  if (s.status && !VALID_STATUSES.has(s.status))
    fail(`statute ${s.statute_id}: invalid status "${s.status}"`);
  if (s.source_quality && !VALID_SOURCE_QUALITIES.has(s.source_quality))
    fail(`statute ${s.statute_id}: invalid source_quality "${s.source_quality}"`);
  if (s.url_status && !VALID_URL_STATUSES.has(s.url_status))
    fail(`statute ${s.statute_id}: invalid url_status "${s.url_status}"`);
  if (typeof s.binding !== "boolean")
    fail(`statute ${s.statute_id}: binding must be boolean, got ${typeof s.binding}`);

  if (statuteIds.has(s.statute_id)) fail(`Duplicate statute_id: ${s.statute_id}`);
  statuteIds.add(s.statute_id);

  if (s.status === "repealed") repealedStatuteIds.add(s.statute_id);

  // Verbatim excerpt check: must be empty unless quote_verified is true AND verified_by and verified_on are non-empty
  if (s.verbatim_excerpt !== "") {
    if (!s.quote_verified || !s.verified_by || !s.verified_on) {
      fail(`statute ${s.statute_id}: verbatim_excerpt is non-empty but quote_verified=false or verified_by/verified_on empty`);
    }
  } else {
    warn(`UNVERIFIED statute: ${s.statute_id} (${s.name}) — verbatim_excerpt is empty`);
  }

  // Statute names must not contain old or wrong names
  FORBIDDEN_NAME_SUBSTRINGS.forEach((sub) => {
    if ((s.name || "").includes(sub)) {
      fail(`statute ${s.statute_id} name contains obsolete phrase "${sub}" (allowed only in replaced_from)`);
    }
  });
});
pass("Statutes array schema, enums, and naming constraints valid");

// 1d. Entries validation
pass(`Total entries = ${entries.length}`);

// Unique IDs
const exemplarIds = new Set();
entries.forEach((e, i) => {
  if (!e.id) fail(`Entry[${i}] missing id`);
  if (exemplarIds.has(e.id)) fail(`Duplicate id: ${e.id}`);
  exemplarIds.add(e.id);
});
pass("All entry IDs unique");

// Required fields; forbidden fields; enum checks; statute resolution
const REQUIRED_ENTRY_FIELDS = [
  "id","text","script","language","label","category","rule_code",
  "concept_id","style","statute","statute_id","ai_explanation_draft",
  "severity","explanation","paired_with","split",
];

entries.forEach((e) => {
  REQUIRED_ENTRY_FIELDS.forEach((f) => { if (!(f in e)) fail(`${e.id} missing field: ${f}`); });
  if ("receipt_b_quote" in e) fail(`${e.id} still has forbidden field receipt_b_quote`);
  if ("quote_verified"  in e) fail(`${e.id} still has forbidden field quote_verified`);
  if (e.script   && !VALID_SCRIPTS.has(e.script))    fail(`${e.id}: unknown script "${e.script}"`);
  if (e.language && !VALID_LANGUAGES.has(e.language)) fail(`${e.id}: unknown language "${e.language}"`);
  if (e.severity && !VALID_SEVERITIES.has(e.severity)) fail(`${e.id}: unknown severity "${e.severity}"`);
  
  if (!statuteIds.has(e.statute_id)) fail(`${e.id}: statute_id "${e.statute_id}" not in statutes array`);

  // No statute with status "repealed" used as primary statute_id
  if (repealedStatuteIds.has(e.statute_id)) {
    fail(`${e.id}: uses repealed statute "${e.statute_id}" as primary statute_id`);
  }

  // secondary_statute_ids validation
  if (e.secondary_statute_ids) {
    if (!Array.isArray(e.secondary_statute_ids)) {
      fail(`${e.id}: secondary_statute_ids must be an array`);
    } else {
      e.secondary_statute_ids.forEach((sid) => {
        if (!statuteIds.has(sid)) fail(`${e.id}: secondary_statute_id "${sid}" not in statutes array`);
      });
    }
  }

  // provision_override appears only on DMRA entries (STAT-007)
  if ("provision_override" in e) {
    if (e.statute_id !== "STAT-007") {
      fail(`${e.id}: provision_override appears on non-DMRA entry (${e.statute_id})`);
    }
  }

  if (e.label === "violation") {
    if (!KNOWN_CATEGORIES.has(e.category)) fail(`${e.id}: unknown category "${e.category}"`);
    if (!KNOWN_RULE_CODES.has(e.rule_code)) fail(`${e.id}: unknown rule_code "${e.rule_code}"`);
  }
});
pass("All entries: required fields present, forbidden fields absent, enums valid, statute_ids resolve");

// Counts
const violations = entries.filter((e) => e.label === "violation");
const safes      = entries.filter((e) => e.label === "safe");
pass(`Violations = ${violations.length} (expected 60)`);
pass(`Safe look-alikes = ${safes.length} (expected 24)`);
if (violations.length !== 60) fail(`Expected 60 violations, got ${violations.length}`);
if (safes.length !== 24)      fail(`Expected 24 safe entries, got ${safes.length}`);

// 5 styles per concept_id
const conceptMap = {};
violations.forEach((e) => {
  if (!e.concept_id) fail(`Violation ${e.id} missing concept_id`);
  conceptMap[e.concept_id] = conceptMap[e.concept_id] || new Set();
  conceptMap[e.concept_id].add(e.style);
});
Object.entries(conceptMap).forEach(([cid, styles]) => {
  if (styles.size !== 5)
    fail(`Concept ${cid} has ${styles.size}/5 styles: [${[...styles].join(", ")}]`);
});
pass(`Concept style coverage: ${Object.keys(conceptMap).length} concepts × 5 styles`);

// Splits
const tuneE = entries.filter((e) => e.split === "tune");
const testE = entries.filter((e) => e.split === "test");
pass(`Split — tune: ${tuneE.length}, test: ${testE.length}`);
const tuneRatio = tuneE.length / entries.length;
if (tuneRatio < 0.45 || tuneRatio > 0.70) warn(`Tune ratio ${(tuneRatio*100).toFixed(1)}% outside 45-70% range`);

[...KNOWN_CATEGORIES].forEach((cat) => {
  const inTune = tuneE.some((e) => e.category === cat);
  const inTest = testE.some((e) => e.category === cat);
  if (!inTune) fail(`Category ${cat} missing from tune split`);
  if (!inTest) fail(`Category ${cat} missing from test split`);
});
pass("All 6 categories present in both splits");

const tuneStyles = new Set(tuneE.map((e) => e.style).filter((s) => VALID_STYLES_VIOLATION.has(s)));
const testStyles = new Set(testE.map((e) => e.style).filter((s) => VALID_STYLES_VIOLATION.has(s)));
VALID_STYLES_VIOLATION.forEach((s) => {
  if (!tuneStyles.has(s)) fail(`Style ${s} missing from tune split`);
  if (!testStyles.has(s)) fail(`Style ${s} missing from test split`);
});
pass("All 5 violation styles present in both splits");

// Non-Latin count
const nonLatinCount = entries.filter((e) => NON_LATIN_SCRIPTS.has(e.script)).length;
pass(`Non-Latin script entries = ${nonLatinCount} (minimum 12 required)`);
if (nonLatinCount < 12) fail(`Need ≥12 non-Latin script entries, found ${nonLatinCount}`);

// Language check
const EXPECTED_LANG = new Map([
  ["VERN-008","bengali"],["VERN-031","bengali"],["VERN-036","tamil"],
  ["VERN-041","tamil"],  ["VERN-050","tamil"],  ["VERN-064","bengali"],["VERN-078","tamil"],
]);
EXPECTED_LANG.forEach((lang, id) => {
  const e = entries.find((e) => e.id === id);
  if (!e) { fail(`Entry ${id} not found`); return; }
  if (e.language !== lang) fail(`${id}: expected language "${lang}", got "${e.language}"`);
});
pass("Language labels verified for Bengali/Tamil script entries");

// needs_review check
const EXPECTED_NEEDS_REVIEW = new Set([
  "VERN-002","VERN-007","VERN-010","VERN-016","VERN-019","VERN-021",
  "VERN-024","VERN-056","VERN-061","VERN-063","VERN-066","VERN-073",
  "VERN-077","VERN-078","VERN-080"
]);
EXPECTED_NEEDS_REVIEW.forEach((id) => {
  const e = entries.find((e) => e.id === id);
  if (!e) { fail(`Entry ${id} not found`); return; }
  if (!e.needs_review) fail(`${id}: expected needs_review: true`);
});
pass(`All ${EXPECTED_NEEDS_REVIEW.size} needs_review entries flagged`);

// Brand replacement check
const vern039 = entries.find((e) => e.id === "VERN-039");
const vern042 = entries.find((e) => e.id === "VERN-042");
if (vern039 && (vern039.text.includes("CricBuzz") || vern039.text.includes("Cricbuzz")))
  fail("VERN-039: real brand 'CricBuzz' not replaced");
else pass("VERN-039 brand replaced");
if (vern042 && vern042.text.includes("Sports Illustrated"))
  fail("VERN-042: real brand 'Sports Illustrated' not replaced");
else pass("VERN-042 brand replaced");

// paired_with cross-references
safes.forEach((e) => {
  if (e.paired_with && !exemplarIds.has(e.paired_with))
    fail(`Safe ${e.id} paired_with "${e.paired_with}" not found`);
});
pass("All paired_with references resolve");

// verification_notes check
const notes = exData.verification_notes || [];
pass(`verification_notes count = ${notes.length}`);
const mustHaveNotes = [
  "CCPA Dark Patterns: list of patterns is in Annexure 1, not Schedule 1",
  "DMRA 1954: the Act has one Schedule; VERN-076 mentions Schedule 3",
  "VERN-056 is filed under a SEBI rule but is a bank deposit",
  "Statute records were rebuilt on",
  "CCPA 2022 clause 6 proviso",
  "DMRA: baldness and arthritis are not scheduled",
  "RBI Directions bind regulated entities, not advertisers generally",
  "Dark Patterns: only the draft was seen on the official site",
  "ASCI clause numbers come from secondary sources only"
];
mustHaveNotes.forEach((n) => {
  if (!notes.some((note) => note.includes(n)))
    fail(`verification_notes missing required note containing: "${n}"`);
});
pass("All required verification_notes present");

// Statutes Summary Table
console.log("\n  Statutes summary table:");
console.log("  " + "statute_id".padEnd(11) + " | " + "status".padEnd(10) + " | " + "source_quality".padEnd(15) + " | " + "entries".padEnd(8) + " | " + "name");
console.log("  " + "-".repeat(11) + "-+-" + "-".repeat(10) + "-+-" + "-".repeat(15) + "-+-" + "-".repeat(8) + "-+-" + "-".repeat(45));
statutes.forEach((s) => {
  const pCount = entries.filter((e) => e.statute_id === s.statute_id).length;
  const sCount = entries.filter((e) => (e.secondary_statute_ids || []).includes(s.statute_id)).length;
  const countStr = sCount > 0 ? `${pCount} (+${sCount}s)` : String(pCount);
  console.log("  " + s.statute_id.padEnd(11) + " | " + s.status.padEnd(10) + " | " + s.source_quality.padEnd(15) + " | " + countStr.padEnd(8) + " | " + s.name);
});

// ════════════════════════════════════════════════════════════════════════════
// FILE 2: vernacular_concept_groups.json
// ════════════════════════════════════════════════════════════════════════════
section("2. vernacular_concept_groups.json");

// Top-level keys
for (const k of ["version","restricted_brands","cannot_override_groups","groups","combination_rules","safe_blockers","regression_cases"])
  if (cgData[k] === undefined) fail(`Missing top-level key: ${k}`);
pass(`version = "${cgData.version}"`);

// cannot_override_groups
const cannotOvr = cgData.cannot_override_groups || [];
["GUARANTEE","CURE_CLAIM","MONEY_GAIN"].forEach((g) => {
  if (!cannotOvr.includes(g)) fail(`cannot_override_groups missing: ${g}`);
});
pass(`cannot_override_groups: ${cannotOvr.join(", ")}`);

// restricted_brands
const rb = cgData.restricted_brands || {};
["SURROGATE_ALCOBEV","SURROGATE_TOBACCO","SURROGATE_BETTING"].forEach((cat) => {
  if (!rb[cat] || !Array.isArray(rb[cat])) fail(`restricted_brands missing category: ${cat}`);
  else pass(`restricted_brands.${cat}: ${rb[cat].length} brands`);
});

// Groups
const groups = cgData.groups || [];
pass(`Groups count = ${groups.length} (expected ≥14)`);
if (groups.length < 14) fail(`Need ≥14 groups, found ${groups.length}`);

const groupIds = new Set(groups.map((g) => g.id));
REQUIRED_GROUPS.forEach((gid) => {
  if (!groupIds.has(gid)) fail(`Required group missing: ${gid}`);
});
pass("All 14 required groups present");

// Every group has "match"
groups.forEach((g) => {
  if (!g.id)          fail(`Group missing id`);
  if (!g.description) fail(`Group ${g.id} missing description`);
  if (!Array.isArray(g.words)) fail(`Group ${g.id} missing words array`);
  if (!g.match)       fail(`Group ${g.id} missing "match" field`);
  if (g.id !== "TIMER_PATTERNS" && g.id !== "MONEY_GAIN_WEAK" && g.words.length < 10)
    warn(`Group ${g.id} has only ${g.words.length} words (recommend ≥15)`);
  if (!Array.isArray(g.scripts_included)) fail(`Group ${g.id} missing scripts_included`);
});
pass("All groups have match, description, words, scripts_included");

// MONEY_GAIN_WEAK must NOT be used alone as sole partner
const combRules = cgData.combination_rules || [];
combRules.forEach((r) => {
  const req = r.requires_all_of || [];
  if (req.length === 1 && req[0] === "MONEY_GAIN_WEAK")
    fail(`Rule ${r.id}: MONEY_GAIN_WEAK cannot be the sole group in requires_all_of`);
  if (req.length === 2 && req.every((g) => g === "MONEY_GAIN_WEAK"))
    fail(`Rule ${r.id}: MONEY_GAIN_WEAK cannot be paired only with itself`);
  if (!req.includes("INNOCENT_PRODUCT") || req.length > 1) {
    // only fail if INNOCENT_PRODUCT is the SOLE trigger
  } else {
    if (req.length === 1 && req[0] === "INNOCENT_PRODUCT")
      fail(`Rule ${r.id}: INNOCENT_PRODUCT cannot be the sole trigger`);
  }
});
pass("MONEY_GAIN_WEAK not used as sole trigger; INNOCENT_PRODUCT not sole trigger in any rule");

// All 6 categories covered
pass(`Combination rules count = ${combRules.length} (expected ≥12)`);
if (combRules.length < 12) fail(`Need ≥12 combination rules, found ${combRules.length}`);

const combCats = new Set(combRules.map((r) => r.category).filter(Boolean));
KNOWN_CATEGORIES.forEach((cat) => {
  if (!combCats.has(cat)) fail(`Category ${cat} not covered by any combination rule`);
});
pass("All 6 categories covered by combination rules");

// Deleted rules check
["CG-008","CG-010","CG-013"].forEach((id) => {
  if (combRules.some((r) => r.id === id)) fail(`Rule ${id} should have been deleted but still exists`);
});
pass("Rules CG-008, CG-010, CG-013 successfully deleted");

// CG-016 present
const cg016 = combRules.find((r) => r.id === "CG-016");
if (!cg016) fail("CG-016 missing");
else {
  if (cg016.category !== "FALSE_URGENCY_DARK_PATTERN") fail("CG-016 wrong category");
  if (cg016.severity !== "WARNING") fail("CG-016 should be WARNING severity");
  if (cg016.confidence !== "medium") fail("CG-016 should be medium confidence");
  pass("CG-016 present and correctly configured");
}

// Rule group references resolve
const ruleIds = new Set();
combRules.forEach((r, i) => {
  if (!r.id) fail(`Rule[${i}] missing id`);
  if (ruleIds.has(r.id)) fail(`Duplicate rule id: ${r.id}`);
  ruleIds.add(r.id);
  (r.requires_all_of || []).forEach((gid) => {
    if (!groupIds.has(gid)) fail(`Rule ${r.id} references unknown group: ${gid}`);
  });
  if (r.category && !KNOWN_CATEGORIES.has(r.category)) fail(`Rule ${r.id}: unknown category "${r.category}"`);
  if (r.rule_code && !KNOWN_RULE_CODES.has(r.rule_code)) fail(`Rule ${r.id}: unknown rule_code "${r.rule_code}"`);
  // statute_id must be in statutes array
  if (r.statute_id && !statuteIds.has(r.statute_id))
    fail(`Rule ${r.id}: statute_id "${r.statute_id}" not in statutes array`);
  // anchor_group must resolve
  if (r.anchor_group && !groupIds.has(r.anchor_group))
    fail(`Rule ${r.id}: anchor_group "${r.anchor_group}" not in groups`);
  // no receipt_b_quote or quote_verified
  if ("receipt_b_quote" in r) fail(`Rule ${r.id}: still has forbidden field receipt_b_quote`);
  if ("quote_verified"  in r) fail(`Rule ${r.id}: still has forbidden field quote_verified`);
});
pass("All rule IDs unique; group/category/rule_code/statute_id references resolve; forbidden fields absent");

// CG-001 has anchor_group INVESTMENT_SCHEME
const cg001 = combRules.find((r) => r.id === "CG-001");
if (!cg001) fail("CG-001 missing");
else if (cg001.anchor_group !== "INVESTMENT_SCHEME") fail("CG-001 anchor_group must be INVESTMENT_SCHEME");
else pass("CG-001 anchor_group = INVESTMENT_SCHEME");

// CG-002, CG-011 have anchor_group LOAN_CREDIT
["CG-002","CG-011"].forEach((id) => {
  const r = combRules.find((r) => r.id === id);
  if (!r) fail(`${id} missing`);
  else if (r.anchor_group !== "LOAN_CREDIT") fail(`${id} anchor_group must be LOAN_CREDIT, got "${r.anchor_group}"`);
  else pass(`${id} anchor_group = LOAN_CREDIT`);
});

// Legal caveats on brand rules
["CG-003", "CG-004"].forEach((id) => {
  const r = combRules.find((r) => r.id === id);
  if (!r) fail(`${id} missing`);
  else if (!r.legal_caveat || !r.legal_caveat.includes("proviso")) {
    fail(`${id}: missing legal_caveat regarding CCPA 2022 proviso`);
  }
});
pass("Legal caveats present on CG-003 and CG-004");

// Safe blockers
const safeBlockers = cgData.safe_blockers || [];
pass(`Safe blockers count = ${safeBlockers.length}`);
if (safeBlockers.length < 8) fail(`Expected ≥8 safe blockers, found ${safeBlockers.length}`);
const expectedPhrases = ["RBI registered NBFC","subject to market risks","T&Cs apply","terms & conditions apply","consult a doctor","consult a physician","नियम और शर्तें लागू"];
expectedPhrases.forEach((p) => {
  if (!safeBlockers.some((sb) => sb.phrase === p))
    fail(`safe_blockers missing phrase: "${p}"`);
});
safeBlockers.forEach((sb, i) => {
  if (!sb.phrase)  fail(`safe_blocker[${i}] missing phrase`);
  if (!sb.note)    fail(`safe_blocker[${i}] missing note`);
  if (!sb.effect)  fail(`safe_blocker[${i}] missing effect`);
  if (sb.effect === "suppress") fail(`safe_blocker[${i}] effect must not be "suppress"; use "downgrade_to_review"`);
});
pass("All safe blockers have phrase, note, effect; no suppress effect");

// regression_cases
const rc = cgData.regression_cases;
if (!rc) fail("regression_cases missing");
else {
  if (!Array.isArray(rc.must_not_fire) || rc.must_not_fire.length < 6)
    fail(`must_not_fire must have ≥6 entries, found ${(rc.must_not_fire||[]).length}`);
  if (!Array.isArray(rc.must_fire) || rc.must_fire.length < 3)
    fail(`must_fire must have ≥3 entries, found ${(rc.must_fire||[]).length}`);
  pass(`regression_cases: must_not_fire=${rc.must_not_fire.length}, must_fire=${rc.must_fire.length}`);
}

// TIMER_PATTERNS has match: "regex"
const tpGroup = groups.find((g) => g.id === "TIMER_PATTERNS");
if (!tpGroup) fail("TIMER_PATTERNS group missing");
else if (tpGroup.match !== "regex") fail(`TIMER_PATTERNS must have match: "regex", got "${tpGroup.match}"`);
else pass("TIMER_PATTERNS match = regex");

// Removed words not in any non-TIMER group
const REMOVED_WORDS_ALL = ["chilled","fixed","sure","definitely","double","cash","returns","profit","yield",
  "khel","shesh","cheers","limited time","dawa","jhakaas","महफिल","bottled at source","live score app","sports updates app"];
const ALLOWED_IN_WEAK = new Set(["double","cash","returns","profit","yield"]);
groups.filter((g) => g.id !== "TIMER_PATTERNS").forEach((g) => {
  REMOVED_WORDS_ALL.forEach((w) => {
    if ((g.words || []).includes(w)) {
      if (g.id === "MONEY_GAIN_WEAK" && ALLOWED_IN_WEAK.has(w)) return;
      fail(`Word "${w}" still present in group ${g.id} (should have been removed)`);
    }
  });
});
pass("All removed words absent from non-TIMER groups (MONEY_GAIN_WEAK correctly holds the weak words)");

// ════════════════════════════════════════════════════════════════════════════
// FILE 3: vernacular_stress_tests.json
// ════════════════════════════════════════════════════════════════════════════
section("3. vernacular_stress_tests.json");

for (const k of ["version","instructions","teammate_submissions","tests"])
  if (stData[k] === undefined) fail(`Missing top-level key: ${k}`);
pass(`version = "${stData.version}"`);

const tests = stData.tests || [];
pass(`Total tests = ${tests.length} (expected 30)`);
if (tests.length !== 30) fail(`Expected 30 stress tests, got ${tests.length}`);

const stressIds = new Set();
tests.forEach((t, i) => {
  if (!t.id) fail(`Test[${i}] missing id`);
  if (stressIds.has(t.id)) fail(`Duplicate stress test id: ${t.id}`);
  stressIds.add(t.id);
});
pass("All stress test IDs unique");

const REQUIRED_TEST_FIELDS = ["id","text","script","language","expected","difficulty","expected_layer","note"];
tests.forEach((t) => {
  REQUIRED_TEST_FIELDS.forEach((f) => { if (!(f in t)) fail(`Test ${t.id} missing field: ${f}`); });
  if (t.script   && !VALID_SCRIPTS.has(t.script))    fail(`Test ${t.id}: unknown script "${t.script}"`);
  if (t.language && !VALID_LANGUAGES.has(t.language)) fail(`Test ${t.id}: unknown language "${t.language}"`);
});
pass("All stress tests have required fields and valid enum values");

const diffCounts={};
tests.forEach((t)=>{diffCounts[t.difficulty]=(diffCounts[t.difficulty]||0)+1});
console.log("\n  Difficulty distribution:");
Object.entries(diffCounts).forEach(([k,v])=>console.log(`    ${k}: ${v}`));
if ((diffCounts["paraphrase"]||0) < 10)     fail(`Need ≥10 paraphrase tests`);
if ((diffCounts["needs_ai"]  ||0) < 4)      fail(`Need ≥4 needs_ai tests`);
if ((diffCounts["safe_lookalike"]||0) < 10) fail(`Need ≥10 safe_lookalike tests`);
const spellingOrMixed = (diffCounts["spelling_trick"]||0) + (diffCounts["mixed_script"]||0);
if (spellingOrMixed < 6) fail(`Need ≥6 spelling_trick+mixed_script tests, found ${spellingOrMixed}`);
pass("Difficulty distribution meets requirements");

// Zero text overlap with exemplars
const exemplarTexts = new Set(entries.map((e) => e.text.trim().toLowerCase()));
tests.forEach((t) => {
  if (exemplarTexts.has((t.text||"").trim().toLowerCase()))
    fail(`Stress test ${t.id} text duplicates an exemplar: "${t.text}"`);
});
pass("Zero text overlap between stress tests and exemplars");

// Violation stress tests have valid codes
tests.filter((t) => t.expected === "violation").forEach((t) => {
  if (t.category   && !KNOWN_CATEGORIES.has(t.category))  fail(`Test ${t.id}: unknown category "${t.category}"`);
  if (t.rule_code  && !KNOWN_RULE_CODES.has(t.rule_code)) fail(`Test ${t.id}: unknown rule_code "${t.rule_code}"`);
});
pass("All violation stress tests have valid category and rule_code");

// ════════════════════════════════════════════════════════════════════════════
// CROSS-FILE: Statute ID consistency
// ════════════════════════════════════════════════════════════════════════════
section("4. CROSS-FILE STATUTE ID CONSISTENCY");

const usedStatuteIds = new Set([
  ...entries.map((e) => e.statute_id).filter(Boolean),
  ...combRules.map((r) => r.statute_id).filter(Boolean),
]);
usedStatuteIds.forEach((sid) => {
  if (!statuteIds.has(sid))
    fail(`statute_id "${sid}" used in data but not defined in statutes array`);
});
pass(`All ${usedStatuteIds.size} distinct primary statute_ids resolve to statutes array entries`);

// ════════════════════════════════════════════════════════════════════════════
// VERIFICATION NOTES DISPLAY
// ════════════════════════════════════════════════════════════════════════════
section("5. VERIFICATION NOTES (from vernacular_exemplars.json)");
(exData.verification_notes || []).forEach((note, i) =>
  console.log(`  [${String(i + 1).padStart(2)}] ${note}`)
);

// ════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ════════════════════════════════════════════════════════════════════════════
section("SUMMARY");
console.log(`  Files validated          : 3`);
console.log(`  Statutes defined         : ${statutes.length}`);
console.log(`  Exemplar entries         : ${entries.length} (60 violations + 24 safe)`);
console.log(`  Concept groups           : ${groups.length}`);
console.log(`  Combination rules        : ${combRules.length}`);
console.log(`  Safe blockers            : ${safeBlockers.length}`);
console.log(`  Stress tests             : ${tests.length}`);
console.log(`  Non-Latin entries        : ${nonLatinCount}`);
console.log(`  Failures                 : ${failures}`);
console.log(`  Warnings                 : ${warnings}`);

if (failures === 0) console.log("\n  ✅  ALL CHECKS PASSED");
else                console.log(`\n  ❌  ${failures} CHECK(S) FAILED`);

process.exit(failures === 0 ? 0 : 1);
