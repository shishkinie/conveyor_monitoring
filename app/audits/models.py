from app.database import Base

from datetime import datetime
from sqlalchemy import Integer, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Audit(Base):
    __tablename__ = "audits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    





class AuditResult(Base):
    __tablename__ = "audit_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    audit_id: Mapped[int] = mapped_column(ForeignKey("audits.id"))
    component_id: Mapped[int] = mapped_column(ForeignKey("components.id"))
    criteria_id: Mapped[int] = mapped_column(ForeignKey("criterias.id"))
    status: Mapped[bool] = mapped_column(Boolean, nullable=False)

    
    component: Mapped["Component"] = relationship()
    criteria: Mapped["Criteria"] = relationship()