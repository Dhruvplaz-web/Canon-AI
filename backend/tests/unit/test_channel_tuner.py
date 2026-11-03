"""Unit tests for Feature 2.4: Channel Severity Threshold Tuner."""

import unittest

from app.services.channel_tuner import (
    DEFAULT_CHANNEL_THRESHOLDS,
    IMMUTABLE_CRITICAL_RULES,
    VALID_CHANNELS,
    VALID_SEVERITIES,
    get_channel_thresholds,
    reset_channel_thresholds,
    resolve_effective_severity,
    tune_channel_rule_severity,
)


class TestChannelTuner(unittest.TestCase):
    """Verifies channel severity tuning, validation, defaults, and statutory protection."""

    def setUp(self):
        reset_channel_thresholds()

    def tearDown(self):
        reset_channel_thresholds()

    def test_default_channel_severities(self):
        """Confirm different channels start with distinct appropriate defaults."""
        pr_thresholds = get_channel_thresholds("press_release")
        social_thresholds = get_channel_thresholds("social_post")

        # In press releases, informal slang is strictly CRITICAL
        self.assertEqual(pr_thresholds.get("TONE-002"), "CRITICAL")
        # In social media posts, slang is relaxed to INFO
        self.assertEqual(social_thresholds.get("TONE-002"), "INFO")

    def test_valid_threshold_update(self):
        """Confirm valid non-critical rule can be tuned to permitted severities."""
        updated = tune_channel_rule_severity(
            channel="web_landing_page",
            rule_code="TONE-002",
            target_severity="INFO",
        )
        self.assertEqual(updated["TONE-002"], "INFO")

        # Resolve effective severity matches update
        eff = resolve_effective_severity("TONE-002", "WARNING", "web_landing_page")
        self.assertEqual(eff, "INFO")

    def test_statutory_mandates_cannot_be_downgraded(self):
        """
        CRITICAL SAFETY INVARIANT: Statutory rules (FDIC, SEC, FTC) and security controls
        CANNOT be weakened or downgraded below CRITICAL.
        """
        for statutory_rule in IMMUTABLE_CRITICAL_RULES:
            for forbidden_sev in ["MAJOR", "WARNING", "INFO"]:
                with self.assertRaises(
                    PermissionError,
                    msg=f"Should reject downgrading statutory rule {statutory_rule} to {forbidden_sev}"
                ):
                    tune_channel_rule_severity(
                        channel="social_post",
                        rule_code=statutory_rule,
                        target_severity=forbidden_sev,
                    )

            # Confirm resolve_effective_severity always yields CRITICAL
            self.assertEqual(
                resolve_effective_severity(statutory_rule, "WARNING", "social_post"),
                "CRITICAL"
            )

    def test_invalid_channel_rejected(self):
        """Confirm unknown marketing channels raise ValueError."""
        with self.assertRaises(ValueError):
            get_channel_thresholds("unsupported_billboard_channel")

        with self.assertRaises(ValueError):
            tune_channel_rule_severity("invalid_channel", "TONE-002", "INFO")

    def test_invalid_severity_rejected(self):
        """Confirm non-standard severity levels raise ValueError."""
        with self.assertRaises(ValueError):
            tune_channel_rule_severity("ad_copy", "TONE-002", "NON_EXISTENT_SEVERITY")

    def test_reset_channel_thresholds(self):
        """Confirm resetting clears custom overrides back to baseline defaults."""
        tune_channel_rule_severity("ad_copy", "TONE-001", "CRITICAL")
        self.assertEqual(get_channel_thresholds("ad_copy")["TONE-001"], "CRITICAL")

        reset_channel_thresholds("ad_copy")
        # Returns back to default WARNING
        self.assertEqual(get_channel_thresholds("ad_copy")["TONE-001"], "WARNING")


if __name__ == "__main__":
    unittest.main()

