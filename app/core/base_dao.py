from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

class BaseDAO:

    model = None

    @classmethod
    async def find_all(cls, session: AsyncSession) -> list[cls.model] | None:
  
        query = select(cls.model)
        result = await session.execute(query)
        return result.scalars().all()

    @classmethod
    async def find_one_or_none(cls, session: AsyncSession, **filter_by) -> cls.model | None:
        query = select(cls.model).filter_by(**filter_by)
        result = await session.execute(query)
        return result.scalar_one_or_none()

    @classmethod
    async def find_by_id(cls, model_id: int, session: AsyncSession) -> cls.model | None:
        query = select(cls.model).where(cls.model.id == model_id)
        result = await session.execute(query)
        return result.scalar_one_or_none()

    @classmethod
    async def create(cls, session: AsyncSession, **data) -> cls.model:
        model = cls.model(**data)

        session.add(model)
        await session.commit()
        await session.refresh(model)
        return model
      