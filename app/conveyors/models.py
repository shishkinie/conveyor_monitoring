from typing import TYPE_CHECKING

from app.database import Base

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.catalog.models import ConveyorComponent


class Conveyor(Base):
    __tablename__ = "conveyors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)

    conveyor_components: Mapped[list["ConveyorComponent"]] = relationship(back_populates="conveyor")