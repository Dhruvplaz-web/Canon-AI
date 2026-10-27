"""API endpoints for AI Copilot Auto-Rewrite, Universal Policy Ingester, and Adversarial Showdown."""

from typing import Any

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.services.copilot_service import (
    extract_guidelines_from_text,
    generate_copilot_rewrite,
    run_adversarial_showdown,
)

router = APIRouter(prefix="/copilot", tags=["AI Copilot & Intelligence"])


class CopilotRewriteRequest(BaseModel):
    content: str = Field(..., description="Original draft copy with flagged violations")
    findings: list[dict[str, Any]] = Field(default=[], description="List of flagged findings to eliminate")
    brand_tone: str = Field(default="high-conversion, professional and compliant", description="Desired brand tone")


class CopilotRewriteResponse(BaseModel):
    original_content: str
    rewritten_content: str
    changes_summary: list[str]
    tone_preserved: str
    compliance_score: int = 100


class GuidelineExtractRequest(BaseModel):
    document_title: str = Field(default="Custom Brand Guidelines", description="Title of the policy")
    content: str = Field(..., description="Raw text of the guidelines or compliance manual")


class GuidelineExtractResponse(BaseModel):
    document_title: str
    total_rules_extracted: int
    rules: list[dict[str, Any]]


class ShowdownRequest(BaseModel):
    test_case_id: str = Field(default="CASE-INJECT-01", description="Adversarial fixture identifier")
    custom_content: str | None = Field(default=None, description="Optional custom copy to benchmark")


@router.post("/rewrite", response_model=CopilotRewriteResponse)
def copilot_rewrite_endpoint(payload: CopilotRewriteRequest):
    """
    Intelligently rewrite marketing copy using Canon AI Copilot to eliminate
    all active violations while preserving conversion power and voice.
    """
    result = generate_copilot_rewrite(
        raw_text=payload.content,
        findings=payload.findings,
        brand_tone=payload.brand_tone,
    )
    return CopilotRewriteResponse(**result)


@router.post("/extract-guidelines", response_model=GuidelineExtractResponse)
def extract_guidelines_endpoint(payload: GuidelineExtractRequest):
    """
    Autonomously parse and ingest custom brand guidelines into executable AST rules.
    """
    rules = extract_guidelines_from_text(
        raw_text=payload.content,
        document_title=payload.document_title,
    )
    return GuidelineExtractResponse(
        document_title=payload.document_title,
        total_rules_extracted=len(rules),
        rules=rules,
    )


@router.get("/showdown")
def get_adversarial_showdown(
    test_case_id: str = Query(default="CASE-INJECT-01", description="Adversarial benchmark ID"),
):
    """
    Get side-by-side benchmark comparison proving Raw LLM vs Canon Deterministic Governance.
    """
    return run_adversarial_showdown(test_case_id=test_case_id)


@router.post("/showdown")
def post_adversarial_showdown(payload: ShowdownRequest):
    """
    Execute side-by-side benchmark comparison with optional custom input copy.
    """
    return run_adversarial_showdown(
        test_case_id=payload.test_case_id,
        custom_content=payload.custom_content,
    )
