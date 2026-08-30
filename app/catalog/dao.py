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
       


    
class CriteriaDAO(BaseDAO):
    model = Criteria




