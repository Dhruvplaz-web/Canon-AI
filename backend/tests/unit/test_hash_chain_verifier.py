"""Unit tests for Feature 2.3: Cryptographic Audit Trail Hash Chain Verifier."""

import unittest
from app.services.hash_chain import (
    GENESIS_PREV_HASH,
    build_audit_chain,
    compute_block_hash,
    compute_payload_hash,
    verify_hash_chain,
)


class TestHashChainVerifier(unittest.TestCase):
    """Tests cryptographic chain generation, tamper detection, and verification invariants."""

    def setUp(self):
        self.sample_logs = [
            {
                "id": "aud_001",
                "timestamp": "2026-10-29T10:00:00Z",
                "actor": "Rachel Reviewer",
                "action": "SUBMISSION_CHECK_RUN",
                "entity_type": "SUBMISSION",
                "entity_id": "sub_q1_ad",
                "payload": {"status": "FLAGGED", "findings_count": 2},
            },
            {
                "id": "aud_002",
                "timestamp": "2026-10-29T10:05:00Z",
                "actor": "Rachel Reviewer",
                "action": "FINDING_OVERRIDE_RECORDED",
                "entity_type": "FINDING",
                "entity_id": "fnd_term_001",
                "payload": {"reason_code": "PARTNER_EXEMPTION", "notes": "Approved partner co-brand."},
            },
            {
                "id": "aud_003",
                "timestamp": "2026-10-29T10:10:00Z",
                "actor": "Alice BrandManager",
                "action": "POLICY_ADOPT_V1_1",
                "entity_type": "POLICY_VERSION",
                "entity_id": "pol_v1_1",
                "payload": {"version": "1.1", "approved_rules_count": 14},
            },
            {
                "id": "aud_004",
                "timestamp": "2026-10-29T10:15:00Z",
                "actor": "Automated Sign-Off Gate",
                "action": "COMPLIANCE_CERTIFICATE_ISSUED",
                "entity_type": "CERTIFICATE",
                "entity_id": "cert_acme_2026",
                "payload": {"certificate_id": "CERT-ACME-001", "sha256": "8b1f4a9c..."},
            },
        ]

    def test_empty_chain_is_valid(self):
        """Confirm that empty chain safely reports valid genesis state."""
        report = verify_hash_chain([])
        self.assertTrue(report["is_valid"])
        self.assertEqual(report["total_blocks"], 0)
        self.assertEqual(report["broken_links"], 0)
        self.assertIsNone(report["root_hash"])

    def test_valid_chain_verifies_completely(self):
        """Confirm that a validly formed hash chain passes 100% verification."""
        chain = build_audit_chain(self.sample_logs)
        self.assertEqual(len(chain), 4)

        report = verify_hash_chain(chain)
        self.assertTrue(report["is_valid"])
        self.assertEqual(report["total_blocks"], 4)
        self.assertEqual(report["verified_blocks"], 4)
        self.assertEqual(report["broken_links"], 0)
        self.assertIsNotNone(report["root_hash"])
        self.assertEqual(report["root_hash"], chain[-1]["hash"])

    def test_tampered_payload_content_detected(self):
        """Confirm that modifying payload in any block is caught by hash re-computation."""
        chain = build_audit_chain(self.sample_logs)
        # Malicious actor changes the action or details in block #2
        chain[2]["action"] = "UNAUTHORIZED_POLICY_MUTATION"

        report = verify_hash_chain(chain)
        self.assertFalse(report["is_valid"])
        self.assertEqual(report["failed_at_index"], 2)
        self.assertEqual(report["failure_reason"], "ALTERED_RECORD_CONTENT")
        self.assertEqual(report["verified_blocks"], 2)

    def test_broken_prev_hash_link_detected(self):
        """Confirm that severing prev_hash pointer is caught as broken link."""
        chain = build_audit_chain(self.sample_logs)
        # Sever block 3 link
        chain[3]["prev_hash"] = "f" * 64

        report = verify_hash_chain(chain)
        self.assertFalse(report["is_valid"])
        self.assertEqual(report["failed_at_index"], 3)
        self.assertEqual(report["failure_reason"], "BROKEN_CHAIN_LINK")

    def test_reordered_records_detected(self):
        """Confirm that swapping blocks in sequence is detected."""
        chain = build_audit_chain(self.sample_logs)
        # Swap block 1 and block 2
        chain[1], chain[2] = chain[2], chain[1]

        report = verify_hash_chain(chain)
        self.assertFalse(report["is_valid"])
        self.assertEqual(report["failure_reason"], "REORDERED_OR_MISSING_BLOCK")

    def test_malformed_input_handled_safely(self):
        """Confirm that non-list or invalid dict inputs fail gracefully."""
        self.assertFalse(verify_hash_chain("not a list")["is_valid"])
        self.assertFalse(verify_hash_chain([{"index": 0}, "not a dict"])["is_valid"])


if __name__ == "__main__":
    unittest.main()

