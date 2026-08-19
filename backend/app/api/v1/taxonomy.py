from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.taxonomy import Constituency, Ministry, District
from app.schemas.taxonomy import ConstituencyOut, MinistryOut, DistrictOut, CategoryOut

router = APIRouter(prefix="/taxonomy", tags=["Taxonomy"])

CATEGORIES_DATA = [
    {"id": "roads", "label": "Roads", "department": "Roads & Buildings"},
    {"id": "water", "label": "Drinking Water", "department": "Rural Development & Rural Water Supply"},
    {"id": "drainage", "label": "Drainage", "department": "Municipal Administration & Urban Development"},
    {"id": "garbage", "label": "Garbage & Cleanliness", "department": "Municipal Administration & Urban Development"},
    {"id": "electricity", "label": "Electricity", "department": "Energy"},
    {"id": "street-lights", "label": "Street Lights", "department": "Municipal Administration & Urban Development"},
    {"id": "transport", "label": "Public Transport", "department": "Roads & Buildings"},
    {"id": "health", "label": "Health", "department": "Health"},
    {"id": "gov-services", "label": "Government Services", "department": "Sachivalayam & Village Volunteer"},
    {"id": "land", "label": "Land & Revenue", "department": "Revenue"},
    {"id": "education", "label": "Education", "department": "Human Resources Development"},
    {"id": "environment", "label": "Environment", "department": "Environment"},
    {"id": "other", "label": "Other", "department": "General Administration"},
]


@router.get("/constituencies", response_model=List[ConstituencyOut])
async def get_all_constituencies(db: AsyncSession = Depends(get_db)):
    """Returns all 175 Assembly Constituencies with elected MLA names."""
    result = await db.execute(select(Constituency).order_by(Constituency.id.asc()))
    return result.scalars().all()


@router.get("/ministries", response_model=List[MinistryOut])
async def get_all_ministries(db: AsyncSession = Depends(get_db)):
    """Returns all 57 Ministries / Portfolios with Responsible Ministers."""
    result = await db.execute(select(Ministry).order_by(Ministry.id.asc()))
    return result.scalars().all()


@router.get("/districts", response_model=List[DistrictOut])
async def get_all_districts(db: AsyncSession = Depends(get_db)):
    """Returns all 28 Districts with official Headquarters."""
    result = await db.execute(select(District).order_by(District.id.asc()))
    return result.scalars().all()


@router.get("/categories", response_model=List[CategoryOut])
async def get_all_categories():
    """Returns citizen grievance reporting categories mapped to responsible departments."""
    return CATEGORIES_DATA
