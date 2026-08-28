import math
import random
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import desc, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import sanitize_input
from app.models.problem import Problem, ProblemEvidence, ProblemTimeline
from app.models.taxonomy import Constituency, District
from app.schemas.problem import (
    EvidenceUploadResponse,
    ProblemCreate,
    ProblemListResponse,
    ProblemOut,
    ProblemSignalResponse,
    ReportSubmissionResponse,
)
from app.services.cloudinary_service import upload_image_to_cloudinary

router = APIRouter(prefix="/problems", tags=["Problems"])

CATEGORY_TO_DEPT = {
    "roads": "Roads & Buildings",
    "water": "Rural Development & Rural Water Supply",
    "drainage": "Municipal Administration & Urban Development",
    "garbage": "Municipal Administration & Urban Development",
    "electricity": "Energy",
    "street-lights": "Municipal Administration & Urban Development",
    "transport": "Roads & Buildings",
    "health": "Health",
    "gov-services": "Sachivalayam & Village Volunteer",
    "land": "Revenue",
    "education": "Human Resources Development",
    "environment": "Environment",
    "other": "General Administration",
}

DISTRICT_COORDS = {
    "alluri sitharama raju": (18.0833, 82.6667),
    "anakapalli": (17.6913, 83.0039),
    "ananthapuramu": (14.6819, 77.6006),
    "annamayya": (14.0560, 78.7521),
    "bapatla": (15.9056, 80.4674),
    "chittoor": (13.2172, 79.1003),
    "dr. b. r. ambedkar konaseema": (16.5787, 82.0061),
    "east godavari": (17.0005, 81.8040),
    "eluru": (16.7107, 81.0952),
    "guntur": (16.3067, 80.4365),
    "kakinada": (16.9891, 82.2475),
    "krishna": (16.1875, 81.1389),
    "kurnool": (15.8281, 78.0373),
    "markapuram": (15.7350, 79.2700),
    "nandyal": (15.4881, 78.4836),
    "ntr": (16.5062, 80.6480),
    "palnadu": (16.2359, 80.0494),
    "parvathipuram manyam": (18.7797, 83.4287),
    "polavaram": (17.4475, 81.7767),
    "prakasam": (15.5057, 80.0499),
    "sri potti sriramulu nellore": (14.4426, 79.9865),
    "sri sathya sai": (14.1652, 77.8105),
    "srikakulam": (18.2969, 83.8968),
    "tirupati": (13.6288, 79.4192),
    "visakhapatnam": (17.6868, 83.2185),
    "vizianagaram": (18.1124, 83.3956),
    "west godavari": (16.5449, 81.5212),
    "y.s.r. kadapa": (14.4673, 78.8242),
}


async def _enrich_problem(problem: Problem, db: AsyncSession) -> ProblemOut:
    """Enriches problem with elected MLA name and District Headquarters from taxonomy tables."""
    mla_name = None
    if problem.constituency:
        stmt = select(Constituency.mla).where(
            func.lower(Constituency.name) == problem.constituency.strip().lower()
        )
        mla_name = (await db.execute(stmt)).scalar()

    dist_hq = None
    if problem.district:
        stmt = select(District.headquarters).where(
            func.lower(District.name) == problem.district.strip().lower()
        )
        dist_hq = (await db.execute(stmt)).scalar()

    return ProblemOut(
        id=problem.id,
        title=problem.title,
        description=problem.description,
        category=problem.category,
        department=problem.department,
        constituency=problem.constituency,
        mla=mla_name,
        district=problem.district,
        district_hq=dist_hq,
        area=problem.area,
        latitude=problem.latitude,
        longitude=problem.longitude,
        status=problem.status,
        upvotes_count=problem.upvotes_count,
        reported_at=problem.reported_at,
        updated_at=problem.updated_at,
        timeline=[
            {
                "id": t.id,
                "status": t.status,
                "title": t.title,
                "detail": t.detail,
                "timestamp": t.timestamp,
            }
            for t in problem.timeline
        ],
        evidence=[
            {
                "id": e.id,
                "image_url": e.image_url,
                "created_at": e.created_at,
            }
            for e in problem.evidence
        ],
    )


@router.get("", response_model=ProblemListResponse)
async def list_problems(
    category: Optional[str] = Query(None, description="Filter by category"),
    department: Optional[str] = Query(None, description="Filter by department"),
    constituency: Optional[str] = Query(None, description="Filter by assembly constituency"),
    district: Optional[str] = Query(None, description="Filter by district"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    q: Optional[str] = Query(None, description="Search keyword across title, description, and area"),
    sort: str = Query("recent", description="Sort by: recent, most-reported"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(12, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """List and search citizen problems with robust multi-criteria filtering."""
    query = select(Problem).options(
        selectinload(Problem.timeline),
        selectinload(Problem.evidence),
    )

    if category and category.lower() != "all":
        query = query.where(func.lower(Problem.category) == category.lower())

    if department and department.lower() != "all":
        query = query.where(func.lower(Problem.department) == department.lower())

    if constituency and constituency.lower() != "all":
        query = query.where(func.lower(Problem.constituency) == constituency.lower())

    if district and district.lower() != "all":
        query = query.where(func.lower(Problem.district) == district.lower())

    if status_filter and status_filter.lower() != "all":
        query = query.where(func.lower(Problem.status) == status_filter.lower())

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(Problem.title).like(term),
                func.lower(Problem.description).like(term),
                func.lower(Problem.area).like(term),
                func.lower(Problem.id).like(term),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_count = (await db.execute(count_query)).scalar() or 0

    # Sorting
    if sort == "most-reported":
        query = query.order_by(desc(Problem.upvotes_count), desc(Problem.reported_at))
    else:
        query = query.order_by(desc(Problem.reported_at))

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    problems = result.scalars().all()

    items = [await _enrich_problem(p, db) for p in problems]
    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 1

    return ProblemListResponse(
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=items,
    )


@router.post("/upload-evidence", response_model=EvidenceUploadResponse)
async def upload_evidence(
    file: UploadFile = File(...),
):
    """Uploads citizen evidence photo directly to Cloudinary and returns CDN URL."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files (JPG, PNG, WebP) are accepted for evidence.",
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Evidence photo must be smaller than 10MB.",
        )

    try:
        image_url = upload_image_to_cloudinary(content, file.filename or "evidence.jpg")
        return EvidenceUploadResponse(
            success=True,
            image_url=image_url,
            message="Evidence photo uploaded successfully.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload photo to storage: {str(e)}",
        )


@router.get("/{problem_id}", response_model=ProblemOut)
async def get_problem(problem_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve detailed problem view with complete timeline and evidence."""
    query = (
        select(Problem)
        .options(
            selectinload(Problem.timeline),
            selectinload(Problem.evidence),
        )
        .where(func.lower(Problem.id) == problem_id.strip().lower())
    )
    result = await db.execute(query)
    problem = result.scalars().first()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem with ID '{problem_id}' not found.",
        )

    return await _enrich_problem(problem, db)


@router.post("", response_model=ReportSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def report_problem(payload: ProblemCreate, db: AsyncSession = Depends(get_db)):
    """Anonymous citizen problem submission (no authentication required)."""
    dept = CATEGORY_TO_DEPT.get(payload.category.lower(), "General Administration")
    
    # Generate unique ID
    random_num = random.randint(1000, 9999)
    problem_id = f"AP-2026-{random_num}"
    
    # Ensure ID uniqueness
    while (await db.execute(select(Problem).where(Problem.id == problem_id))).scalars().first():
        random_num = random.randint(1000, 9999)
        problem_id = f"AP-2026-{random_num}"

    confirmation_token = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Resolve geographic coordinates if client GPS was unavailable
    district_norm = payload.district.strip().lower()
    default_lat, default_lng = DISTRICT_COORDS.get(district_norm, (16.5, 80.6))
    final_lat = payload.latitude if payload.latitude is not None and payload.latitude > 0 else default_lat
    final_lng = payload.longitude if payload.longitude is not None and payload.longitude > 0 else default_lng

    problem = Problem(
        id=problem_id,
        title=sanitize_input(payload.title),
        description=sanitize_input(payload.description),
        category=payload.category.strip().lower(),
        department=dept,
        constituency=payload.constituency.strip() if payload.constituency else None,
        district=payload.district.strip(),
        area=sanitize_input(payload.area),
        latitude=final_lat,
        longitude=final_lng,
        status="reported",
        confirmation_token=confirmation_token,
        upvotes_count=1,
        reported_at=now,
        updated_at=now,
    )
    db.add(problem)
    await db.flush()

    timeline_entry = ProblemTimeline(
        problem_id=problem.id,
        status="reported",
        title="Grievance Registered",
        detail="Citizen problem submitted anonymously and routed to department.",
        timestamp=now,
    )
    db.add(timeline_entry)

    # Attach any evidence photos
    if payload.evidence:
        for photo_url in payload.evidence:
            if photo_url and photo_url.strip():
                db.add(
                    ProblemEvidence(
                        problem_id=problem.id,
                        image_url=photo_url.strip(),
                        created_at=now,
                    )
                )

    await db.commit()

    return ReportSubmissionResponse(
        success=True,
        problem_id=problem.id,
        confirmation_token=confirmation_token,
        status="reported",
        message="Your grievance has been successfully submitted and indexed for public tracking.",
    )


@router.post("/{problem_id}/signal", response_model=ProblemSignalResponse)
async def upvote_problem_signal(problem_id: str, db: AsyncSession = Depends(get_db)):
    """Atomic community affirmation signal ('I also face this problem') safe under concurrent clients."""
    clean_id = problem_id.strip()

    stmt = (
        update(Problem)
        .where(func.lower(Problem.id) == clean_id.lower())
        .values(
            upvotes_count=Problem.upvotes_count + 1,
            updated_at=datetime.now(timezone.utc),
        )
        .returning(Problem.id, Problem.upvotes_count)
    )
    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem with ID '{problem_id}' not found.",
        )

    await db.commit()

    return ProblemSignalResponse(
        success=True,
        problem_id=row.id,
        upvotes_count=row.upvotes_count,
        message="Your signal has been recorded. Higher citizen count increases priority.",
    )
