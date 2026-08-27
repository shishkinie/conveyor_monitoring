
from typing import TYPE_CHECKING

from app.database import Base

from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship




# ТИП КОМПОНЕНТА
class ComponentType(Base):
    __tablename__ = "component_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    components: Mapped[list["Component"]] = relationship(back_populates="component_type")


# КОМПОНЕНТ (конкретная деталь на конкретной ленте)
class Component(Base):
    __tablename__ = "components"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    conveyor_id: Mapped[int] = mapped_column(ForeignKey("conveyors.id"))
    component_type_id: Mapped[int] = mapped_column(ForeignKey("component_types.id"))

    conveyor: Mapped["Conveyor"] = relationship(back_populates="components")
    component_type: Mapped["ComponentType"] = relationship(back_populates="components")
    criterias: Mapped[list["Criteria"]] = relationship(back_populates="component")


# КРИТЕРИЙ (подкомпонент конкретной детали)
class Criteria(Base):
    __tablename__ = "criterias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    component_id: Mapped[int] = mapped_column(ForeignKey("components.id"))

    component: Mapped["Component"] = relationship(back_populates="criterias")
