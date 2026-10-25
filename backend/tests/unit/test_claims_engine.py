"""Unit tests for the Claims Ledger and Expired Claim Validator."""

import json
from datetime import UTC, datetime
from pathlib import Path

from app.services.claims_engine import scan_claims

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
RULES_PATH = REPO_ROOT / "data" / "demo_policy" / "rules.json"
SAMPLES_PATH = REPO_ROOT / "data" / "demo_submissions" / "samples.json"


def get_demo_claims():
    assert RULES_PATH.exists()
    data = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    return data.get("approved_claims", [])


def test_expired_claim_detected_in_sub02():
    data = json.loads(SAMPLES_PATH.read_text(encoding="utf-8"))
    sub02 = next((s for s in data["samples"] if s["id"] == "SUB-02"), None)
    assert sub02 is not None

    claims = get_demo_claims()
    # As of current 2026 date (CLAIM-001 expired 2025-01-01)
    as_of = datetime(2026, 10, 25, tzinfo=UTC)
    findings = scan_claims(sub02["content"], claims, as_of=as_of)

    assert len(findings) == 1
    f = findings[0]
    assert f.claim_code == "CLAIM-001"
    assert f.severity == "CRITICAL"
    assert f.verification_status == "EXPIRED_CLAIM"
    assert "EXPIRED_CLAIM: Claim expired on 2025-01-01" in f.reason
    assert "99.99% uptime" in f.flagged_text

    # Verify offset slice
    extracted = sub02["content"][f.start_offset : f.end_offset]
    assert extracted.lower() == f.flagged_text.lower()


def test_valid_active_claim_in_sub01_not_flagged():
    data = json.loads(SAMPLES_PATH.read_text(encoding="utf-8"))
    sub01 = next((s for s in data["samples"] if s["id"] == "SUB-01"), None)
    assert sub01 is not None

    claims = get_demo_claims()
    as_of = datetime(2026, 10, 25, tzinfo=UTC)
    # SUB-01 uses CLAIM-002 ("over 2 million active accounts"), which is valid in 2026
    findings = scan_claims(sub01["content"], claims, as_of=as_of)

    # Valid claim is not marked as violation
    assert len(findings) == 0
