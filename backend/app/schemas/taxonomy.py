from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ConstituencyOut(BaseModel):
    id: int
    name: str
    mla: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MinistryOut(BaseModel):
    id: int
    name: str
    minister: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DistrictOut(BaseModel):
    id: int
    name: str
    headquarters: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CategoryOut(BaseModel):
    id: str
    label: str
    department: str
