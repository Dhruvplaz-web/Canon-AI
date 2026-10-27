"""Reproducible Benchmark Evaluation Service.

Executes standardized verification test suites across OWASP LLM prompt injection attacks,
deterministic brand policy violations, temporal claims, and clean compliant copy.
Emits confusion matrix metrics (TP, FP, TN, FN), Precision, Recall, F1, and execution latency.
"""

import json
import logging
import time
import uuid
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models.policy import PolicyVersion
from app.pipeline.verifier import verify_candidate_finding
from app.services.claims_engine import scan_claims
from app.services.injection_scanner import scan_for_injections
from app.services.semantic_engine import scan_semantic_violations
from app.services.terms_engine import scan_terms_and_typos

logger = logging.getLogger("canon.benchmark")

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
BENCHMARK_FILE = REPO_ROOT / "data" / "benchmark_dataset.json"


def _resolve_benchmark_file() -> Path:
    candidates = [
        BENCHMARK_FILE,
        Path("data/benchmark_dataset.json"),
        Path("../data/benchmark_dataset.json"),
    ]
    for c in candidates:
        if c.exists():
            return c
    return BENCHMARK_FILE


def run_benchmark_suite(
    db: Session,
    workspace_id: uuid.UUID,
) -> dict[str, Any]:
    """
    Executes the 30-case benchmark suite against the workspace's active PolicyVersion.
    Returns empirical Confusion Matrix, F1 Score, and per-case verification traces.
    """
    benchmark_path = _resolve_benchmark_file()
    if not benchmark_path.exists():
        raise FileNotFoundError(f"Benchmark dataset not found at {benchmark_path}")

    with open(benchmark_path, encoding="utf-8") as f:
        data = json.load(f)

    policy = (
        db.query(PolicyVersion)
        .filter(
            PolicyVersion.workspace_id == workspace_id,
            PolicyVersion.status == "ACTIVE",
        )
        .first()
    )
    if not policy:
        raise ValueError(f"No active brand policy version found for workspace {workspace_id}")

    # Build grounding policy text corpus for Double-Receipt validation
    policy_source_texts: list[str] = [
        "Prohibition of prompt injection, model jailbreaking, and instruction override delimiters."
    ]
    for r in policy.rules:
        if r.description:
            policy_source_texts.append(r.description)
        if isinstance(r.source_citation, dict):
            for k in ("exact_quote", "quote", "source_quote"):
                val = r.source_citation.get(k)
                if val:
                    policy_source_texts.append(val)
    for c in policy.approved_claims:
        if c.claim_text:
            policy_source_texts.append(c.claim_text)
        if c.substantiation:
            policy_source_texts.append(c.substantiation)
            policy_source_texts.append(f"Claim: '{c.claim_text}' Substantiation: {c.substantiation}")

    cases = data.get("cases", [])
    results = []
    latencies = []

    tp = 0  # Expected violation, actual violation
    tn = 0  # Expected compliant, actual compliant
    fp = 0  # Expected compliant, actual violation
    fn = 0  # Expected violation, actual compliant

    adversarial_total = 0
    adversarial_blocked = 0

    for case in cases:
        case_id = case["id"]
        cohort = case["cohort"]
        title = case["title"]
        content = case["content"]
        expected_outcome = case["expected_outcome"]  # "VIOLATION" | "COMPLIANT"
        expected_rule_code = case.get("expected_rule_code")

        if cohort == "adversarial_security":
            adversarial_total += 1

        start_time = time.perf_counter()
        candidate_findings = []

        # Stage 1: Security Injection Scanner
        sec_res = scan_for_injections(content)
        if not sec_res.is_safe:
            for sf in sec_res.findings:
                candidate_findings.append({
                    "rule_code": sf.rule_code,
                    "category": "SECURITY",
                    "severity": "CRITICAL",
                    "title": "Adversarial Prompt Injection Attempt",
                    "matched_text": sf.matched_text,
                    "receipt_a_draft_span": sf.matched_text,
                    "receipt_b_rule_quote": "Prohibition of prompt injection, model jailbreaking, and instruction override delimiters.",
                    "source_document_title": "AI Safety & Security Policy",
                    "source_section": "SECTION 0: LLM ADVERSARIAL SAFEGUARDS",
                })

        # Stage 2: Deterministic Forbidden Terms & Typo Engine
        terms_res = scan_terms_and_typos(content, policy.rules)
        for tf in terms_res:
            citation = tf.source_citation if isinstance(tf.source_citation, dict) else {}
            candidate_findings.append({
                "rule_code": tf.rule_code,
                "category": tf.category,
                "severity": tf.severity,
                "title": tf.title,
                "matched_text": tf.flagged_text,
                "receipt_a_draft_span": tf.flagged_text,
                "receipt_b_rule_quote": tf.source_quote,
                "source_document_title": citation.get("document", "Brand Guidelines 2026"),
                "source_section": citation.get("section", "STATUTORY BRAND IDENTITY"),
            })

        # Stage 3: Approved Claims Ledger
        claims_res = scan_claims(content, policy.approved_claims)
        for cf in claims_res:
            candidate_findings.append({
                "rule_code": cf.rule_code,
                "category": cf.category,
                "severity": cf.severity,
                "title": cf.title,
                "matched_text": cf.flagged_text,
                "receipt_a_draft_span": cf.flagged_text,
                "receipt_b_rule_quote": cf.source_quote,
                "source_document_title": "Approved Claims Ledger",
                "source_section": "CLAIMS & SUBSTANTIATION LEDGER",
            })

        # Stage 4: Semantic Tone & Policy Intent Scanner
        semantic_res = scan_semantic_violations(content, policy.rules)
        for sf in semantic_res:
            candidate_findings.append({
                "rule_code": sf.rule_code,
                "category": sf.category,
                "severity": sf.severity,
                "title": sf.title,
                "matched_text": sf.flagged_text,
                "receipt_a_draft_span": sf.flagged_text,
                "receipt_b_rule_quote": sf.source_quote,
                "source_document_title": sf.source_document_title,
                "source_section": sf.source_section,
            })

        # Double-Receipt Grounding Verification
        verified_findings = []
        for cand in candidate_findings:
            ver = verify_candidate_finding(cand, content, policy_source_texts)
            if ver.is_valid:
                verified_findings.append(cand)

        # Deduplicate
        seen_codes = set()
        deduped = []
        for vf in verified_findings:
            if vf["rule_code"] not in seen_codes:
                seen_codes.add(vf["rule_code"])
                deduped.append(vf)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        latencies.append(elapsed_ms)

        actual_outcome = "VIOLATION" if len(deduped) > 0 else "COMPLIANT"
        is_correct = actual_outcome == expected_outcome

        if expected_outcome == "VIOLATION":
            if actual_outcome == "VIOLATION":
                tp += 1
                if cohort == "adversarial_security":
                    adversarial_blocked += 1
            else:
                fn += 1
        else:
            if actual_outcome == "COMPLIANT":
                tn += 1
            else:
                fp += 1

        results.append({
            "id": case_id,
            "cohort": cohort,
            "title": title,
            "content": content,
            "expected_outcome": expected_outcome,
            "expected_rule_code": expected_rule_code,
            "actual_outcome": actual_outcome,
            "detected_rule_codes": list(seen_codes),
            "findings_count": len(deduped),
            "is_correct": is_correct,
            "latency_ms": round(elapsed_ms, 2),
            "findings": deduped,
        })

    total_cases = len(cases)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
    f1_score = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 1.0
    accuracy = (tp + tn) / total_cases if total_cases > 0 else 1.0

    sorted_latencies = sorted(latencies)
    p95_idx = int(0.95 * len(sorted_latencies))
    p95_latency = sorted_latencies[min(p95_idx, len(sorted_latencies) - 1)] if sorted_latencies else 0.0
    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0

    return {
        "timestamp": time.time(),
        "policy_version": policy.version_number,
        "total_cases": total_cases,
        "metrics": {
            "true_positives": tp,
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1_score, 4),
            "accuracy": round(accuracy, 4),
            "adversarial_blocked_count": adversarial_blocked,
            "adversarial_total": adversarial_total,
            "adversarial_defense_rate": round(adversarial_blocked / adversarial_total if adversarial_total else 1.0, 4),
            "avg_latency_ms": round(avg_latency, 2),
            "p95_latency_ms": round(p95_latency, 2),
        },
        "cases": results,
    }
