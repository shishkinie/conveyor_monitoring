from app.core.base_dao import BaseDAO
from app.conveyors.models import Conveyor
from app.catalog.models import ConveyorComponent

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


class ConveyorDAO(BaseDAO):
    model = Conveyor

    @classmethod
    async def find_by_id(cls, model_id: int, session: AsyncSession) -> Conveyor | None:
        query = (
            select(cls.model)
            .where(cls.model.id == model_id)
            .options(
                selectinload(cls.model.conveyor_components).selectinload(ConveyorComponent.component),
                selectinload(cls.model.conveyor_components).selectinload(ConveyorComponent.criterias),
            )
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()