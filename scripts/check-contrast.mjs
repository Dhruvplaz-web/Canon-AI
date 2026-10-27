/**
 * WCAG 2.1 AA Contrast Verification Script
 * Validates token color pairs against strict accessibility guidelines.
 */

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  if (clean.length === 3) {
    const r = (num >> 8) & 0xf;
    const g = (num >> 4) & 0xf;
    const b = num & 0xf;
    return [(r << 4) | r, (g << 4) | g, (b << 4) | b];
  }
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const pairsToTest = [
  // Light Theme Pairs
  { theme: "light", name: "Text Primary on Surface", fg: "#111827", bg: "#ffffff", min: 4.5 },
  { theme: "light", name: "Text Secondary on Surface", fg: "#374151", bg: "#ffffff", min: 4.5 },
  { theme: "light", name: "Text Muted on Surface", fg: "#4b5563", bg: "#ffffff", min: 4.5 },
  { theme: "light", name: "Brand Primary on Surface", fg: "#1d4ed8", bg: "#ffffff", min: 4.5 },
  { theme: "light", name: "Text Primary on Canvas", fg: "#111827", bg: "#f8f9fa", min: 4.5 },
  { theme: "light", name: "Critical Text on Critical Bg", fg: "#b91c1c", bg: "#fef2f2", min: 4.5 },
  { theme: "light", name: "Warning Text on Warning Bg", fg: "#92400e", bg: "#fffbeb", min: 4.5 },
  { theme: "light", name: "Info Text on Info Bg", fg: "#1d4ed8", bg: "#eff6ff", min: 4.5 },
  { theme: "light", name: "Success Text on Success Bg", fg: "#15803d", bg: "#f0fdf4", min: 4.5 },
  { theme: "light", name: "Button Text Inverse on Brand Primary", fg: "#ffffff", bg: "#2563eb", min: 4.5 },

  // Dark Theme Pairs
  { theme: "dark", name: "Text Primary on Surface", fg: "#fafafa", bg: "#18181b", min: 4.5 },
  { theme: "dark", name: "Text Secondary on Surface", fg: "#d4d4d8", bg: "#18181b", min: 4.5 },
  { theme: "dark", name: "Text Muted on Surface", fg: "#a1a1aa", bg: "#18181b", min: 4.5 },
  { theme: "dark", name: "Brand Primary on Surface", fg: "#60a5fa", bg: "#18181b", min: 4.5 },
  { theme: "dark", name: "Text Primary on Canvas", fg: "#fafafa", bg: "#09090b", min: 4.5 },
  { theme: "dark", name: "Critical Text on Critical Bg", fg: "#fca5a5", bg: "#450a0a", min: 4.5 },
  { theme: "dark", name: "Warning Text on Warning Bg", fg: "#fde68a", bg: "#451a03", min: 4.5 },
  { theme: "dark", name: "Info Text on Info Bg", fg: "#93c5fd", bg: "#172554", min: 4.5 },
  { theme: "dark", name: "Success Text on Success Bg", fg: "#86efac", bg: "#052e16", min: 4.5 },
  { theme: "dark", name: "Button Text on Brand Primary", fg: "#ffffff", bg: "#2563eb", min: 4.5 },
];

console.log("=== CANON TOKEN CONTRAST RATIO AUDIT (WCAG 2.1 AA) ===\n");
let passed = 0;
let failed = 0;

for (const p of pairsToTest) {
  const ratio = getContrastRatio(p.fg, p.bg);
  const ratioStr = ratio.toFixed(2) + ":1";
  const ok = ratio >= p.min;
  if (ok) {
    passed++;
    console.log(`[PASS] [${p.theme.toUpperCase()}] ${p.name}`);
    console.log(`       FG: ${p.fg} | BG: ${p.bg} | Ratio: ${ratioStr} (Min: ${p.min}:1)`);
  } else {
    failed++;
    console.error(`[FAIL] [${p.theme.toUpperCase()}] ${p.name}`);
    console.error(`       FG: ${p.fg} | BG: ${p.bg} | Ratio: ${ratioStr} (Min: ${p.min}:1)`);
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed out of ${pairsToTest.length} token pairs.`);
if (failed > 0) {
  process.exit(1);
}
console.log("All token pairs meet WCAG 2.1 AA contrast requirements.");
