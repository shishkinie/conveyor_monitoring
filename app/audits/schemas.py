from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditRead(BaseModel):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditResultCreate(BaseModel):
    criteria_id: int
    status: bool
    comment: str|None = None


class AuditResultRead(BaseModel):
    id: int
    audit_id: int
    criteria_id: int
    status: bool
    comment: str|None = None

    model_config = ConfigDict(from_attributes=True)


class AuditSubmitRead(BaseModel):
    audit: AuditRead
    results: list[AuditResultRead]