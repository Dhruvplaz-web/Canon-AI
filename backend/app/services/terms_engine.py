"""Deterministic Forbidden Terms and Brand Typo Detection Engine.

Performs word-boundary regex matching and RapidFuzz typo detection across
normalized text, projecting character spans back to original raw text offsets
to generate verifiable double receipts (flagged span + source guideline quotation).
"""

import re
from dataclasses import dataclass, field
from typing import Any

from rapidfuzz import fuzz

from app.services.normalizer import map_span_to_raw, normalize_text


@dataclass
class TermFinding:
    """Standardized finding representation emitted by the terms engine."""

    rule_code: str
    category: str
    severity: str
    title: str
    flagged_text: str
    start_offset: int
    end_offset: int
    suggested_fix: str
    source_quote: str
    source_citation: dict[str, Any] = field(default_factory=dict)
    verification_status: str = "VERIFIED_VIOLATION"


# Brand name variations to catch unapproved variants
PROTECTED_BRAND_NAMES = ["Acme", "Acme Cloud", "Acme Financial Technologies"]


def scan_terms_and_typos(
    raw_text: str,
    rules: list[Any],
) -> list[TermFinding]:
    """
    Scans raw submission text against active policy rules.
    Employs Unicode NFKC normalization and maps flagged matches
    back to the raw text character offsets.
    """
    if not raw_text or not rules:
        return []

    normalized_text, offset_map = normalize_text(raw_text)
    findings: list[TermFinding] = []

    # 1. Match forbidden terms defined on rules
    for r in rules:
        category = getattr(r, "category", "TERMINOLOGY") if not isinstance(r, dict) else r.get("category", "TERMINOLOGY")
        # Claims are evaluated by the Claims Ledger Engine with temporal validity windows
        if category == "CLAIM":
            continue

        term = getattr(r, "pattern_or_term", None) or (
            r.get("pattern_or_term") if isinstance(r, dict) else None
        )
        if not term:
            continue

        rule_code = getattr(r, "rule_code", "") if not isinstance(r, dict) else r.get("rule_code", "")
        severity = getattr(r, "severity", "WARNING") if not isinstance(r, dict) else r.get("severity", "WARNING")
        title = getattr(r, "title", "") if not isinstance(r, dict) else r.get("title", "")
        suggested = (
            getattr(r, "suggested_replacement", "")
            if not isinstance(r, dict)
            else r.get("suggested_replacement", "")
        )
        citation = (
            getattr(r, "source_citation", {})
            if not isinstance(r, dict)
            else r.get("source_citation", {})
        )
        source_quote = citation.get("exact_quote", "") if isinstance(citation, dict) else ""

        # Construct word boundary regex (case-insensitive)
        pattern = re.compile(rf"\b{re.escape(term.strip())}\b", re.IGNORECASE)

        for match in pattern.finditer(normalized_text):
            norm_start, norm_end = match.start(), match.end()
            raw_start, raw_end = map_span_to_raw(norm_start, norm_end, offset_map, len(raw_text))
            flagged = raw_text[raw_start:raw_end]

            # Invariant: TitleCase "Acme" is the approved brand name (only lowercase/miscapitalized is forbidden)
            if term.lower() == "acme" and flagged == "Acme":
                continue

            findings.append(
                TermFinding(
                    rule_code=rule_code,
                    category=category,
                    severity=severity,
                    title=title,
                    flagged_text=flagged,
                    start_offset=raw_start,
                    end_offset=raw_end,
                    suggested_fix=suggested,
                    source_quote=source_quote,
                    source_citation=citation if isinstance(citation, dict) else {},
                    verification_status="VERIFIED_VIOLATION",
                )
            )

    # 2. Match brand misspellings via token analysis
    token_pattern = re.compile(r"\b[A-Za-z0-9_-]+\b")
    for match in token_pattern.finditer(normalized_text):
        token = match.group(0)
        # Skip exact match of Acme
        if token.lower() == "acme":
            continue

        # Check for near matches (e.g. "Acmee", "Akme", "Acmecorp")
        ratio = fuzz.ratio(token.lower(), "acme")
        if 75 <= ratio < 100 and len(token) <= 8:
            norm_start, norm_end = match.start(), match.end()
            raw_start, raw_end = map_span_to_raw(norm_start, norm_end, offset_map, len(raw_text))
            flagged = raw_text[raw_start:raw_end]

            findings.append(
                TermFinding(
                    rule_code="TERM-005",
                    category="TERMINOLOGY",
                    severity="WARNING",
                    title="Brand Name Typo or Spelling Variation",
                    flagged_text=flagged,
                    start_offset=raw_start,
                    end_offset=raw_end,
                    suggested_fix="Acme",
                    source_quote="The company name is \"Acme\". Never misspell or concatenate with suffixes.",
                    source_citation={
                        "document": "ACME-GUIDELINES-2026-V1",
                        "section": "SECTION 1: STATUTORY BRAND IDENTITY",
                        "page": 1,
                        "exact_quote": "The company name is \"Acme\". Never misspell or concatenate with suffixes.",
                    },
                    verification_status="VERIFIED_VIOLATION",
                )
            )

    return findings
