from app.core.base_dao import BaseDAO
from app.audits.models import Audit, AuditResult

from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

class AuditDAO(BaseDAO):
    model = Audit


class AuditResultDAO(BaseDAO):
    model = AuditResult

    @classmethod
    async def bulk_insert(cls, objects: list, session: AsyncSession):

        stmt = insert(AuditResult).values(objects).returning(AuditResult)
        res = await session.execute(stmt)

        return res.scalars().all()
    