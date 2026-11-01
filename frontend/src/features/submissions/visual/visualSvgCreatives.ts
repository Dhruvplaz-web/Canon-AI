/**
 * Authentic SVG Creative Generators for Multi-Modal Visual Creative Audit
 * Generates self-contained SVG Data URIs matching standard IAB and Social ad dimensions.
 */

export interface CreativeSvgOptions {
  remediated?: boolean;
}

/**
 * 1. FinTech Instant Loan Creative (1080 x 1080 - Instagram / Social Square)
 * Defects in original: 4.2pt microscopic disclaimer, 2.3:1 pale grey contrast, missing NBFC entity.
 */
export function generateFintechLoanSvg(options: CreativeSvgOptions = {}): string {
  const { remediated = false } = options;

  const disclaimerColor = remediated ? "#0F172A" : "#B45309"; // Remediated: rich slate; Original: low-contrast light amber-orange
  const disclaimerBg = remediated ? "#FFFFFF" : "rgba(254, 243, 199, 0.6)";
  const disclaimerFontSize = remediated ? "16" : "7.5";
  const disclaimerBorder = remediated ? "stroke='#10B981' stroke-width='2'" : "stroke='transparent'";

  const nbfcBadgeText = remediated
    ? "✓ Regulated by RBI • Partner NBFC: Kotak Prime Ltd (CoR: 14.00028)"
    : "⚠️ Lending Partner Entity: Undisclosed / Unverified";
  const nbfcBadgeColor = remediated ? "#047857" : "#DC2626";
  const nbfcBadgeBg = remediated ? "#ECFDF5" : "#FEF2F2";
  const nbfcBadgeBorder = remediated ? "#10B981" : "#EF4444";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
    <defs>
      <linearGradient id="finBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFDF5" />
        <stop offset="60%" stop-color="#FEF3C7" />
        <stop offset="100%" stop-color="#FDE68A" />
      </linearGradient>
      <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#D97706" />
      </linearGradient>
      <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-opacity="0.1" />
      </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="1080" height="1080" fill="url(#finBg)" />

    <!-- Subtle Geometric Deco Rings -->
    <circle cx="950" cy="180" r="220" fill="none" stroke="#FDE68A" stroke-width="48" opacity="0.4" />
    <circle cx="120" cy="920" r="180" fill="none" stroke="#FCD34D" stroke-width="32" opacity="0.3" />

    <!-- Brand Header -->
    <g transform="translate(86, 75)">
      <!-- Logo Shield -->
      <rect x="0" y="0" width="56" height="56" rx="14" fill="#1E3A8A" />
      <path d="M28 14 L42 22 V36 C42 44 28 50 28 50 C28 50 14 44 14 36 V22 Z" fill="#FBBF24" />
      <text x="72" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#0F172A" letter-spacing="1">RUPEEFAST</text>
      <text x="248" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="20" fill="#64748B">CREDIT</text>
    </g>

    <!-- Top Urgency Pill -->
    <g transform="translate(86, 170)">
      <rect x="0" y="0" width="340" height="42" rx="21" fill="url(#goldAccent)" />
      <text x="24" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="16" fill="#FFFFFF" letter-spacing="1.5">⚡ FESTIVE INSTANT DISBURSAL</text>
    </g>

    <!-- Headline Claim -->
    <g transform="translate(86, 260)">
      <text x="0" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="76" fill="#0F172A" line-height="1.1">
        Instant Loan
      </text>
      <text x="0" y="170" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="76" fill="#B45309">
        @ 1% Interest*
      </text>
      <text x="0" y="255" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="64" fill="#0F172A">
        Disbursed in 5 Mins!
      </text>
    </g>

    <!-- Body Claim & Value Props Card -->
    <g transform="translate(86, 560)">
      <rect x="0" y="0" width="908" height="150" rx="24" fill="#FFFFFF" filter="url(#cardShadow)" />
      <text x="40" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="26" fill="#1E293B">
        Direct Bank Credit • Zero Collateral Required
      </text>
      <text x="40" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="20" fill="#64748B">
        Over 500,000+ happy Indian borrowers credited within 300 seconds.
      </text>
    </g>

    <!-- 3 Value Proposition Chips -->
    <g transform="translate(86, 740)">
      <!-- Chip 1 -->
      <rect x="0" y="0" width="280" height="64" rx="16" fill="#FEF3C7" stroke="#FDE68A" stroke-width="2" />
      <text x="24" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="18" fill="#92400E">✓ Paperless KYC</text>

      <!-- Chip 2 -->
      <rect x="314" y="0" width="280" height="64" rx="16" fill="#FEF3C7" stroke="#FDE68A" stroke-width="2" />
      <text x="338" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="18" fill="#92400E">✓ 24x7 Disbursal</text>

      <!-- Chip 3 -->
      <rect x="628" y="0" width="280" height="64" rx="16" fill="#FEF3C7" stroke="#FDE68A" stroke-width="2" />
      <text x="652" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="18" fill="#92400E">✓ Flexible Tenures</text>
    </g>

    <!-- NBFC Partner Entity Disclosure Area -->
    <g transform="translate(86, 840)">
      <rect x="0" y="0" width="908" height="54" rx="12" fill="${nbfcBadgeBg}" stroke="${nbfcBadgeBorder}" stroke-width="1.5" />
      <text x="24" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="16" fill="${nbfcBadgeColor}">
        ${nbfcBadgeText}
      </text>
    </g>

    <!-- Mandatory Statutory Disclaimer Footer -->
    <g transform="translate(86, 920)">
      <rect x="0" y="0" width="908" height="${remediated ? "110" : "60"}" rx="14" fill="${disclaimerBg}" ${disclaimerBorder} />
      <text x="20" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="${remediated ? "700" : "400"}" font-size="${disclaimerFontSize}" fill="${disclaimerColor}">
        *Terms and conditions apply. Processing fee up to 14% levied upfront. Actual Annual Percentage Rate (APR) ranges from 36% to 48% p.a.
      </text>
      <text x="20" y="${remediated ? "54" : "44"}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="${remediated ? "700" : "400"}" font-size="${disclaimerFontSize}" fill="${disclaimerColor}">
        Repayment tenure ranges from 60 days to 180 days. Non-refundable platform convenience fee applies. Default interest of 2% per month.
      </text>
      ${
        remediated
          ? `<text x="20" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="15" fill="#047857">
        [STATUTORY REMEDIATION APPLIED: Disclaimer font size increased to 16pt (≥ 30% of headline); WCAG contrast elevated to 14.8:1]
      </text>`
          : ""
      }
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 2. Surrogate Alcohol Club Soda Creative (1200 x 628 - Meta / Display Landscape)
 * Defects in original: Bipartite surrogate liquor trademark, missing non-alcoholic license certificate.
 */
export function generateSurrogateSodaSvg(options: CreativeSvgOptions = {}): string {
  const { remediated = false } = options;

  const headline = remediated
    ? "Refreshing Sparkling Citrus Mocktail Assortment"
    : "Live Bold, Play Large! Royal Challenge Club Soda";
  const brandTitle = remediated ? "ROYAL BOTANICALS" : "ROYAL CHALLENGE";
  const disclaimerNote = remediated
    ? "100% Non-Alcoholic Sparkling Beverage • FSSAI Lic No: 10014022002819 • Zero Surrogate Association"
    : "*Order your celebratory party crate for tonight's big game. Packaged drinking club soda.";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 628" width="1200" height="628">
    <defs>
      <linearGradient id="partyBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F172A" />
        <stop offset="40%" stop-color="#1E1B4B" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FDE047" />
        <stop offset="100%" stop-color="#EAB308" />
      </linearGradient>
      <linearGradient id="bottleGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCD34D" />
        <stop offset="100%" stop-color="#B45309" />
      </linearGradient>
    </defs>

    <rect width="1200" height="628" fill="url(#partyBg)" />

    <!-- Ambient Golden Party Spotlights -->
    <circle cx="950" cy="300" r="280" fill="#EAB308" opacity="0.12" filter="blur(60px)" />
    <circle cx="200" cy="150" r="180" fill="#3B82F6" opacity="0.15" filter="blur(50px)" />

    <!-- Brand Crest Area -->
    <g transform="translate(72, 60)">
      <circle cx="24" cy="24" r="24" fill="#EAB308" />
      <text x="16" y="32" font-family="serif" font-weight="900" font-size="24" fill="#020617">👑</text>
      <text x="64" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="url(#goldText)" letter-spacing="2">
        ${brandTitle}
      </text>
      <text x="360" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="18" fill="#94A3B8">
        ${remediated ? "BEVERAGES" : "CLUB SODA"}
      </text>
    </g>

    <!-- Main Headline Claim -->
    <g transform="translate(72, 180)">
      <text x="0" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="48" fill="#FFFFFF">
        ${headline.split("!")[0]}${headline.includes("!") ? "!" : ""}
      </text>
      <text x="0" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="44" fill="url(#goldText)">
        ${remediated ? "Handcrafted Non-Alcoholic Blends" : "Celebrate Every Victory in Style"}
      </text>
      <text x="0" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="22" fill="#94A3B8">
        ${remediated ? "Infused with organic Himalayan botanicals and zero artificial sugar." : "The official celebration partner of high-spirited nightlife & cricket evenings."}
      </text>
    </g>

    <!-- Graphic Silhouette (Right side) -->
    <g transform="translate(860, 100)">
      <!-- Silhouette Bottle Graphic -->
      <rect x="80" y="80" width="80" height="260" rx="20" fill="url(#bottleGold)" opacity="0.85" />
      <rect x="105" y="20" width="30" height="70" rx="6" fill="#FDE047" />
      <rect x="70" y="160" width="100" height="100" rx="8" fill="#1E1B4B" stroke="#FDE047" stroke-width="2" />
      <text x="82" y="215" font-family="sans-serif" font-weight="900" font-size="13" fill="#FDE047">
        ${remediated ? "MOCKTAIL" : "CLUB SODA"}
      </text>
      <circle cx="50" cy="120" r="12" fill="#FDE047" opacity="0.6" />
      <circle cx="200" cy="180" r="16" fill="#FDE047" opacity="0.4" />
      <circle cx="180" cy="300" r="10" fill="#FDE047" opacity="0.5" />
    </g>

    <!-- Bottom Regulatory Banner -->
    <g transform="translate(72, 480)">
      <rect x="0" y="0" width="1056" height="84" rx="16" fill="${remediated ? "#064E3B" : "#1E293B"}" stroke="${remediated ? "#10B981" : "#475569"}" stroke-width="2" />
      <text x="24" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="17" fill="${remediated ? "#6EE7B7" : "#F87171"}">
        ${remediated ? "✓ STATUTORY COMPLIANCE: GENUINE BRAND EXTENSION" : "⚠️ ASCI & CCPA WARNING: SURROGATE BRAND EXTENSION PROHIBITION"}
      </text>
      <text x="24" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="14" fill="#E2E8F0">
        ${disclaimerNote}
      </text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 3. EdTech "100% Job Guarantee" Creative (1080 x 1080 - Social Square)
 * Defects in original: Unlawful absolute placement guarantee, 90° sideways micro-text along right margin.
 */
export function generateEdtechGuaranteeSvg(options: CreativeSvgOptions = {}): string {
  const { remediated = false } = options;

  const headline = remediated
    ? "Upskill with Career Guidance & Practical Capstones"
    : "100% Job Guarantee or 100% Full Refund*";
  const subhead = remediated
    ? "Industry-vetted curriculum with career coaching. Job placement assistance provided."
    : "Become a Full-Stack AI Engineer in 12 Weeks. Guaranteed ₹18 LPA Package!";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
    <defs>
      <linearGradient id="edBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E1B4B" />
        <stop offset="60%" stop-color="#312E81" />
        <stop offset="100%" stop-color="#0F172A" />
      </linearGradient>
      <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#F97316" />
        <stop offset="100%" stop-color="#EA580C" />
      </linearGradient>
    </defs>

    <rect width="1080" height="1080" fill="url(#edBg)" />

    <!-- Top Badge -->
    <g transform="translate(86, 75)">
      <rect x="0" y="0" width="260" height="48" rx="12" fill="#4338CA" />
      <text x="20" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">
        NEXTGEN EDUTECH
      </text>
    </g>

    <!-- Urgency Pill -->
    <g transform="translate(86, 170)">
      <rect x="0" y="0" width="380" height="44" rx="22" fill="url(#orangeGrad)" />
      <text x="24" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="16" fill="#FFFFFF">
        🔥 NEXT BATCH ENROLLMENT CLOSING
      </text>
    </g>

    <!-- Headline -->
    <g transform="translate(86, 270)">
      <text x="0" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="64" fill="#FFFFFF">
        ${headline.split("or")[0]}
      </text>
      ${
        headline.includes("or")
          ? `<text x="0" y="150" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="64" fill="#F97316">
        or 100% Full Refund*
      </text>`
          : ""
      }
      <text x="0" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="24" fill="#CBD5E1">
        ${subhead}
      </text>
    </g>

    <!-- 3 Credibility Stats -->
    <g transform="translate(86, 600)">
      <rect x="0" y="0" width="280" height="140" rx="20" fill="#1E1B4B" stroke="#4338CA" stroke-width="2" />
      <text x="32" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="44" fill="#38BDF8">
        ${remediated ? "12 Wks" : "100%"}
      </text>
      <text x="32" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="16" fill="#94A3B8">
        ${remediated ? "Live Practical Curriculum" : "Job Placement Guarantee"}
      </text>

      <rect x="314" y="0" width="280" height="140" rx="20" fill="#1E1B4B" stroke="#4338CA" stroke-width="2" />
      <text x="346" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="44" fill="#38BDF8">
        ₹18 LPA
      </text>
      <text x="346" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="16" fill="#94A3B8">
        Highest CTC Package
      </text>

      <rect x="628" y="0" width="280" height="140" rx="20" fill="#1E1B4B" stroke="#4338CA" stroke-width="2" />
      <text x="660" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="44" fill="#38BDF8">
        500+
      </text>
      <text x="660" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="16" fill="#94A3B8">
        Hiring Tech Partners
      </text>
    </g>

    <!-- Bottom Legible Disclaimer (Remediated) or Obscured Sideways Text (Original) -->
    ${
      remediated
        ? `<g transform="translate(86, 820)">
        <rect x="0" y="0" width="908" height="120" rx="16" fill="#064E3B" stroke="#10B981" stroke-width="2" />
        <text x="32" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="18" fill="#6EE7B7">
          ✓ STATUTORY REMEDIATION: ASCI 2023 GUIDELINES ON EDUCATION ADVERTISEMENTS
        </text>
        <text x="32" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="15" fill="#FFFFFF">
          Career assistance program. Past participant outcomes do not guarantee employment. Terms of mentorship agreement apply.
        </text>
      </g>`
        : `<g transform="translate(1030, 200) rotate(90)">
        <!-- Illegal 90 Degree Rotated Disclaimer along margin -->
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="9" fill="#64748B">
          *Mandatory 95% attendance, 100% test pass, first attempt interview clearance apply. Refund subject to non-refundable administrative deduction of 40%.
        </text>
      </g>
      <g transform="translate(86, 920)">
        <rect x="0" y="0" width="908" height="50" rx="10" fill="#1E293B" />
        <text x="24" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="14" fill="#EF4444">
          ⚠️ DEFECT DETECTED: Illegal 90° sideways vertical orientation violates ASCI Section 2 (Horizontal legibility rule)
        </text>
      </g>`
    }
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 4. IAB Leaderboard (728 x 90)
 */
export function generateIabLeaderboardSvg(options: CreativeSvgOptions = {}): string {
  const { remediated = false } = options;

  const disclaimerFontSize = remediated ? "10" : "5";
  const disclaimerColor = remediated ? "#FFFFFF" : "#64748B";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 728 90" width="728" height="90">
    <rect width="728" height="90" fill="#0F172A" />
    <rect x="12" y="16" width="32" height="32" rx="8" fill="#3B82F6" />
    <text x="56" y="38" font-family="sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">ALPHA WEALTH</text>
    <text x="240" y="38" font-family="sans-serif" font-weight="800" font-size="18" fill="#FBBF24">Invest ₹500/mo in Top US Equities</text>
    <rect x="580" y="18" width="130" height="36" rx="8" fill="#3B82F6" />
    <text x="612" y="41" font-family="sans-serif" font-weight="700" font-size="13" fill="#FFFFFF">START NOW &gt;</text>
    <text x="56" y="74" font-family="sans-serif" font-weight="${remediated ? "700" : "400"}" font-size="${disclaimerFontSize}" fill="${disclaimerColor}">
      ${
        remediated
          ? "Investments in securities market are subject to market risks. Read all scheme related documents carefully."
          : "*Investments subject to market risks. Past returns don't assure future. Brokerage T&C apply."
      }
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
