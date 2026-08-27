from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import IncorrectUsernameOrPassword, UserAlreadyExistException
from app.catalog.schemas import ComponentResponseSchema
from app.users.auth import AuthHandler

from app.catalog.dao import ComponentDAO, ComponentTypeDAO, CriteriaDAO

from app.database import get_db


router = APIRouter(prefix="/catalog", tags=["Справочник деталей"])


@router.get("/", response_model=ComponentResponseSchema)
async def get_components(conveyor_id: int, session: AsyncSession = Depends(get_db)):
    components = await ComponentDAO.find_all(session, lazy=False)
    return components


@router.post("/create_type")
async def crae(conveyor_id: int, session: AsyncSession = Depends(get_db)):
    conveyor = await ConveyorDAO.find_by_id(conveyor_id, session)
    return conveyor.id, conveyor.name, conveyor.description, conveyor.components


@router.post("/create_component")
async def get_conveyors(conveyor_id: int, session: AsyncSession = Depends(get_db)):
    conveyor = await ConveyorDAO.find_by_id(conveyor_id, session)
    return conveyor.id, conveyor.name, conveyor.description, conveyor.components