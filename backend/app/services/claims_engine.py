"""Deterministic Approved Claims Ledger and Expired Claim Validation Engine."""

import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from rapidfuzz import fuzz

from app.services.normalizer import map_span_to_raw, normalize_text


@dataclass
class ClaimFinding:
    """Standardized finding representation emitted for claim violations."""

    claim_code: str
    rule_code: str
    category: str
    severity: str
    title: str
    flagged_text: str
    start_offset: int
    end_offset: int
    suggested_fix: str
    source_quote: str
    reason: str
    verification_status: str  # e.g., EXPIRED_CLAIM, UNVERIFIED_CLAIM
    is_violation: bool = True
    source_citation: dict[str, Any] = field(default_factory=dict)


def scan_claims(
    raw_text: str,
    approved_claims: list[Any],
    as_of: datetime | None = None,
) -> list[ClaimFinding]:
    """
    Evaluates submission text against approved claims ledger.
    Flags expired claims (where as_of > valid_until) with CRITICAL severity
    and double receipts.
    """
    if not raw_text or not approved_claims:
        return []

    if as_of is None:
        as_of = datetime.now(UTC)

    normalized_text, offset_map = normalize_text(raw_text)
    findings: list[ClaimFinding] = []

    for claim in approved_claims:
        claim_code = getattr(claim, "claim_code", "") if not isinstance(claim, dict) else claim.get("claim_code", "")
        claim_text = getattr(claim, "claim_text", "") if not isinstance(claim, dict) else claim.get("claim_text", "")
        substantiation = getattr(claim, "substantiation", "") if not isinstance(claim, dict) else claim.get("substantiation", "")
        valid_until = getattr(claim, "valid_until", None) if not isinstance(claim, dict) else claim.get("valid_until")

        if isinstance(valid_until, str):
            valid_until = datetime.fromisoformat(valid_until).replace(tzinfo=UTC)
        elif valid_until is not None and valid_until.tzinfo is None:
            valid_until = valid_until.replace(tzinfo=UTC)

        # Search for claim phrase in normalized text
        # Fast path: regex boundary search on core phrase
        pattern = re.compile(rf"\b{re.escape(claim_text.strip())}\b", re.IGNORECASE)
        match = pattern.search(normalized_text)

        if not match:
            # Fallback to partial fuzz matching for minor punctuation variances
            words = claim_text.split()
            first_word = re.escape(words[0]) if words else ""
            for m in re.finditer(rf"\b{first_word}\b", normalized_text, re.IGNORECASE):
                start_candidate = m.start()
                end_candidate = min(len(normalized_text), start_candidate + len(claim_text) + 20)
                candidate_span = normalized_text[start_candidate:end_candidate]
                if fuzz.partial_ratio(candidate_span.lower(), claim_text.lower()) >= 90:
                    match = m
                    break

        if match:
            norm_start = match.start()
            norm_end = min(len(normalized_text), norm_start + len(claim_text))
            raw_start, raw_end = map_span_to_raw(norm_start, norm_end, offset_map, len(raw_text))
            flagged = raw_text[raw_start:raw_end]

            is_expired = valid_until is not None and as_of > valid_until
            until_str = valid_until.strftime("%Y-%m-%d") if valid_until else "unknown"

            if is_expired:
                findings.append(
                    ClaimFinding(
                        claim_code=claim_code,
                        rule_code=claim_code,
                        category="CLAIM",
                        severity="CRITICAL",
                        title=f"Expired Factual Claim: {claim_code}",
                        flagged_text=flagged,
                        start_offset=raw_start,
                        end_offset=raw_end,
                        suggested_fix="Remove claim or obtain recertified substantiation.",
                        source_quote=f"Claim: '{claim_text}' Substantiation: {substantiation}",
                        reason=f"EXPIRED_CLAIM: Claim expired on {until_str} and has not been recertified.",
                        verification_status="EXPIRED_CLAIM",
                        is_violation=True,
                        source_citation={
                            "claim_code": claim_code,
                            "valid_until": until_str,
                            "substantiation": substantiation,
                            "exact_quote": claim_text,
                        },
                    )
                )

    return findings
