"""Validation tests for guideline data pack, rules.json, and demo fixtures."""

import json
from pathlib import Path


def test_rules_json_and_citations():
    """Verify rules.json contains 12 explicit rules mapped verbatim to guideline source text."""
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    rules_path = root_dir / "data" / "demo_policy" / "rules.json"
    source_path = root_dir / "data" / "demo_policy" / "guideline_source.txt"

    assert rules_path.exists(), f"Missing rules.json at {rules_path}"
    assert source_path.exists(), f"Missing guideline_source.txt at {source_path}"

    with open(rules_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    with open(source_path, "r", encoding="utf-8") as f:
        source_text = f.read()

    rules = data["rules"]
    assert len(rules) == 12, f"Expected 12 rules, found {len(rules)}"

    # Verify each citation's exact quote exists verbatim in source text
    for rule in rules:
        citation = rule.get("source_citation", {})
        exact_quote = citation.get("exact_quote", "")
        assert len(exact_quote) > 10, f"Empty or short quote in rule {rule['rule_code']}"
        assert exact_quote in source_text, (
            f"Quote in {rule['rule_code']} not found verbatim in source text:\n{exact_quote}"
        )


def test_approved_claims_ledger():
    """Verify claims ledger in rules.json contains active and stale claims for demo."""
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    rules_path = root_dir / "data" / "demo_policy" / "rules.json"

    with open(rules_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    claims = data.get("approved_claims", [])
    assert len(claims) >= 2, "Expected at least 2 approved claims in ledger"

    # Verify stale figure claim for Review Condition 1
    stale_claim = next((c for c in claims if c["claim_code"] == "CLAIM-001"), None)
    assert stale_claim is not None, "CLAIM-001 missing"
    assert stale_claim["valid_until"] == "2025-01-01"
    assert stale_claim["status"] == "EXPIRED"


def test_demo_submissions_samples():
    """Verify sample submissions cover clean, multi-violation, and prompt injection."""
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    samples_path = root_dir / "data" / "demo_submissions" / "samples.json"

    assert samples_path.exists()
    with open(samples_path, "r", encoding="utf-8") as f:
        samples = json.load(f)["samples"]

    assert len(samples) == 3
    ids = [s["id"] for s in samples]
    assert "SUB-01" in ids
    assert "SUB-02" in ids
    assert "SUB-03" in ids

    # SUB-02 should target 4 violations including stale claim
    sub02 = next(s for s in samples if s["id"] == "SUB-02")
    assert sub02["expected_violations_count"] == 4
    rule_codes = [v["rule_code"] for v in sub02["expected_violations"]]
    assert "CLAIM-001" in rule_codes


def test_seeded_deterministic_proposal():
    """Verify seeded draft proposal PROP-01 matches Review Condition 7."""
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    prop_path = root_dir / "data" / "demo_policy" / "seeded_proposal.json"

    assert prop_path.exists()
    with open(prop_path, "r", encoding="utf-8") as f:
        prop = json.load(f)

    assert prop["proposal_id"] == "PROP-01"
    assert prop["target_rule_code"] == "TERM-007"
    assert prop["diff"]["action"] == "MODIFY_RULE_SCOPE"
    assert prop["backtest_simulation"]["recommendation"] == "SAFE_FOR_HUMAN_APPROVAL"
