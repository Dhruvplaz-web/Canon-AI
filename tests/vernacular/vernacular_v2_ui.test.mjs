import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const BASE = REPO_ROOT;
const FRONTEND_SRC = path.join(REPO_ROOT, 'frontend/src');

describe('Vernacular Matcher v2 UI & Presets Verification', () => {
  it('1. All 4 demo presets are defined with correct texts and not present in datasets', () => {
    const studioContent = fs.readFileSync(`${FRONTEND_SRC}/components/VernacularAuditStudio.tsx`, 'utf8');
    const exemplars = JSON.parse(fs.readFileSync(`${BASE}/data/vernacular_exemplars.json`, 'utf8')).entries;
    const stressTests = JSON.parse(fs.readFileSync(`${BASE}/data/vernacular_stress_tests.json`, 'utf8')).tests;

    assert.ok(studioContent.includes('DEMO_DIRECT_VIOLATION'), 'DEMO_DIRECT_VIOLATION defined');
    assert.ok(studioContent.includes('DEMO_INDIRECT_SURROGATE'), 'DEMO_INDIRECT_SURROGATE defined');
    assert.ok(studioContent.includes('DEMO_SAFE_LOOKALIKE'), 'DEMO_SAFE_LOOKALIKE defined');
    assert.ok(studioContent.includes('DEMO_HEDGED_REVIEW'), 'DEMO_HEDGED_REVIEW defined');

    const demoTexts = [
      '100% shartiya ilaj se diabetes aur motapa jad se khatam karein bina operation sirf 7 din me.',
      'Aaj ki shaam doston ke sang Kingfisher sparkling soda chilled kholo aur har shaandar lamhe ka jashn manao!',
      'Thande pudina aur taaza nimbu soda se garmi me paayein natural hydration aur taazgi. FSSAI certified organic beverage.',
      'Rajnigandha traditional festive silver gift box for family celebrations across India.',
    ];

    for (const text of demoTexts) {
      assert.ok(studioContent.includes(text), `Preset text "${text}" present in VernacularAuditStudio`);
      const inExemplars = exemplars.some(e => e.text.includes(text) || text.includes(e.text));
      assert.strictEqual(inExemplars, false, `Preset text "${text}" must not be in exemplars`);
      const inStress = stressTests.some(s => s.text.includes(text) || text.includes(s.text));
      assert.strictEqual(inStress, false, `Preset text "${text}" must not be in stress tests`);
    }
  });

  it('2. Status chips and Receipt A/B requirements are implemented', () => {
    const studioContent = fs.readFileSync(`${FRONTEND_SRC}/components/VernacularAuditStudio.tsx`, 'utf8');

    // Receipt A & B
    assert.ok(studioContent.includes('RECEIPT A: DRAFT SPAN'), 'Receipt A header rendered');
    assert.ok(studioContent.includes('RECEIPT B: STATUTORY BENCHMARK'), 'Receipt B header rendered');

    // Excerpt pending verification when quoteVerified is false
    assert.ok(studioContent.includes('Excerpt pending verification'), 'Handles unverified quote with fallback');

    // AI findings never show statute excerpt and are labelled "AI-assisted, human review required"
    assert.ok(studioContent.includes('AI-assisted, human review required'), 'AI findings labelled AI-assisted, human review required');

    // Brand-only matches show CCPA 2022 cl. 6 proviso text
    assert.ok(studioContent.includes('CCPA 2022 cl.6 proviso: brand name alone is not surrogate advertising unless the ad is otherwise objectionable'), 'Brand-only proviso rendered');

    // Status chips
    assert.ok(studioContent.includes('violation'), 'Violation chip supported');
    assert.ok(studioContent.includes('review (human review required)'), 'Review chip supported');
    assert.ok(studioContent.includes('clear'), 'Clear chip supported');

    // Source tags: rule / embedding / AI-assisted
    assert.ok(studioContent.includes('sourceTag'), 'Source tag logic present');

    // Send to review queue button
    assert.ok(studioContent.includes('Send to review queue'), 'Send to review queue button present');
    assert.ok(studioContent.includes('/api/v1/review/queue'), 'Review queue endpoint called');

    // Offline mode badge
    assert.ok(studioContent.includes('offline mode'), 'Offline mode badge present');
  });

  it('3. Obsolete statute names are eliminated from lexicon and UI fixtures', () => {
    const lexiconContent = fs.readFileSync(`${FRONTEND_SRC}/features/submissions/vernacular/vernacularLexicon.ts`, 'utf8');
    const fixturesContent = fs.readFileSync(`${FRONTEND_SRC}/features/submissions/visual/visualFixtures.ts`, 'utf8');

    assert.ok(!lexiconContent.includes('MeitY Advisory on Online Betting (2023)'), 'MeitY 2023 advisory replaced in lexicon');
    assert.ok(!lexiconContent.includes('RBI Digital Lending Guidelines (2022)'), 'RBI 2022 guidelines replaced in lexicon');
    assert.ok(!fixturesContent.includes('ASCI Brand Extension Guidelines Clause 3.2'), 'ASCI Clause 3.2 replaced in visual fixtures');
  });

  it('4. Client bundle security: no secret API keys exposed in client components or bundles', () => {
    // 1. Scan client components and features directories
    const clientDirs = [
      `${FRONTEND_SRC}/components`,
      `${FRONTEND_SRC}/features`,
      `${FRONTEND_SRC}/lib/vernacular`,
    ];

    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.ok(
            !content.includes('process.env.GEMINI_API_KEY'),
            `Forbidden: process.env.GEMINI_API_KEY exposed in client file: ${fullPath}`
          );
          assert.ok(
            !content.includes('process.env.OPENAI_API_KEY'),
            `Forbidden: process.env.OPENAI_API_KEY exposed in client file: ${fullPath}`
          );
          assert.ok(
            !content.includes('process.env.GROQ_API_KEY'),
            `Forbidden: process.env.GROQ_API_KEY exposed in client file: ${fullPath}`
          );
        }
      }
    }

    for (const dir of clientDirs) {
      if (fs.existsSync(dir)) scanDir(dir);
    }

    // 2. Scan built client static assets if .next exists
    const staticDir = path.join(REPO_ROOT, 'frontend/.next/static');
    if (fs.existsSync(staticDir)) {
      function scanStatic(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) scanStatic(fullPath);
          else if (/\.(js)$/.test(entry.name)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            assert.ok(!content.includes('GEMINI_API_KEY'), `Secret key name leaked in client static asset: ${fullPath}`);
          }
        }
      }
      scanStatic(staticDir);
    }
  });
});
