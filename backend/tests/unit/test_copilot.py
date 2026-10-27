"""Unit tests for AI Copilot Auto-Rewrite, Guideline Extractor, and Adversarial Showdown."""

from fastapi.testclient import TestClient

from app.main import app
from app.services.copilot_service import (
    extract_guidelines_from_text,
    generate_copilot_rewrite,
    run_adversarial_showdown,
)

client = TestClient(app)


def test_copilot_rewrite_service():
    """Verify copilot auto-rewrite removes violations and preserves marketing tone."""
    raw_text = "Invest in Acme Wealth for a guaranteed return of 25%."
    findings = [
        {
            "rule_code": "TERM-007",
            "matched_text": "guaranteed return",
            "suggested_fix": "targeted return",
            "receipt_b_rule_quote": "Guaranteed returns prohibited",
        }
    ]

    result = generate_copilot_rewrite(raw_text, findings)
    assert result["compliance_score"] == 100
    assert "rewritten_content" in result
    assert len(result["changes_summary"]) > 0


def test_copilot_empty_rewrite():
    """Verify empty text handling."""
    result = generate_copilot_rewrite("", [])
    assert result["compliance_score"] == 100
    assert result["rewritten_content"] == ""


def test_guideline_extraction_service():
    """Verify guideline extractor outputs structured AST rules."""
    sample_text = (
        "Acme Healthcare Compliance Policy:\n"
        "1. Medical claims must never promise a 'cure' for chronic illnesses.\n"
        "2. Clinical trial stats must cite the study year."
    )
    rules = extract_guidelines_from_text(sample_text, document_title="Acme Healthcare")
    assert len(rules) > 0
    assert "rule_code" in rules[0]
    assert "severity" in rules[0]


def test_adversarial_showdown_service():
    """Verify showdown benchmark output comparing raw LLM vs Canon."""
    showdown = run_adversarial_showdown("CASE-INJECT-01")
    assert showdown["test_case_id"] == "CASE-INJECT-01"
    assert showdown["raw_llm_baseline"]["prompt_injection_escaped"] is True
    assert showdown["canon_deterministic"]["prompt_injection_escaped"] is False
    assert showdown["canon_deterministic"]["double_receipts_provided"] is True
    assert len(showdown["advantage_matrix"]) >= 4


def test_copilot_endpoints():
    """Verify FastAPI routes for copilot rewrite, extraction, and showdown."""
    # 1. Rewrite endpoint
    res = client.post(
        "/api/v1/copilot/rewrite",
        json={
            "content": "Get guaranteed return today!",
            "findings": [{"rule_code": "TERM-007", "matched_text": "guaranteed return", "suggested_fix": "targeted return"}],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "rewritten_content" in data

    # 2. Extract guidelines endpoint
    res2 = client.post(
        "/api/v1/copilot/extract-guidelines",
        json={
            "document_title": "FinTech Rules",
            "content": "All loans must state APR. Never say free money.",
        },
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["total_rules_extracted"] > 0

    # 3. Showdown endpoint
    res3 = client.get("/api/v1/copilot/showdown?test_case_id=CASE-INJECT-01")
    assert res3.status_code == 200
    data3 = res3.json()
    assert "raw_llm_baseline" in data3
    assert "canon_deterministic" in data3
