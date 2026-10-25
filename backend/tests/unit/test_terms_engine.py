"""Unit tests for the Deterministic Forbidden Terms and Brand Typo Engine."""

import json
from pathlib import Path

from app.services.terms_engine import scan_terms_and_typos

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
RULES_PATH = REPO_ROOT / "data" / "demo_policy" / "rules.json"
SAMPLES_PATH = REPO_ROOT / "data" / "demo_submissions" / "samples.json"


def get_demo_rules():
    assert RULES_PATH.exists()
    data = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    return [
        {
            "rule_code": r["rule_code"],
            "pattern_or_term": r.get("forbidden_term"),
            "category": r.get("category"),
            "severity": r.get("severity"),
            "title": r.get("title"),
            "suggested_replacement": r.get("suggested_replacement"),
            "source_citation": r.get("source_citation"),
        }
        for r in data["rules"]
    ]


def test_forbidden_terms_detection_and_offsets():
    rules = get_demo_rules()
    sample = "Bank on us for all your financial operations! We offer super dope yields with instant loan approval."

    findings = scan_terms_and_typos(sample, rules)
    codes = [f.rule_code for f in findings]

    assert "TERM-001" in codes  # Bank on us
    assert "TONE-002" in codes  # super dope yields
    assert "TERM-004" in codes  # instant loan approval

    # Verify every finding's offsets accurately map to the source text
    for f in findings:
        assert sample[f.start_offset : f.end_offset].lower() == f.flagged_text.lower()
        # Verify double receipt contains source quote
        assert len(f.source_quote) > 0


def test_brand_typo_detection():
    rules = get_demo_rules()
    sample = "Partner with Acmee today for secure payments."

    findings = scan_terms_and_typos(sample, rules)
    typo_findings = [f for f in findings if f.rule_code == "TERM-005"]
    assert len(typo_findings) == 1
    assert typo_findings[0].flagged_text == "Acmee"
    assert typo_findings[0].suggested_fix == "Acme"


def test_sub02_fixture_terms_matches():
    data = json.loads(SAMPLES_PATH.read_text(encoding="utf-8"))
    sub02 = next((s for s in data["samples"] if s["id"] == "SUB-02"), None)
    assert sub02 is not None

    rules = get_demo_rules()
    findings = scan_terms_and_typos(sub02["content"], rules)
    rule_codes = {f.rule_code for f in findings}

    assert "TERM-001" in rule_codes
    assert "TONE-002" in rule_codes
    assert "TERM-004" in rule_codes
