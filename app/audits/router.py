from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.audits.dao import AuditDAO, AuditResultDAO
from app.audits.schemas import AuditCreate, AuditRead, AuditResultCreate, AuditResultRead


router = APIRouter(prefix="/audits", tags=["Аудиты"])


@router.get("/", response_model=list[AuditRead])
async def get_audits(session: AsyncSession = Depends(get_db)):
    return await AuditDAO.find_all(session)


@router.post("/create", response_model=AuditRead)
async def create_audit(data: AuditCreate, session: AsyncSession = Depends(get_db)):
    return await AuditDAO.create(session, user_id=data.user_id)


@router.get("/results", response_model=list[AuditResultRead])
async def get_audit_results(session: AsyncSession = Depends(get_db)):
    return await AuditResultDAO.find_all(session)


@router.post("/results/create", response_model=AuditResultRead)
async def create_audit_result(data: AuditResultCreate, session: AsyncSession = Depends(get_db)):
    return await AuditResultDAO.create(
        session,
        audit_id=data.audit_id,
        criteria_id=data.criteria_id,
        status=data.status,
    )