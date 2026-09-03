from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.audits.dao import AuditDAO, AuditResultDAO
from app.audits.schemas import (
    AuditRead,
    AuditResultCreate,
    AuditResultRead,
    AuditSubmitRead,
)

from app.users.dependencies import get_current_user
from app.users.models import User

router = APIRouter(prefix="/audits", tags=["Аудиты"])


@router.get("/", response_model=list[AuditRead])
async def get_audits(
    session: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    return await AuditDAO.find_all(session)


@router.post("/create", response_model=AuditRead)
async def create_audit(
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await AuditDAO.create(session, user_id=user.id)


@router.get("/results", response_model=list[AuditResultRead])
async def get_audit_results(
    session: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    return await AuditResultDAO.find_all(session)



@router.post("/submit", response_model=AuditSubmitRead)
async def create_audit_with_results(
    data: list[AuditResultCreate],
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not data:
        raise HTTPException(status_code=400, detail="Нет результатов проверки")

    audit = await AuditDAO.create(session, user_id=user.id)

    audit_result_dicts = []

    for item in data:
        item_dict = item.model_dump()
        item_dict["audit_id"] = audit.id  
        audit_result_dicts.append(item_dict)

    
    results = await AuditResultDAO.bulk_insert(session=session, objects=audit_result_dicts)

    return {"audit": audit, "results": results}

    
