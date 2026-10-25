"""Pre-flight prompt injection sanitizer and security delimiter boundary."""

import re
from dataclasses import dataclass, field


@dataclass(frozen=True)
class InjectionFinding:
    """Security finding emitted when an adversarial injection pattern is detected."""

    rule_code: str
    pattern_name: str
    matched_text: str
    start_offset: int
    end_offset: int
    severity: str = "CRITICAL"
    reason: str = "Malicious prompt injection attempt detected by pre-flight sanitizer."


@dataclass
class ScanResult:
    """Result of prompt injection security scan."""

    is_safe: bool
    findings: list[InjectionFinding] = field(default_factory=list)


# Compiled regular expressions for adversarial prompt injection detection
INJECTION_PATTERNS = [
    (
        "SYSTEM_NOTICE_OVERRIDE",
        re.compile(
            r"(?:\[\s*SYSTEM\s*(?:NOTICE|PROMPT|INSTRUCTION|MESSAGE|DIRECTIVE)?\s*:[^\]]*\]|SYSTEM\s+(?:INSTRUCTION|NOTICE|DIRECTIVE)\s+OVERRIDE:?)",
            re.IGNORECASE,
        ),
    ),
    (
        "DISREGARD_PRIOR_INSTRUCTIONS",
        re.compile(
            r"(?:disregard|ignore|forget)\s+(?:all\s+)?(?:prior|previous|existing)\s+(?:brand\s+)?(?:safety\s+)?(?:instructions|rules|prompts|guidelines)",
            re.IGNORECASE,
        ),
    ),
    (
        "TEST_MODE_BYPASS",
        re.compile(
            r"(?:you\s+are\s+(?:now\s+)?in\s+(?:system\s+)?(?:test|developer|debug|god|unrestricted)\s+mode)",
            re.IGNORECASE,
        ),
    ),
    (
        "FABRICATE_PASSED_RESULT",
        re.compile(
            r"(?:immediately\s+)?(?:mark\s+all\s+(?:rules\s+as\s+)?passed|return\s+(?:valid\s+)?json\s+without\s+findings)",
            re.IGNORECASE,
        ),
    ),
    (
        "PROMPT_DELIMITER_INJECTION",
        re.compile(
            r"(?:<\s*/?\s*system\s*>|\[/?INST\]|<<SYS>>|<\|im_start\|>|<\|im_end\|>)",
            re.IGNORECASE,
        ),
    ),
]


def scan_for_injections(text: str) -> ScanResult:
    """
    Scans untrusted input text for adversarial prompt injection signatures
    before routing to downstream evaluation pipelines or LLM adapters.
    """
    if not text:
        return ScanResult(is_safe=True, findings=[])

    findings: list[InjectionFinding] = []

    for pattern_name, regex in INJECTION_PATTERNS:
        for match in regex.finditer(text):
            findings.append(
                InjectionFinding(
                    rule_code="SEC-INJ-001",
                    pattern_name=pattern_name,
                    matched_text=match.group(0),
                    start_offset=match.start(),
                    end_offset=match.end(),
                    severity="CRITICAL",
                    reason="Malicious prompt injection attempt detected by pre-flight sanitizer.",
                )
            )

    return ScanResult(
        is_safe=len(findings) == 0,
        findings=findings,
    )


def wrap_with_security_boundary(content: str) -> str:
    """
    Wraps untrusted submission content within strict XML security delimiters
    to prevent prompt leakage or instruction hijacking.
    """
    sanitized = content.replace("</untrusted_submission_content>", "")
    return f"<untrusted_submission_content>\n{sanitized}\n</untrusted_submission_content>"
