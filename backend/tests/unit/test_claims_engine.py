"""Unit tests for the Claims Ledger and Expired Claim Validator."""

import json
import unittest
from datetime import UTC, datetime
from pathlib import Path

from app.services.claims_engine import (
    advance_calendar_months,
    parse_temporal_boundary,
    scan_claims,
)

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
RULES_PATH = REPO_ROOT / "data" / "demo_policy" / "rules.json"
SAMPLES_PATH = REPO_ROOT / "data" / "demo_submissions" / "samples.json"


def get_demo_claims():
    assert RULES_PATH.exists()
    data = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    return data.get("approved_claims", [])


class TestClaimsEngine(unittest.TestCase):
    """Test suite verifying temporal claims ledger scanning and expiry simulation."""

    def test_expired_claim_detected_in_sub02(self):
        data = json.loads(SAMPLES_PATH.read_text(encoding="utf-8"))
        sub02 = next((s for s in data["samples"] if s["id"] == "SUB-02"), None)
        self.assertIsNotNone(sub02)

        claims = get_demo_claims()
        # As of current 2026 date (CLAIM-001 expired 2025-01-01)
        as_of = datetime(2026, 10, 25, tzinfo=UTC)
        findings = scan_claims(sub02["content"], claims, as_of=as_of)

        self.assertEqual(len(findings), 1)
        f = findings[0]
        self.assertEqual(f.claim_code, "CLAIM-001")
        self.assertEqual(f.severity, "CRITICAL")
        self.assertEqual(f.verification_status, "EXPIRED_CLAIM")
        self.assertIn("EXPIRED_CLAIM: Claim expired on 2025-01-01", f.reason)
        self.assertIn("99.99% uptime", f.flagged_text)

        # Verify offset slice
        extracted = sub02["content"][f.start_offset : f.end_offset]
        self.assertEqual(extracted.lower(), f.flagged_text.lower())

    def test_valid_active_claim_in_sub01_not_flagged_in_2026(self):
        data = json.loads(SAMPLES_PATH.read_text(encoding="utf-8"))
        sub01 = next((s for s in data["samples"] if s["id"] == "SUB-01"), None)
        self.assertIsNotNone(sub01)

        claims = get_demo_claims()
        as_of = datetime(2026, 10, 25, tzinfo=UTC)
        # SUB-01 uses CLAIM-002 ("over 2 million active accounts"), valid in 2026
        findings = scan_claims(sub01["content"], claims, as_of=as_of)
        self.assertEqual(len(findings), 0)

    def test_simulation_advancing_6_months_expires_claim_002(self):
        """When advancing simulated date by 6 months past 2026-12-31, CLAIM-002 expires."""
        data = json.loads(SAMPLES_PATH.read_text(encoding="utf-8"))
        sub01 = next((s for s in data["samples"] if s["id"] == "SUB-01"), None)
        self.assertIsNotNone(sub01)

        claims = get_demo_claims()
        # Advance 6 months from 2026-10-29 to 2027-04-29
        simulated_as_of = datetime(2027, 4, 29, tzinfo=UTC)
        findings = scan_claims(sub01["content"], claims, as_of=simulated_as_of)

        self.assertEqual(len(findings), 1)
        f = findings[0]
        self.assertEqual(f.claim_code, "CLAIM-002")
        self.assertEqual(f.severity, "CRITICAL")
        self.assertEqual(f.verification_status, "EXPIRED_CLAIM")
        self.assertIn("Claim expired on 2026-12-31", f.reason)
        self.assertIn("2 million active accounts", f.flagged_text)

    def test_simulation_claim_003_remains_valid_after_6_months(self):
        """CLAIM-003 valid until 2028-03-01 remains valid under a 6-month simulation to 2027."""
        claims = get_demo_claims()
        text = "Acme offers zero maintenance fees on digital treasury accounts for enterprises."
        simulated_as_of = datetime(2027, 4, 29, tzinfo=UTC)
        findings = scan_claims(text, claims, as_of=simulated_as_of)
        # Should not be flagged as expired
        self.assertEqual(len(findings), 0)

    def test_parse_temporal_boundary_timezone_offsets(self):
        """Verifies that non-UTC timezone offsets are converted to UTC without offset loss."""
        # 5:30 AM in UTC+5:30 is 00:00:00 UTC
        aware_dt = parse_temporal_boundary("2027-01-01T05:30:00+05:30")
        self.assertIsNotNone(aware_dt)
        self.assertEqual(aware_dt, datetime(2027, 1, 1, 0, 0, 0, tzinfo=UTC))

        # 8:00 PM on 2026-12-31 in UTC-4 is 00:00:00 UTC on 2027-01-01
        us_dt = parse_temporal_boundary("2026-12-31T20:00:00-04:00")
        self.assertIsNotNone(us_dt)
        self.assertEqual(us_dt, datetime(2027, 1, 1, 0, 0, 0, tzinfo=UTC))

    def test_parse_temporal_boundary_date_only_end_of_day(self):
        """Date-only boundaries (YYYY-MM-DD) remain valid throughout the full calendar day."""
        v_until = parse_temporal_boundary("2026-12-31", is_end_of_day=True)
        self.assertIsNotNone(v_until)

        # At noon on Dec 31: valid
        as_of_noon = datetime(2026, 12, 31, 12, 0, 0, tzinfo=UTC)
        self.assertFalse(as_of_noon > v_until)

        # At midnight on Jan 1: expired
        as_of_next_day = datetime(2027, 1, 1, 0, 0, 0, tzinfo=UTC)
        self.assertTrue(as_of_next_day > v_until)

    def test_advance_calendar_months_month_end_and_leap_year(self):
        """Calendar month advance clamps month-end overflow and handles leap years."""
        # Oct 31 + 6 months -> Apr 30
        oct31 = datetime(2026, 10, 31, tzinfo=UTC)
        apr30 = advance_calendar_months(oct31, 6)
        self.assertEqual(apr30, datetime(2027, 4, 30, tzinfo=UTC))

        # Aug 31, 2027 + 6 months -> Feb 29, 2028 (2028 is a leap year)
        aug31 = datetime(2027, 8, 31, tzinfo=UTC)
        feb29 = advance_calendar_months(aug31, 6)
        self.assertEqual(feb29, datetime(2028, 2, 29, tzinfo=UTC))

    def test_future_valid_from_flags_premature_claim(self):
        """Claim with future effective date triggers PREMATURE_CLAIM warning."""
        future_claim = {
            "claim_code": "CLAIM-FUTURE",
            "claim_text": "global AI treasury automation",
            "substantiation": "Launch Certification 2028",
            "valid_from": "2028-01-01",
            "valid_until": "2029-01-01",
            "is_active": True,
        }
        text = "Our global AI treasury automation reduces manual reconciliations."
        findings = scan_claims(text, [future_claim], as_of=datetime(2027, 1, 1, tzinfo=UTC))

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].verification_status, "PREMATURE_CLAIM")
        self.assertEqual(findings[0].severity, "WARNING")

    def test_inactive_claim_flagged(self):
        """Decommissioned claim with is_active=False triggers INACTIVE_CLAIM."""
        inactive_claim = {
            "claim_code": "CLAIM-RETIRED",
            "claim_text": "legacy zero fee transfers",
            "substantiation": "Old 2022 Tariff",
            "valid_from": "2022-01-01",
            "valid_until": "2028-01-01",
            "is_active": False,
        }
        text = "Enjoy legacy zero fee transfers forever."
        findings = scan_claims(text, [inactive_claim], as_of=datetime(2026, 10, 29, tzinfo=UTC))

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].verification_status, "INACTIVE_CLAIM")
        self.assertEqual(findings[0].severity, "CRITICAL")

    def test_malformed_and_missing_dates_handled_safely(self):
        """Malformed or None validity dates do not crash the engine."""
        broken_claim = {
            "claim_code": "CLAIM-BROKEN",
            "claim_text": "untested claim text",
            "substantiation": "No evidence",
            "valid_from": None,
            "valid_until": "completely-invalid-date-string",
            "is_active": True,
        }
        text = "This is untested claim text for validation."
        findings = scan_claims(text, [broken_claim], as_of=datetime(2026, 10, 29, tzinfo=UTC))
        # Does not throw exception
        self.assertEqual(len(findings), 0)


# Support direct script execution
if __name__ == "__main__":
    unittest.main()
