from typing import TYPE_CHECKING

from app.database import Base

from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.conveyors.models import Conveyor


# ДЕТАЛЬ ИЗ КАТАЛОГА (справочник возможных деталей)
class Component(Base):
    __tablename__ = "components"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    conveyor_components: Mapped[list["ConveyorComponent"]] = relationship(back_populates="component")


# ДЕТАЛЬ НА КОНКРЕТНОМ КОНВЕЙЕРЕ (связь: конвейер + деталь из каталога)
class ConveyorComponent(Base):
    __tablename__ = "conveyor_components"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    conveyor_id: Mapped[int] = mapped_column(ForeignKey("conveyors.id"))
    component_id: Mapped[int] = mapped_column(ForeignKey("components.id"))

    conveyor: Mapped["Conveyor"] = relationship(back_populates="conveyor_components")
    component: Mapped["Component"] = relationship(back_populates="conveyor_components")
    criterias: Mapped[list["Criteria"]] = relationship(back_populates="conveyor_component")


# ПОДКОМПОНЕНТ (критерий) конкретной детали на конвейере
class Criteria(Base):
    __tablename__ = "criterias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    conveyor_component_id: Mapped[int] = mapped_column(ForeignKey("conveyor_components.id"))

    conveyor_component: Mapped["ConveyorComponent"] = relationship(back_populates="criterias")