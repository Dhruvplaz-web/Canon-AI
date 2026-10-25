"""Unit tests for the Double-Receipt Verifier Engine."""

from app.pipeline.verifier import (
    filter_grounded_findings,
    verify_candidate_finding,
    verify_receipt_a,
    verify_receipt_b,
)


def test_verify_receipt_a_verbatim():
    draft = "Get high returns today with Acme bank on us financial solutions."
    assert verify_receipt_a(draft, "bank on us") is True
    assert verify_receipt_a(draft, "Acme") is True
    assert verify_receipt_a(draft, "guaranteed 100% returns") is False  # not in draft


def test_verify_receipt_a_with_offsets():
    draft = "Hello world"
    assert verify_receipt_a(draft, "Hello", 0, 5) is True
    assert verify_receipt_a(draft, "world", 6, 11) is True
    # Mismatched offsets fall back to substring if contained
    assert verify_receipt_a(draft, "Hello", 1, 6) is True


def test_verify_receipt_b_verbatim():
    policy_sources = [
        "Rule TERM-001: The word 'bank' or phrase 'bank on us' must never be used.",
        "Rule CLAIM-001: All metrics require active certification.",
    ]
    assert verify_receipt_b(policy_sources, "The word 'bank' or phrase 'bank on us' must never be used.") is True
    assert verify_receipt_b(policy_sources, "All metrics require active certification.") is True
    assert verify_receipt_b(policy_sources, "Hallucinated policy requirement from LLM.") is False


def test_candidate_finding_full_double_receipt():
    draft = "Acme brings you bank on us banking."
    policy_texts = ["Rule: bank on us is strictly prohibited."]

    valid_candidate = {
        "matched_text": "bank on us",
        "receipt_a_draft_span": "bank on us",
        "receipt_b_rule_quote": "bank on us is strictly prohibited.",
        "start_offset": 16,
        "end_offset": 26,
    }

    result = verify_candidate_finding(valid_candidate, draft, policy_texts)
    assert result.is_valid is True
    assert result.receipt_a_valid is True
    assert result.receipt_b_valid is True
    assert result.rejection_reason is None


def test_candidate_finding_hallucinated_receipt_a_dropped():
    draft = "Acme delivers reliable financial technology."
    policy_texts = ["Rule: cryptocurrency is banned."]

    fake_candidate = {
        "matched_text": "cryptocurrency",
        "receipt_a_draft_span": "cryptocurrency",  # hallucinated, not in draft
        "receipt_b_rule_quote": "Rule: cryptocurrency is banned.",
    }

    result = verify_candidate_finding(fake_candidate, draft, policy_texts)
    assert result.is_valid is False
    assert result.receipt_a_valid is False
    assert result.receipt_b_valid is True
    assert "does not exist verbatim in draft text" in result.rejection_reason


def test_candidate_finding_hallucinated_receipt_b_dropped():
    draft = "Acme has 500 partners."
    policy_texts = ["Rule: must not state partners without license."]

    fake_candidate = {
        "matched_text": "500 partners",
        "receipt_a_draft_span": "500 partners",
        "receipt_b_rule_quote": "Imaginary guideline section 99 citing partners restriction",
    }

    result = verify_candidate_finding(fake_candidate, draft, policy_texts)
    assert result.is_valid is False
    assert result.receipt_a_valid is True
    assert result.receipt_b_valid is False
    assert "does not exist verbatim in active policy texts" in result.rejection_reason


def test_filter_grounded_findings_batch():
    draft = "Acme offers quick loans and bank on us support."
    policy_texts = ["Rule: 'bank on us' is prohibited."]

    candidates = [
        {
            "id": 1,
            "receipt_a_draft_span": "bank on us",
            "receipt_b_rule_quote": "'bank on us' is prohibited.",
        },
        {
            "id": 2,
            "receipt_a_draft_span": "hallucinated draft span",
            "receipt_b_rule_quote": "'bank on us' is prohibited.",
        },
    ]

    grounded, rejected = filter_grounded_findings(candidates, draft, policy_texts)
    assert len(grounded) == 1
    assert grounded[0]["id"] == 1
    assert len(rejected) == 1
    assert rejected[0][0]["id"] == 2
