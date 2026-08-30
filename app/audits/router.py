from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.auth import AuthHandler

from app.audits.dao import AuditDAO, AuditResultDAO
from app.audits.schemas import AuditCreate, AuditRead, AuditResultCreate, AuditResultRead

from app.database import get_db


router = APIRouter(prefix="/audits", tags=["Аудиты"])


@router.get("/", response_model=list[AuditRead])
async def get_audits(session: AsyncSession = Depends(get_db)):
    types = await AuditDAO.find_all(session)
    return types

@router.post("/create", response_model=AuditRead)
async def create_audit(audit: AuditCreate, session: AsyncSession = Depends(get_db)):
    audit = await AuditDAO.create(session, user_id=audit.user_id)
    return audit



@router.get("/results", response_model=list[AuditResultRead])
async def get_audit_results(session: AsyncSession = Depends(get_db)):
    results = await AuditResultDAO.find_all(session)
    return results


@router.post("/results/create", response_model=AuditResultRead)
async def create_audit_result(audit_result: AuditResultCreate, session: AsyncSession = Depends(get_db)):
    audit_result = await AuditResultDAO.create(
        session, 
        audit_id=audit_result.audit_id,
        component_id=audit_result.component_id,
        criteria_id=audit_result.criteria_id,
        status=audit_result.status
        )
    return audit_result



# @router.delete("/types/delete", response_model=ComponentTypeRead)
# async def delete_component_type(id: int, session: AsyncSession = Depends(get_db)):
#     result = await ComponentTypeDAO.delete(session, id)
#     return result


# @router.post("/components/create", response_model=ComponentRead)
# async def create_component(component: ComponentCreate, session: AsyncSession = Depends(get_db)):
#     component = await ComponentDAO.create(
#         session, 
#         name=component.name, 
#         conveyor_id=component.conveyor_id,
#         component_type_id=component.component_type_id
#     )

#     return component

# @router.delete("/components/delete", response_model=ComponentRead)
# async def delete_component(component_id: int, session: AsyncSession = Depends(get_db)):
#     result = await ComponentDAO.delete(session, component_id)
#     return result


