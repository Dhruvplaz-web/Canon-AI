"""Unit tests for the Semantic Tone & Policy Intent Scanner Engine."""

from types import SimpleNamespace

from app.pipeline.llm.adapter import DeterministicMockAdapter
from app.services.semantic_engine import scan_semantic_violations


def test_semantic_scanner_identifies_urgency_and_tone_violations():
    mock_rules = [
        SimpleNamespace(
            rule_code="TONE-001",
            category="TONE",
            severity="WARNING",
            title="Urgent Pressure Tactics & Fear of Missing Out (FOMO)",
            description="High-pressure sales phrases such as 'Act now or miss out forever!' or 'Don't get left behind!' are strictly prohibited.",
            suggested_replacement="Explore our portfolio solutions at your convenience.",
            source_citation={
                "document": "ACME-GUIDELINES-2026-V1",
                "section": "SECTION 3: EDITORIAL VOICE AND TONE",
                "page": 2,
                "exact_quote": "High-pressure sales phrases such as \"Act now or miss out forever!\" or \"Don't get left behind!\" are strictly prohibited in public communications.",
            },
        ),
        SimpleNamespace(
            rule_code="TONE-002",
            category="TONE",
            severity="WARNING",
            title="Ban on Slang & Financial Colloquialisms",
            description="The use of internet slang, hype terminology ('super dope yields', 'moon shot', 'HODL') is prohibited.",
            suggested_replacement="Competitive interest rates on digital treasury solutions.",
            source_citation={
                "document": "ACME-GUIDELINES-2026-V1",
                "section": "SECTION 3: EDITORIAL VOICE AND TONE",
                "page": 2,
                "exact_quote": "The use of internet slang, hype terminology (\"super dope yields\", \"moon shot\", \"HODL\"), or excessive exclamation marks is prohibited across all corporate releases and landing pages.",
            },
        ),
    ]

    draft_copy = "Don't get left behind! Join our platform for high-yield returns."
    adapter = DeterministicMockAdapter()

    findings = scan_semantic_violations(draft_copy, mock_rules, llm_adapter=adapter)

    assert len(findings) == 1
    f = findings[0]
    assert f.rule_code == "TONE-001"
    assert f.flagged_text == "Don't get left behind!"
    assert f.start_offset == 0
    assert f.end_offset == 22
    assert draft_copy[f.start_offset : f.end_offset] == "Don't get left behind!"
    assert "High-pressure sales phrases" in f.source_quote
