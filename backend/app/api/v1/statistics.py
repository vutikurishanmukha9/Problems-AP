from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.problem import Problem
from app.models.taxonomy import Constituency, District, Ministry
from app.schemas.statistics import (
    ConstituencyStatItem,
    DepartmentStatItem,
    DistrictStatItem,
    StateOverviewStats,
)

router = APIRouter(prefix="/statistics", tags=["Statistics"])


@router.get("/overview", response_model=StateOverviewStats)
async def get_state_overview(db: AsyncSession = Depends(get_db)):
    """Computes high-level Andhra Pradesh state-wide grievance tracking metrics."""
    # Total count
    total = (await db.execute(select(func.count(Problem.id)))).scalar() or 0

    # Status counts
    status_query = select(Problem.status, func.count(Problem.id)).group_by(Problem.status)
    status_res = (await db.execute(status_query)).all()
    status_map = {st: count for st, count in status_res}

    resolved = status_map.get("resolved", 0) + status_map.get("closed", 0)
    action_initiated = status_map.get("action-initiated", 0)
    open_count = total - resolved

    rate = round((resolved / total * 100), 1) if total > 0 else 0.0

    # Constituencies count
    const_count = (
        await db.execute(
            select(func.count(func.distinct(Problem.constituency))).where(
                Problem.constituency.isnot(None)
            )
        )
    ).scalar() or 0

    # Departments count
    dept_count = (
        await db.execute(
            select(func.count(func.distinct(Problem.department)))
        )
    ).scalar() or 0

    # Top departments
    top_dept_query = (
        select(Problem.department, func.count(Problem.id).label("total"))
        .group_by(Problem.department)
        .order_by(func.count(Problem.id).desc())
        .limit(5)
    )
    top_depts = (await db.execute(top_dept_query)).all()

    top_dept_items = []
    for dept_name, dept_total in top_depts:
        minister_res = await db.execute(
            select(Ministry.minister).where(
                func.lower(Ministry.name) == func.lower(dept_name)
            )
        )
        minister_name = minister_res.scalars().first() or "Responsible Minister"

        res_count = (
            await db.execute(
                select(func.count(Problem.id)).where(
                    Problem.department == dept_name,
                    Problem.status.in_(["resolved", "closed"]),
                )
            )
        ).scalar() or 0

        dept_open = dept_total - res_count
        dept_rate = round((res_count / dept_total * 100), 1) if dept_total > 0 else 0.0

        top_dept_items.append(
            DepartmentStatItem(
                department=dept_name,
                minister=minister_name,
                total_problems=dept_total,
                open_problems=dept_open,
                resolved_problems=res_count,
                resolution_rate_percent=dept_rate,
            )
        )

    return StateOverviewStats(
        total_problems=total,
        open_problems=open_count,
        action_initiated_problems=action_initiated,
        resolved_problems=resolved,
        resolution_rate_percent=rate,
        constituencies_covered=175,
        ministries_mapped=57,
        districts_active=28,
        total_constituencies_affected=const_count,
        total_departments_active=dept_count,
        status_breakdown=status_map,
        top_departments_by_load=top_dept_items,
    )


@router.get("/departments", response_model=List[DepartmentStatItem])
async def get_departments_statistics(db: AsyncSession = Depends(get_db)):
    """Ranks all 57 Ministries / Portfolios by citizen problems, backlog, and resolution rate."""
    all_ministries = (await db.execute(select(Ministry).order_by(Ministry.id.asc()))).scalars().all()

    # Aggregate counts per department
    dept_totals_query = select(Problem.department, func.count(Problem.id)).group_by(Problem.department)
    dept_totals = dict((await db.execute(dept_totals_query)).all())

    dept_resolved_query = (
        select(Problem.department, func.count(Problem.id))
        .where(Problem.status.in_(["resolved", "closed"]))
        .group_by(Problem.department)
    )
    dept_resolved = dict((await db.execute(dept_resolved_query)).all())

    items = []
    for ministry in all_ministries:
        total = dept_totals.get(ministry.name, 0)
        resolved = dept_resolved.get(ministry.name, 0)
        open_problems = total - resolved
        rate = round((resolved / total * 100), 1) if total > 0 else 0.0

        items.append(
            DepartmentStatItem(
                department=ministry.name,
                minister=ministry.minister,
                total_problems=total,
                open_problems=open_problems,
                resolved_problems=resolved,
                resolution_rate_percent=rate,
            )
        )

    # Sort primarily by total problems descending, then alphabetically
    items.sort(key=lambda x: (-x.total_problems, x.department))
    return items


@router.get("/constituencies", response_model=List[ConstituencyStatItem])
async def get_constituencies_statistics(db: AsyncSession = Depends(get_db)):
    """Returns problem counts and backlog across all 175 assembly constituencies."""
    all_constituencies = (
        await db.execute(select(Constituency).order_by(Constituency.id.asc()))
    ).scalars().all()

    const_totals_query = select(Problem.constituency, func.count(Problem.id)).group_by(Problem.constituency)
    const_totals = dict((await db.execute(const_totals_query)).all())

    const_resolved_query = (
        select(Problem.constituency, func.count(Problem.id))
        .where(Problem.status.in_(["resolved", "closed"]))
        .group_by(Problem.constituency)
    )
    const_resolved = dict((await db.execute(const_resolved_query)).all())

    items = []
    for const in all_constituencies:
        total = const_totals.get(const.name, 0)
        resolved = const_resolved.get(const.name, 0)
        items.append(
            ConstituencyStatItem(
                constituency=const.name,
                mla=const.mla,
                total_problems=total,
                open_problems=total - resolved,
                resolved_problems=resolved,
            )
        )

    items.sort(key=lambda x: (-x.total_problems, x.constituency))
    return items


@router.get("/districts", response_model=List[DistrictStatItem])
async def get_districts_statistics(db: AsyncSession = Depends(get_db)):
    """Returns problem counts and backlog across all 28 districts."""
    all_districts = (
        await db.execute(select(District).order_by(District.id.asc()))
    ).scalars().all()

    dist_totals_query = select(Problem.district, func.count(Problem.id)).group_by(Problem.district)
    dist_totals = dict((await db.execute(dist_totals_query)).all())

    dist_resolved_query = (
        select(Problem.district, func.count(Problem.id))
        .where(Problem.status.in_(["resolved", "closed"]))
        .group_by(Problem.district)
    )
    dist_resolved = dict((await db.execute(dist_resolved_query)).all())

    items = []
    for dist in all_districts:
        total = dist_totals.get(dist.name, 0)
        resolved = dist_resolved.get(dist.name, 0)
        items.append(
            DistrictStatItem(
                district=dist.name,
                headquarters=dist.headquarters,
                total_problems=total,
                open_problems=total - resolved,
                resolved_problems=resolved,
            )
        )

    items.sort(key=lambda x: (-x.total_problems, x.district))
    return items
