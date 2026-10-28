"""Deterministic Approved Claims Ledger and Expired Claim Validation Engine."""

import calendar
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

try:
    from rapidfuzz import fuzz
except ImportError:
    # Graceful fallback for environments without compiled rapidfuzz C-extensions
    class _FuzzFallback:
        @staticmethod
        def partial_ratio(s1: str, s2: str) -> int:
            s1_l, s2_l = s1.lower(), s2.lower()
            return 100 if s2_l in s1_l or s1_l in s2_l else 0
    fuzz = _FuzzFallback()

from app.services.normalizer import map_span_to_raw, normalize_text


def parse_temporal_boundary(val: Any, is_end_of_day: bool = False) -> datetime | None:
    """
    Safely parses a datetime or ISO 8601 string to a UTC-aware datetime.
    - If aware, converts to UTC via astimezone(UTC).
    - If naive, sets tzinfo to UTC.
    - If string is a date-only value (YYYY-MM-DD) and is_end_of_day is True,
      sets time to 23:59:59.999999 UTC to respect full calendar-day validity.
    - Returns None if val is missing, empty, or unparseable.
    """
    if val is None:
        return None
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=UTC)
        return val.astimezone(UTC)
    if isinstance(val, str):
        s = val.strip()
        if not s:
            return None
        try:
            if len(s) == 10 and s.count("-") == 2:
                # Date-only YYYY-MM-DD
                dt = datetime.fromisoformat(s)
                if is_end_of_day:
                    return dt.replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=UTC)
                return dt.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=UTC)
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=UTC)
            return dt.astimezone(UTC)
        except (ValueError, TypeError):
            return None
    return None


def advance_calendar_months(dt: datetime, months: int) -> datetime:
    """
    Advances a UTC datetime by a given number of calendar months,
    clamping month-end overflow (e.g. Oct 31 + 6 months -> Apr 30; leap year Feb 29).
    """
    new_year = dt.year + (dt.month + months - 1) // 12
    new_month = (dt.month + months - 1) % 12 + 1
    max_day = calendar.monthrange(new_year, new_month)[1]
    new_day = min(dt.day, max_day)
    return dt.replace(year=new_year, month=new_month, day=new_day)


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
    verification_status: str  # e.g., EXPIRED_CLAIM, PREMATURE_CLAIM, INACTIVE_CLAIM, UNVERIFIED_CLAIM
    is_violation: bool = True
    source_citation: dict[str, Any] = field(default_factory=dict)


def scan_claims(
    raw_text: str,
    approved_claims: list[Any],
    as_of: datetime | str | None = None,
) -> list[ClaimFinding]:
    """
    Evaluates submission text against approved claims ledger.
    Flags expired claims (where as_of > valid_until) with CRITICAL severity
    and double receipts. Supports simulation reference date via as_of.
    """
    if not raw_text or not approved_claims:
        return []

    # Resolve reference as_of timestamp safely to UTC
    if as_of is None:
        eval_as_of = datetime.now(UTC)
    elif isinstance(as_of, str):
        parsed = parse_temporal_boundary(as_of, is_end_of_day=False)
        eval_as_of = parsed if parsed is not None else datetime.now(UTC)
    elif isinstance(as_of, datetime):
        eval_as_of = parse_temporal_boundary(as_of, is_end_of_day=False) or datetime.now(UTC)
    else:
        eval_as_of = datetime.now(UTC)

    normalized_text, offset_map = normalize_text(raw_text)
    findings: list[ClaimFinding] = []

    for claim in approved_claims:
        claim_code = getattr(claim, "claim_code", "") if not isinstance(claim, dict) else claim.get("claim_code", "")
        claim_text = getattr(claim, "claim_text", "") if not isinstance(claim, dict) else claim.get("claim_text", "")
        substantiation = getattr(claim, "substantiation", "") if not isinstance(claim, dict) else claim.get("substantiation", "")
        is_active = getattr(claim, "is_active", True) if not isinstance(claim, dict) else claim.get("is_active", True)
        
        raw_until = getattr(claim, "valid_until", None) if not isinstance(claim, dict) else claim.get("valid_until")
        raw_from = getattr(claim, "valid_from", None) if not isinstance(claim, dict) else claim.get("valid_from")

        # Normalize validity boundaries
        valid_until = parse_temporal_boundary(raw_until, is_end_of_day=True)
        valid_from = parse_temporal_boundary(raw_from, is_end_of_day=False)

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

            until_str = valid_until.strftime("%Y-%m-%d") if valid_until else "unknown"
            from_str = valid_from.strftime("%Y-%m-%d") if valid_from else "unknown"

            # Check 1: Inactive claim
            if not is_active:
                findings.append(
                    ClaimFinding(
                        claim_code=claim_code,
                        rule_code=claim_code,
                        category="CLAIM",
                        severity="CRITICAL",
                        title=f"Inactive Claim: {claim_code}",
                        flagged_text=flagged,
                        start_offset=raw_start,
                        end_offset=raw_end,
                        suggested_fix="Remove decommissioned claim.",
                        source_quote=f"Claim: '{claim_text}' Substantiation: {substantiation}",
                        reason=f"INACTIVE_CLAIM: Claim {claim_code} has been retired and is no longer approved for use.",
                        verification_status="INACTIVE_CLAIM",
                        is_violation=True,
                        source_citation={
                            "claim_code": claim_code,
                            "valid_until": until_str,
                            "substantiation": substantiation,
                            "exact_quote": claim_text,
                        },
                    )
                )
                continue

            # Check 2: Not yet effective (valid_from in future)
            if valid_from is not None and eval_as_of < valid_from:
                findings.append(
                    ClaimFinding(
                        claim_code=claim_code,
                        rule_code=claim_code,
                        category="CLAIM",
                        severity="WARNING",
                        title=f"Premature Claim: {claim_code}",
                        flagged_text=flagged,
                        start_offset=raw_start,
                        end_offset=raw_end,
                        suggested_fix=f"Withhold claim until effective date {from_str}.",
                        source_quote=f"Claim: '{claim_text}' Substantiation: {substantiation}",
                        reason=f"PREMATURE_CLAIM: Claim evidence is not effective until {from_str}.",
                        verification_status="PREMATURE_CLAIM",
                        is_violation=True,
                        source_citation={
                            "claim_code": claim_code,
                            "valid_from": from_str,
                            "substantiation": substantiation,
                            "exact_quote": claim_text,
                        },
                    )
                )
                continue

            # Check 3: Expired validity period
            is_expired = valid_until is not None and eval_as_of > valid_until
            if is_expired:
                findings.append(
                    ClaimFinding(
                        claim_code=claim_code,
                        rule_code=claim_code,
                        category="CLAIM",
                        severity="CRITICAL",
                        title=f"Expired Substantiation: {claim_code}",
                        flagged_text=flagged,
                        start_offset=raw_start,
                        end_offset=raw_end,
                        suggested_fix="Obtain renewed substantiation or update claim copy.",
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
