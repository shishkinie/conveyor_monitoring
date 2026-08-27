from app.core.base_dao import BaseDAO
from app.conveyors.models import Conveyor

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

class ConveyorDAO(BaseDAO):
    model = Conveyor

    @classmethod
    async def find_by_id(cls, model_id: int, session: AsyncSession) -> Conveyor | None:
        # Формируем запрос с жадной загрузкой связанной сущности
        # Вместо 'cls.model.relationship_name' укажите имя связи из вашей модели Conveyor
        query = (
            select(cls.model)
            .where(cls.model.id == model_id)
            .options(selectinload(cls.model.components)) 
        )
        
        result = await session.execute(query)
        return result.scalar_one_or_none()
