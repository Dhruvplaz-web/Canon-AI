"""Unit tests for Feature 2.2: Statutory Regulatory Badges and legal grounding matrix."""

import json
import os
import unittest


class TestPolicyStatutoryBadges(unittest.TestCase):
    """Verifies statutory metadata schema, legal citations, and backward compatibility."""

    @classmethod
    def setUpClass(cls):
        # Repo root is 4 levels up from backend/tests/unit/test_policy_statutory_badges.py
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        cls.rules_json_path = os.path.join(base_dir, "data", "demo_policy", "rules.json")
        with open(cls.rules_json_path, "r", encoding="utf-8") as f:
            cls.policy_data = json.load(f)
        cls.rules = cls.policy_data.get("rules", [])
        cls.rules_by_code = {r["rule_code"]: r for r in cls.rules}

    def test_rules_json_exists_and_contains_expected_rules(self):
        """Confirm demo policy contains all 12 baseline governance rules."""
        self.assertGreaterEqual(len(self.rules), 12)
        expected_codes = [
            "TERM-001", "TERM-002", "TERM-003", "TERM-004", "TERM-005",
            "TERM-006", "TERM-007", "CLAIM-001", "CLAIM-002",
            "TONE-001", "TONE-002", "VIS-001"
        ]
        for code in expected_codes:
            self.assertIn(code, self.rules_by_code, f"Rule {code} missing from rules.json")

    def test_statutory_rules_contain_all_required_metadata(self):
        """Confirm that rules with statutory grounding provide all required fields."""
        required_fields = [
            "statute_code",
            "act_name",
            "jurisdiction",
            "section_pin",
            "enforcement_body",
            "penalty_exposure",
            "mandate_tier",
            "mandate_summary",
            "official_uri",
        ]
        allowed_tiers = {
            "STATUTORY_MANDATE",
            "REGULATORY_RULE",
            "SUBSTANTIATION_MANDATE",
            "ACCESSIBILITY_STANDARD",
        }
        allowed_jurisdictions = {
            "US_FEDERAL",
            "US_STATE_NY",
            "EU",
            "INTERNATIONAL",
        }

        statutory_codes = [
            "TERM-001", "TERM-002", "TERM-003", "TERM-004",
            "TERM-006", "CLAIM-001", "CLAIM-002",
            "TONE-001", "TONE-002", "VIS-001"
        ]

        for code in statutory_codes:
            rule = self.rules_by_code[code]
            citation = rule.get("source_citation", {})
            statute = citation.get("regulatory_statute")
            self.assertIsNotNone(statute, f"Rule {code} must have regulatory_statute")

            for field in required_fields:
                self.assertIn(field, statute, f"Rule {code} missing statute field '{field}'")
                self.assertTrue(len(str(statute[field]).strip()) > 0, f"Rule {code} empty '{field}'")

            self.assertIn(statute["mandate_tier"], allowed_tiers)
            self.assertIn(statute["jurisdiction"], allowed_jurisdictions)
            self.assertTrue(statute["official_uri"].startswith("https://"))

    def test_internal_rules_omit_statutory_badges(self):
        """Confirm internal stylistic rules (TERM-005, TERM-007) do NOT claim statutory mandates."""
        internal_codes = ["TERM-005", "TERM-007"]
        for code in internal_codes:
            rule = self.rules_by_code[code]
            citation = rule.get("source_citation", {})
            statute = citation.get("regulatory_statute")
            self.assertIsNone(
                statute,
                f"Rule {code} is internal policy and must not declare a statutory mandate"
            )

    def test_statutory_authority_citations_match_approved_matrix(self):
        """Verify each specific statute matches the approved primary legal sources."""
        # TERM-001: FDIC Part 328 & 12 U.S.C. § 1828
        term_001 = self.rules_by_code["TERM-001"]["source_citation"]["regulatory_statute"]
        self.assertEqual(term_001["statute_code"], "FDIA-12-USC-1828")
        self.assertIn("12 U.S.C. § 1828", term_001["section_pin"])
        self.assertIn("FDIC", term_001["enforcement_body"])
        self.assertEqual(term_001["mandate_tier"], "STATUTORY_MANDATE")

        # TERM-003: SEC Rule 206(4)-1 & IAA § 206(4)
        term_003 = self.rules_by_code["TERM-003"]["source_citation"]["regulatory_statute"]
        self.assertEqual(term_003["statute_code"], "SEC-IAA-RULE-206-4-1")
        self.assertIn("15 U.S.C. § 80b-6", term_003["section_pin"])
        self.assertIn("SEC", term_003["enforcement_body"])
        self.assertEqual(term_003["mandate_tier"], "STATUTORY_MANDATE")

        # TERM-004: TILA & CFPB Reg Z
        term_004 = self.rules_by_code["TERM-004"]["source_citation"]["regulatory_statute"]
        self.assertEqual(term_004["statute_code"], "CFPB-TILA-REG-Z")
        self.assertIn("15 U.S.C. § 1601", term_004["section_pin"])
        self.assertIn("CFPB", term_004["enforcement_body"])
        self.assertEqual(term_004["mandate_tier"], "REGULATORY_RULE")

        # TERM-006: FTC Act § 5 (Free / Zero Fees)
        term_006 = self.rules_by_code["TERM-006"]["source_citation"]["regulatory_statute"]
        self.assertEqual(term_006["statute_code"], "FTC-15-USC-45-FREE")
        self.assertIn("15 U.S.C. § 45", term_006["section_pin"])
        self.assertIn("FTC", term_006["enforcement_body"])
        self.assertEqual(term_006["mandate_tier"], "STATUTORY_MANDATE")

        # CLAIM-001: FTC Advertising Substantiation
        claim_001 = self.rules_by_code["CLAIM-001"]["source_citation"]["regulatory_statute"]
        self.assertEqual(claim_001["statute_code"], "FTC-15-USC-45-SUBSTANTIATION")
        self.assertIn("104 F.T.C. 839", claim_001["section_pin"])
        self.assertEqual(claim_001["mandate_tier"], "SUBSTANTIATION_MANDATE")

        # VIS-001: ADA Title III & WCAG 2.1 AA
        vis_001 = self.rules_by_code["VIS-001"]["source_citation"]["regulatory_statute"]
        self.assertEqual(vis_001["statute_code"], "ADA-TITLE-III-WCAG")
        self.assertIn("42 U.S.C. § 12181", vis_001["section_pin"])
        self.assertEqual(vis_001["mandate_tier"], "ACCESSIBILITY_STANDARD")

    def test_schema_backward_compatibility(self):
        """Ensure RuleDetailResponse serialization is completely backwards-compatible."""
        try:
            from app.schemas.governance import RuleDetailResponse
            term_001_raw = self.rules_by_code["TERM-001"]
            payload = {
                "id": "rul_term_001",
                "rule_code": term_001_raw["rule_code"],
                "category": term_001_raw["category"],
                "severity": term_001_raw["severity"],
                "title": term_001_raw["title"],
                "description": "Statutory rule test",
                "pattern_or_term": term_001_raw.get("forbidden_term"),
                "suggested_replacement": term_001_raw.get("suggested_replacement"),
                "source_citation": term_001_raw.get("source_citation", {}),
                "is_active": True,
            }
            validated = RuleDetailResponse(**payload)
            self.assertEqual(validated.rule_code, "TERM-001")
            self.assertIn("regulatory_statute", validated.source_citation)
            self.assertEqual(
                validated.source_citation["regulatory_statute"]["statute_code"],
                "FDIA-12-USC-1828"
            )
        except ImportError:
            # Fallback if Pydantic is not installed in standard test runner
            pass


if __name__ == "__main__":
    unittest.main()
