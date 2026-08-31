from app.core.base_dao import BaseDAO
from app.catalog.models import Component, ConveyorComponent, Criteria

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


class ComponentDAO(BaseDAO):
    model = Component


class ConveyorComponentDAO(BaseDAO):
    model = ConveyorComponent

    @classmethod
    async def find_all(cls, session: AsyncSession) -> list[ConveyorComponent]:
        query = (
            select(cls.model)
            .options(
                selectinload(cls.model.component),
                selectinload(cls.model.criterias),
            )
        )
        result = await session.execute(query)
        return list(result.scalars().all())

    @classmethod
    async def find_by_id(cls, model_id: int, session: AsyncSession) -> ConveyorComponent | None:
        query = (
            select(cls.model)
            .where(cls.model.id == model_id)
            .options(
                selectinload(cls.model.component),
                selectinload(cls.model.criterias),
            )
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()


class CriteriaDAO(BaseDAO):
    model = Criteria