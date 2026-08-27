from typing import TYPE_CHECKING

from app.database import Base

from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship




class Conveyor(Base):
    __tablename__ = "conveyors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String)

    components: Mapped[list["Component"]] = relationship(back_populates="conveyor")


