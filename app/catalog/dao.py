from app.core.base_dao import BaseDAO
from app.catalog.models import Component, ComponentType, Criteria

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload


class ComponentTypeDAO(BaseDAO):
    model = ComponentType


class ComponentDAO(BaseDAO):
    model = Component

    @classmethod
    async def find_all(cls, session: AsyncSession, lazy: bool = True) -> list[cls.model] | None:
        if lazy: 
            query = select(cls.model).options(selectinload(cls.model.criterias))
            result = await session.execute(query)
            return result.scalars().all()

        else:
            query = select(cls.model)
            result = await session.execute(query)
            return result.scalars().all()

    @classmethod
    async def find_by_id(cls, id: int, session: AsyncSession, lazy: bool = True) -> list[cls.model] | None:
        if lazy: 
            query = select(cls.model).where(cls.model.id == id).options(selectinload(cls.model.criterias))
            result = await session.execute(query)
            return result.scalar_one_or_none()

        else:
            query = select(cls.model).where(cls.model.id == id)
            result = await session.execute(query)
            return result.scalar_one_or_none()
    
       


    
class CriteriaDAO(BaseDAO):
    model = Criteria




