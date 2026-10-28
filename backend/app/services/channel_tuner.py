"""Channel Severity Threshold Tuner Service.

Enforces context-aware rule severity tuning per marketing channel while strictly
protecting Canon's Core Compliance Invariant:
Statutory mandates and security gateways CANNOT be weakened or bypassed.
"""

from typing import Any

VALID_CHANNELS = {
    "web_landing_page",
    "email_blast",
    "ad_copy",
    "press_release",
    "partner_portal",
    "social_post",
}

VALID_SEVERITIES = {"CRITICAL", "MAJOR", "WARNING", "INFO"}

# Critical statutory mandates and security controls that can NEVER be tuned below CRITICAL
IMMUTABLE_CRITICAL_RULES = {
    "TERM-001",  # FDIC 12 U.S.C. § 1828 Banking Charter Prohibition
    "TERM-003",  # SEC Rule 206(4)-1 Guaranteed Performance Ban
    "TERM-006",  # FTC Act § 5 Free/Zero-Fee Deception Mandate
    "CLAIM-001",  # FTC Advertising Substantiation Doctrine
    "INJECT-001", # EU AI Act Art. 14 / LLM Gateway Safety
}

# Default channel-specific baseline severity configurations
DEFAULT_CHANNEL_THRESHOLDS: dict[str, dict[str, str]] = {
    "press_release": {
        "TONE-001": "CRITICAL",
        "TONE-002": "CRITICAL",
        "TERM-004": "CRITICAL",
        "TERM-005": "MAJOR",
    },
    "web_landing_page": {
        "TONE-001": "WARNING",
        "TONE-002": "WARNING",
        "TERM-004": "WARNING",
        "TERM-005": "WARNING",
    },
    "ad_copy": {
        "TONE-001": "WARNING",
        "TONE-002": "INFO",
        "TERM-004": "WARNING",
        "TERM-005": "INFO",
    },
    "social_post": {
        "TONE-001": "INFO",
        "TONE-002": "INFO",
        "TERM-004": "WARNING",
        "TERM-005": "INFO",
    },
    "email_blast": {
        "TONE-001": "WARNING",
        "TONE-002": "WARNING",
        "TERM-004": "WARNING",
        "TERM-005": "WARNING",
    },
    "partner_portal": {
        "TONE-001": "INFO",
        "TONE-002": "INFO",
        "TERM-004": "INFO",
        "TERM-005": "INFO",
    },
}

# In-memory runtime override store for customized configurations
_active_custom_thresholds: dict[str, dict[str, str]] = {}


def get_channel_thresholds(channel: str) -> dict[str, str]:
    """Returns the effective severity threshold dictionary for a specified channel."""
    if channel not in VALID_CHANNELS:
        raise ValueError(f"Invalid channel '{channel}'. Allowed: {sorted(VALID_CHANNELS)}")

    baseline = DEFAULT_CHANNEL_THRESHOLDS.get(channel, {}).copy()
    custom = _active_custom_thresholds.get(channel, {})
    baseline.update(custom)
    return baseline


def tune_channel_rule_severity(
    channel: str,
    rule_code: str,
    target_severity: str,
) -> dict[str, str]:
    """
    Updates the severity threshold for a rule on a specific marketing channel.
    Enforces the immutable statutory invariant: Statutory rules cannot be weakened below CRITICAL.
    """
    if channel not in VALID_CHANNELS:
        raise ValueError(f"Invalid channel '{channel}'. Allowed: {sorted(VALID_CHANNELS)}")

    target_sev = target_severity.upper().strip()
    if target_sev not in VALID_SEVERITIES:
        raise ValueError(f"Invalid severity '{target_severity}'. Allowed: {sorted(VALID_SEVERITIES)}")

    # Enforce Core Safety Invariant: Statutory mandates and security controls cannot be weakened
    if rule_code in IMMUTABLE_CRITICAL_RULES:
        if target_sev != "CRITICAL":
            raise PermissionError(
                f"Statutory mandate rule '{rule_code}' cannot be weakened or downgraded to '{target_sev}'. "
                f"Federal statutory and security controls must remain CRITICAL across all channels."
            )

    if channel not in _active_custom_thresholds:
        _active_custom_thresholds[channel] = {}

    _active_custom_thresholds[channel][rule_code] = target_sev
    return get_channel_thresholds(channel)


def resolve_effective_severity(
    rule_code: str,
    base_severity: str,
    channel: str | None = None,
) -> str:
    """
    Resolves the effective severity for a rule based on the active channel scope.
    Statutory rules always remain CRITICAL.
    """
    if rule_code in IMMUTABLE_CRITICAL_RULES:
        return "CRITICAL"

    if not channel or channel not in VALID_CHANNELS:
        return base_severity

    channel_rules = get_channel_thresholds(channel)
    return channel_rules.get(rule_code, base_severity)


def reset_channel_thresholds(channel: str | None = None) -> None:
    """Resets custom threshold overrides to factory baseline defaults."""
    global _active_custom_thresholds
    if channel:
        _active_custom_thresholds.pop(channel, None)
    else:
        _active_custom_thresholds.clear()

