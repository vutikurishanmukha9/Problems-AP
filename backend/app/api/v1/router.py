from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.taxonomy import router as taxonomy_router
from app.api.v1.problems import router as problems_router
from app.api.v1.statistics import router as statistics_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(taxonomy_router)
api_router.include_router(problems_router)
api_router.include_router(statistics_router)
