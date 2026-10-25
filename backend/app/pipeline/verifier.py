"""Double-Receipt Grounding & Verifier Engine.

Implements the fundamental AI safety and brand compliance invariant:
A finding is only valid if it satisfies the Double-Receipt principle:
1. Receipt A (Draft Span): Must exist verbatim in the draft submission text.
2. Receipt B (Policy Rule Quote): Must exist verbatim in the active guideline or policy source text.

Any candidate finding (whether produced by an LLM or a rule heuristic) that
fails either receipt is dropped as ungrounded/hallucinated before persistence.
"""

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ReceiptVerificationResult:
    """Result of double-receipt verification for a single candidate finding."""

    is_valid: bool
    receipt_a_valid: bool
    receipt_b_valid: bool
    rejection_reason: str | None = None


def verify_receipt_a(draft_text: str, receipt_a: str, start_offset: int | None = None, end_offset: int | None = None) -> bool:
    """Verifies that Receipt A exists verbatim within the draft text."""
    if not receipt_a or not receipt_a.strip():
        return False

    # If exact offsets provided, verify offset match first
    if (
        start_offset is not None
        and end_offset is not None
        and 0 <= start_offset < end_offset <= len(draft_text)
        and draft_text[start_offset:end_offset] == receipt_a
    ):
        return True

    # Verbatim substring match in draft
    return receipt_a in draft_text


def verify_receipt_b(policy_texts: Sequence[str], receipt_b: str) -> bool:
    """Verifies that Receipt B exists verbatim in one of the approved policy texts."""
    if not receipt_b or not receipt_b.strip():
        return False

    cleaned_receipt = receipt_b.strip()
    for text in policy_texts:
        if cleaned_receipt in text:
            return True

    return False


def verify_candidate_finding(
    finding: Any,
    draft_text: str,
    policy_texts: Sequence[str],
) -> ReceiptVerificationResult:
    """
    Evaluates a candidate finding against the double-receipt invariant.
    Works with both ORM Finding instances and dictionary/dataclass candidate representations.
    """
    receipt_a = (
        getattr(finding, "receipt_a_draft_span", None)
        or (finding.get("receipt_a_draft_span") if isinstance(finding, dict) else None)
        or getattr(finding, "matched_text", None)
        or (finding.get("matched_text") if isinstance(finding, dict) else "")
    )
    receipt_b = (
        getattr(finding, "receipt_b_rule_quote", None)
        or (finding.get("receipt_b_rule_quote") if isinstance(finding, dict) else None)
        or getattr(finding, "source_quote", None)
        or (finding.get("source_quote") if isinstance(finding, dict) else "")
    )
    start_offset = (
        getattr(finding, "start_offset", None)
        if not isinstance(finding, dict)
        else finding.get("start_offset")
    )
    end_offset = (
        getattr(finding, "end_offset", None)
        if not isinstance(finding, dict)
        else finding.get("end_offset")
    )

    a_ok = verify_receipt_a(draft_text, receipt_a, start_offset, end_offset)
    b_ok = verify_receipt_b(policy_texts, receipt_b)

    if not a_ok and not b_ok:
        return ReceiptVerificationResult(
            is_valid=False,
            receipt_a_valid=False,
            receipt_b_valid=False,
            rejection_reason="Both Receipt A (draft span) and Receipt B (policy quote) failed verbatim verification.",
        )
    if not a_ok:
        return ReceiptVerificationResult(
            is_valid=False,
            receipt_a_valid=False,
            receipt_b_valid=True,
            rejection_reason=f"Receipt A '{receipt_a}' does not exist verbatim in draft text.",
        )
    if not b_ok:
        return ReceiptVerificationResult(
            is_valid=False,
            receipt_a_valid=True,
            receipt_b_valid=False,
            rejection_reason=f"Receipt B '{receipt_b}' does not exist verbatim in active policy texts.",
        )

    return ReceiptVerificationResult(
        is_valid=True,
        receipt_a_valid=True,
        receipt_b_valid=True,
        rejection_reason=None,
    )


def filter_grounded_findings(
    candidate_findings: list[Any],
    draft_text: str,
    policy_texts: Sequence[str],
) -> tuple[list[Any], list[tuple[Any, str]]]:
    """
    Partitions candidate findings into (grounded_findings, rejected_findings).
    Returns verified findings and dropped ungrounded findings with rejection reasons.
    """
    grounded: list[Any] = []
    rejected: list[tuple[Any, str]] = []

    for f in candidate_findings:
        res = verify_candidate_finding(f, draft_text, policy_texts)
        if res.is_valid:
            grounded.append(f)
        else:
            rejected.append((f, res.rejection_reason or "Double-receipt verification failed."))

    return grounded, rejected
