from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import IncorrectUsernameOrPassword, UserAlreadyExistException
from app.catalog.schemas import ComponentTypeRead, ComponentTypeCreate, ComponentCreate
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



# @router.get("/components", response_model=ComponentResponseSchema)
# async def get_components(conveyor_id: int, session: AsyncSession = Depends(get_db)):
#     components = await ComponentDAO.find_all(session, lazy=False)
#     return components



# @router.post("/delete_type")
# async def delete_type(conveyor_id: int, session: AsyncSession = Depends(get_db)):
#     conveyor = await ConveyorDAO.find_by_id(conveyor_id, session)
#     return conveyor.id, conveyor.name, conveyor.description, conveyor.components


# @router.post("/create_component")
# async def get_conveyors(conveyor_id: int, session: AsyncSession = Depends(get_db)):
#     conveyor = await ConveyorDAO.find_by_id(conveyor_id, session)
#     return conveyor.id, conveyor.name, conveyor.description, conveyor.components