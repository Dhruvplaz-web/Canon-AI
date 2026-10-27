function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getLuminance({ r, g, b }) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const TOKEN_PAIRS = [
  { name: "Text Primary on Surface (Light)", fg: "#111827", bg: "#ffffff", min: 4.5 },
  { name: "Text Primary on Surface (Dark)", fg: "#fafafa", bg: "#18181b", min: 4.5 },
  { name: "Text Secondary on Surface (Light)", fg: "#374151", bg: "#ffffff", min: 4.5 },
  { name: "Text Secondary on Surface (Dark)", fg: "#d4d4d8", bg: "#18181b", min: 4.5 },
  { name: "Text Muted on Surface (Light)", fg: "#4b5563", bg: "#ffffff", min: 4.5 },
  { name: "Text Muted on Surface (Dark)", fg: "#a1a1aa", bg: "#18181b", min: 4.5 },
  { name: "Brand Primary on Surface (Light)", fg: "#1d4ed8", bg: "#ffffff", min: 4.5 },
  { name: "Brand Primary on Surface (Dark)", fg: "#60a5fa", bg: "#18181b", min: 4.5 },
  { name: "Text Primary on Canvas (Light)", fg: "#111827", bg: "#f8f9fa", min: 4.5 },
  { name: "Text Primary on Canvas (Dark)", fg: "#fafafa", bg: "#09090b", min: 4.5 },
  { name: "Critical Text on Critical Bg (Light)", fg: "#b91c1c", bg: "#fef2f2", min: 4.5 },
  { name: "Critical Text on Critical Bg (Dark)", fg: "#fca5a5", bg: "#450a0a", min: 4.5 },
  { name: "Warning Text on Warning Bg (Light)", fg: "#92400e", bg: "#fffbeb", min: 4.5 },
  { name: "Warning Text on Warning Bg (Dark)", fg: "#fde68a", bg: "#451a03", min: 4.5 },
  { name: "Info Text on Info Bg (Light)", fg: "#1d4ed8", bg: "#eff6ff", min: 4.5 },
  { name: "Info Text on Info Bg (Dark)", fg: "#93c5fd", bg: "#172554", min: 4.5 },
  { name: "Success Text on Success Bg (Light)", fg: "#15803d", bg: "#f0fdf4", min: 4.5 },
  { name: "Success Text on Success Bg (Dark)", fg: "#86efac", bg: "#052e16", min: 4.5 },
  { name: "Button Text Inverse on Brand (Light)", fg: "#ffffff", bg: "#2563eb", min: 4.5 },
  { name: "Button Text Inverse on Brand (Dark)", fg: "#ffffff", bg: "#2563eb", min: 4.5 },
];

console.log("=== Deterministic WCAG 2.1 AA Contrast Verification ===");
let passed = 0;
let failed = 0;

for (const pair of TOKEN_PAIRS) {
  const ratio = getContrast(pair.fg, pair.bg);
  const status = ratio >= pair.min ? "PASS" : "FAIL";
  if (status === "PASS") passed++;
  else failed++;
  console.log(`${pair.name.padEnd(42)}: ${ratio.toFixed(2)}:1 [${status}] (req >= ${pair.min}:1)`);
}

console.log(`\nTotal verified: ${TOKEN_PAIRS.length} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) process.exit(1);
