from typing import Dict, List
from pydantic import BaseModel


class DepartmentStatItem(BaseModel):
    department: str
    minister: str
    total_problems: int
    open_problems: int
    resolved_problems: int
    resolution_rate_percent: float


class ConstituencyStatItem(BaseModel):
    constituency: str
    mla: str
    total_problems: int
    open_problems: int
    resolved_problems: int


class DistrictStatItem(BaseModel):
    district: str
    headquarters: str
    total_problems: int
    open_problems: int
    resolved_problems: int


class StateOverviewStats(BaseModel):
    total_problems: int
    open_problems: int
    action_initiated_problems: int
    resolved_problems: int
    resolution_rate_percent: float
    total_constituencies_affected: int
    total_departments_active: int
    status_breakdown: Dict[str, int]
    top_departments_by_load: List[DepartmentStatItem]
