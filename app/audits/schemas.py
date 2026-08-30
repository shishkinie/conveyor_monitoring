from datetime import datetime
from pydantic import BaseModel


class AuditBase(BaseModel):
    user_id: int

class AuditCreate(AuditBase):
    pass

class AuditRead(AuditBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}



class AuditResultBase(BaseModel):

    audit_id: int
    component_id: int
    criteria_id: int
    status: bool


class AuditResultCreate(AuditResultBase):
    pass

class AuditResultRead(AuditResultBase):

    id: int

    model_config = {"from_attributes": True}

    
#     component: Mapped["Component"] = relationship()
#     criteria: Mapped["Criteria"] = relationship()