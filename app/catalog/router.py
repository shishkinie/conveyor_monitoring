from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import IncorrectUsernameOrPassword, UserAlreadyExistException
from app.catalog.schemas import ComponentTypeRead, ComponentTypeCreate, ComponentCreate, ComponentRead
from app.users.auth import AuthHandler

from app.catalog.dao import ComponentDAO, ComponentTypeDAO, CriteriaDAO

from app.database import get_db


router = APIRouter(prefix="/catalog", tags=["Справочник деталей"])


@router.get("/types", response_model=list[ComponentTypeRead])
async def get_component_types(session: AsyncSession = Depends(get_db)):
    types = await ComponentTypeDAO.find_all(session)
    return types

@router.post("/types/create", response_model=ComponentTypeRead)
async def create_component_type(data: ComponentTypeCreate, session: AsyncSession = Depends(get_db)):
    types = await ComponentTypeDAO.create(session, name=data.name)
    return types


@router.delete("/types/delete", response_model=ComponentTypeRead)
async def delete_component_type(id: int, session: AsyncSession = Depends(get_db)):
    result = await ComponentTypeDAO.delete(session, id)
    return result


@router.post("/components/create", response_model=ComponentRead)
async def create_component(component: ComponentCreate, session: AsyncSession = Depends(get_db)):
    component = await ComponentDAO.create(
        session, 
        name=component.name, 
        conveyor_id=component.conveyor_id,
        component_type_id=component.component_type_id
    )

    return component

@router.delete("/components/delete", response_model=ComponentRead)
async def delete_component(component_id: int, session: AsyncSession = Depends(get_db)):
    result = await ComponentDAO.delete(session, component_id)
    return result
