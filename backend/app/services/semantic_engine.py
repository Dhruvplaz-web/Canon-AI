"""Semantic Tone & Policy Intent Scanner Engine using LLM Provider Adapter.

Scans marketing copy for semantic tone violations, excessive pressure, financial colloquialisms,
and ungrounded claims that cannot be captured by word-boundary regexes alone.
Every candidate finding emits:
1. Exact character offsets mapped into the raw draft copy.
2. Suggested remediation text.
3. Policy source citation excerpt (for Double-Receipt verification).
"""

import json
import logging
from dataclasses import dataclass, field
from typing import Any

from app.pipeline.llm.adapter import LLMProvider, default_llm_adapter

logger = logging.getLogger("canon.semantic")


@dataclass
class SemanticFinding:
    """Standardized finding representation emitted by the semantic engine."""

    rule_code: str
    category: str
    severity: str
    title: str
    flagged_text: str
    start_offset: int
    end_offset: int
    suggested_fix: str
    source_quote: str
    source_document_title: str
    source_section: str
    reason: str
    metadata: dict[str, Any] = field(default_factory=dict)


def scan_semantic_violations(
    raw_text: str,
    rules: list[Any],
    llm_adapter: LLMProvider | None = None,
) -> list[SemanticFinding]:
    """
    Evaluates raw draft text against active brand rules requiring semantic evaluation
    (e.g., TONE, ACCESSIBILITY, or descriptive claims).
    """
    if not raw_text or not raw_text.strip() or not rules:
        return []

    adapter = llm_adapter or default_llm_adapter

    # Filter rules that require semantic evaluation (TONE, ACCESSIBILITY, or rules without static forbidden terms)
    semantic_rules = [
        r for r in rules
        if getattr(r, "category", "") in ("TONE", "ACCESSIBILITY")
        or (not getattr(r, "pattern_or_term", None) and getattr(r, "category", "") != "CLAIM")
    ]

    if not semantic_rules:
        return []

    # Map rule_code -> Rule object for easy lookup
    rule_map = {getattr(r, "rule_code", ""): r for r in semantic_rules}

    # Prepare guidelines summary for LLM context
    guidelines_context = []
    for r in semantic_rules:
        citation = getattr(r, "source_citation", {}) or {}
        quote = citation.get("exact_quote", "") if isinstance(citation, dict) else ""
        guidelines_context.append({
            "rule_code": getattr(r, "rule_code", ""),
            "title": getattr(r, "title", ""),
            "description": getattr(r, "description", ""),
            "guideline_quote": quote or getattr(r, "description", ""),
            "suggested_fix": getattr(r, "suggested_replacement", ""),
        })

    system_prompt = (
        "You are Canon Brand Governance Semantic Verification Engine. "
        "Analyze the provided draft copy against the active brand rules. "
        "For any violation found, identify the exact verbatim text span from the draft copy. "
        "Return ONLY a JSON object with a key 'findings' containing an array of objects with keys: "
        "'rule_code', 'matched_text', 'reason', and 'suggested_fix'. "
        "If no violations exist, return {\"findings\": []}."
    )

    prompt = (
        f"Active Brand Rules:\n{json.dumps(guidelines_context, indent=2)}\n\n"
        f"Draft Copy to Evaluate:\n\"\"\"{raw_text}\"\"\"\n\n"
        "Analyze for semantic violations and return JSON."
    )

    try:
        response = adapter.generate(prompt=prompt, system_prompt=system_prompt)
        payload = response.parsed_json or {}
        raw_findings = payload.get("findings", [])
        if not isinstance(raw_findings, list):
            return []

        results: list[SemanticFinding] = []
        for rf in raw_findings:
            if not isinstance(rf, dict):
                continue
            rule_code = rf.get("rule_code")
            matched_text = rf.get("matched_text") or rf.get("flagged_span")
            if not rule_code or not matched_text or not isinstance(matched_text, str):
                continue

            rule = rule_map.get(rule_code)
            if not rule:
                continue

            # Locate exact substring span in raw_text (case-sensitive first, then case-insensitive)
            start_idx = raw_text.find(matched_text)
            if start_idx == -1:
                start_idx = raw_text.lower().find(matched_text.lower())
                if start_idx != -1:
                    matched_text = raw_text[start_idx : start_idx + len(matched_text)]
                else:
                    # Dropped: not found in draft text (Receipt A violated)
                    continue

            end_idx = start_idx + len(matched_text)

            citation = getattr(rule, "source_citation", {}) or {}
            quote = (
                citation.get("exact_quote", "")
                if isinstance(citation, dict)
                else ""
            ) or getattr(rule, "description", "") or getattr(rule, "title", "")

            doc_title = (
                citation.get("document", "Brand Guidelines 2026")
                if isinstance(citation, dict)
                else "Brand Guidelines 2026"
            )
            section = (
                citation.get("section", "EDITORIAL VOICE & TONE")
                if isinstance(citation, dict)
                else "EDITORIAL VOICE & TONE"
            )

            results.append(
                SemanticFinding(
                    rule_code=rule_code,
                    category=getattr(rule, "category", "TONE"),
                    severity=getattr(rule, "severity", "WARNING"),
                    title=getattr(rule, "title", "Brand Voice Violation"),
                    flagged_text=matched_text,
                    start_offset=start_idx,
                    end_offset=end_idx,
                    suggested_fix=rf.get("suggested_fix") or getattr(rule, "suggested_replacement", ""),
                    source_quote=quote,
                    source_document_title=doc_title,
                    source_section=section,
                    reason=rf.get("reason", "Semantic tone violation"),
                )
            )

        return results

    except Exception as e:  # noqa: BLE001
        logger.warning("Semantic scanning encountered an issue: %s", e)
        return []
