from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditCreate(BaseModel):
    user_id: int


class AuditRead(BaseModel):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditResultCreate(BaseModel):
    audit_id: int
    criteria_id: int
    status: bool


class AuditResultRead(BaseModel):
    id: int
    audit_id: int
    criteria_id: int
    status: bool

    model_config = ConfigDict(from_attributes=True)