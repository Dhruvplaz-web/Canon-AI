"""Pydantic schemas for content submissions and versioning."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CreateSubmissionRequest(BaseModel):
    """Payload to create a new content draft submission."""

    title: str = Field(..., min_length=1, max_length=255)
    channel: str = Field(default="web_landing_page", max_length=50)
    content: str = Field(..., min_length=1)

    model_config = ConfigDict(populate_by_name=True)


class CreateVersionRequest(BaseModel):
    """Payload to append a revised version to an existing submission."""

    content: str = Field(..., min_length=1)


class SubmissionVersionResponse(BaseModel):
    """Immutable submission version representation."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    version_number: int
    content: str
    word_count: int
    character_count: int
    created_at: datetime


class ApproveSubmissionRequest(BaseModel):
    """Payload to grant formal human approval / sign-off on a submission."""

    notes: str | None = Field(None, max_length=1000)
    approval_type: str = Field(default="FINAL_SIGNOFF", max_length=50)


class SendBackSubmissionRequest(BaseModel):
    """Payload to send back a submission for revision with required feedback notes."""

    notes: str = Field(..., min_length=5, max_length=2000, description="Mandatory revision instructions")


class ApprovalResponse(BaseModel):
    """Formal human sign-off certificate (ENT-17)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    submission_id: str
    submission_version_id: str
    approved_by: str
    approver_name: str | None = None
    approver_email: str | None = None
    decision: str
    approval_type: str
    notes: str | None = None
    signed_off_at: datetime
    created_at: datetime


class SubmissionResponse(BaseModel):
    """Marketing draft container representation."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    creator_id: str
    title: str
    channel: str
    current_version_number: int
    status: str
    created_at: datetime
    current_version: SubmissionVersionResponse | None = None
    versions: list[SubmissionVersionResponse] = []
    latest_approval: ApprovalResponse | None = None


class SubmissionListResponse(BaseModel):
    """Paginated list of submissions."""

    items: list[SubmissionResponse]
    total: int
    page: int
    page_size: int


class FindingResponse(BaseModel):
    """Double-receipt compliance finding card."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    rule_code: str
    category: str
    severity: str
    title: str
    matched_text: str
    start_offset: int
    end_offset: int
    suggested_fix: str | None = None
    receipt_a_draft_span: str
    receipt_b_rule_quote: str
    source_document_title: str
    source_section: str
    status: str


class CheckRunResponse(BaseModel):
    """Pipeline verification execution result."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    submission_id: str
    submission_version_id: str
    policy_version_id: str
    status: str
    total_findings: int
    total_overrides: int
    started_at: datetime
    completed_at: datetime | None = None
    findings: list[FindingResponse] = []

