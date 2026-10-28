"""Unit tests for Feature 2.5: Audit Dossier CSV/JSON Export Service."""

import csv
import io
import json
import unittest

from app.services.audit_export import (
    DOSSIER_COLUMNS,
    export_audit_dossier_csv,
    export_audit_dossier_json,
    sanitize_csv_field,
)
from app.services.hash_chain import build_audit_chain


class TestAuditDossierExport(unittest.TestCase):
    """Tests CSV/JSON export generation, formula injection defense, and Unicode safety."""

    def setUp(self):
        self.raw_logs = [
            {
                "id": "aud_001",
                "timestamp": "2026-10-29T10:00:00Z",
                "actor": "Rachel Reviewer",
                "action": "SUBMISSION_APPROVED",
                "entity_type": "SUBMISSION",
                "entity_id": "sub_101",
                "payload": {"title": "Acme Treasury Euro Growth (€50M Target)"},
            },
            {
                "id": "aud_002",
                "timestamp": "2026-10-29T10:10:00Z",
                "actor": "Alice BrandManager",
                "action": "POLICY_ADOPT_V1_1",
                "entity_type": "POLICY_VERSION",
                "entity_id": "pol_v1_1",
                "payload": {"version": "1.1"},
            },
        ]
        self.chain = build_audit_chain(self.raw_logs)

    def test_csv_export_headers_and_row_count(self):
        """Confirm CSV dossier contains expected columns and row count."""
        csv_str = export_audit_dossier_csv(self.chain)
        reader = list(csv.reader(io.StringIO(csv_str)))

        # Header check
        self.assertEqual(reader[0], DOSSIER_COLUMNS)
        # Row count: 1 header + 2 blocks
        self.assertEqual(len(reader), 3)
        self.assertEqual(reader[1][1], "aud_001")
        self.assertEqual(reader[2][1], "aud_002")

    def test_csv_formula_injection_defense(self):
        """Confirm OWASP CSV formula injection vectors (=, +, -, @) are sanitized with single quote."""
        malicious_inputs = [
            "=SUM(A1:A10)",
            "+cmd|' /C calc'!A0",
            "-2+3*cmd|' /C calc'!A0",
            "@SUM(1+1)*cmd|' /C calc'!A0",
            "\tTAB_INJECT",
            "\rCR_INJECT",
        ]
        for payload in malicious_inputs:
            sanitized = sanitize_csv_field(payload)
            self.assertTrue(
                sanitized.startswith("'"),
                f"Malicious payload '{payload}' was not neutralized: got '{sanitized}'"
            )

        safe_inputs = ["Normal Text", "12 U.S.C. § 1828", "2026-10-29", ""]
        for val in safe_inputs:
            self.assertEqual(sanitize_csv_field(val), val)

    def test_json_export_structure(self):
        """Confirm JSON export conforms to regulatory audit dossier contract."""
        json_str = export_audit_dossier_json(self.chain, {"exported_at": "2026-10-29T11:00:00Z"})
        data = json.loads(json_str)

        self.assertEqual(data["total_records"], 2)
        self.assertEqual(data["chain_integrity"], "VERIFIED")
        self.assertEqual(len(data["records"]), 2)
        self.assertEqual(data["root_hash"], self.chain[-1]["hash"])
        self.assertEqual(data["records"][0]["action"], "SUBMISSION_APPROVED")

    def test_empty_dossier_handling(self):
        """Confirm empty dataset produces valid empty CSV and JSON structures."""
        csv_str = export_audit_dossier_csv([])
        reader = list(csv.reader(io.StringIO(csv_str)))
        self.assertEqual(len(reader), 1)  # Header only
        self.assertEqual(reader[0], DOSSIER_COLUMNS)

        json_str = export_audit_dossier_json([])
        data = json.loads(json_str)
        self.assertEqual(data["total_records"], 0)
        self.assertEqual(data["records"], [])
        self.assertIsNone(data["root_hash"])

    def test_unicode_characters_preserved(self):
        """Confirm Unicode characters (€, —, ü) are preserved intact without corruption."""
        block = {
            "index": 0,
            "id": "aud_uni",
            "timestamp": "2026-10-29T10:00:00Z",
            "actor": "Müller Compliance",
            "action": "ACTION_€_EURO_—_DASH",
            "entity_type": "SUBMISSION",
            "entity_id": "ent_01",
            "prev_hash": "0" * 64,
            "hash": "abc",
        }
        csv_str = export_audit_dossier_csv([block])
        self.assertIn("Müller Compliance", csv_str)
        self.assertIn("ACTION_€_EURO_—_DASH", csv_str)


if __name__ == "__main__":
    unittest.main()

