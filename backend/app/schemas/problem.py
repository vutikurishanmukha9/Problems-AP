from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ProblemTimelineOut(BaseModel):
    id: int
    status: str
    title: str
    detail: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class ProblemEvidenceOut(BaseModel):
    id: int
    image_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProblemCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200, description="Concise headline describing the public problem")
    description: str = Field(..., min_length=15, max_length=2000, description="Detailed explanation of the issue")
    category: str = Field(..., description="Problem category ID e.g. roads, water, electricity")
    constituency: Optional[str] = Field(None, description="One of the 175 AP assembly constituencies")
    district: str = Field(..., description="One of the 28 AP districts")
    area: str = Field(..., min_length=2, max_length=200, description="Specific street, village, or landmark")
    latitude: Optional[float] = Field(None, ge=12.0, le=20.0, description="Optional AP GPS latitude")
    longitude: Optional[float] = Field(None, ge=76.0, le=85.0, description="Optional AP GPS longitude")
    evidence: Optional[List[str]] = Field(default_factory=list, description="List of Cloudinary evidence photo URLs")


class ProblemOut(BaseModel):
    id: str
    title: str
    description: str
    category: str
    department: str
    constituency: Optional[str] = None
    mla: Optional[str] = None
    district: str
    district_hq: Optional[str] = None
    area: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    upvotes_count: int
    reported_at: datetime
    updated_at: datetime
    timeline: List[ProblemTimelineOut] = []
    evidence: List[ProblemEvidenceOut] = []

    model_config = ConfigDict(from_attributes=True)


class ProblemListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[ProblemOut]


class ReportSubmissionResponse(BaseModel):
    success: bool
    problem_id: str
    confirmation_token: str
    status: str
    message: str


class ProblemSignalResponse(BaseModel):
    success: bool
    problem_id: str
    upvotes_count: int
    message: str


class EvidenceUploadResponse(BaseModel):
    success: bool
    image_url: str
    message: str
