from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.catalog.dao import ComponentDAO, ConveyorComponentDAO, CriteriaDAO
from app.catalog.schemas import ComponentCreate, ComponentRead, CriteriaCreate, CriteriaRead


router = APIRouter(prefix="/catalog", tags=["Каталог деталей"])


@router.get("/components", response_model=list[ComponentRead])
async def get_components(session: AsyncSession = Depends(get_db)):
    return await ComponentDAO.find_all(session)


@router.post("/components/create", response_model=ComponentRead)
async def create_component(data: ComponentCreate, session: AsyncSession = Depends(get_db)):
    return await ComponentDAO.create(session, name=data.name)


@router.get("/criteria", response_model=list[CriteriaRead])
async def get_criteria(session: AsyncSession = Depends(get_db)):
    return await CriteriaDAO.find_all(session)


@router.post("/criteria/create", response_model=CriteriaRead)
async def create_criteria(data: CriteriaCreate, session: AsyncSession = Depends(get_db)):
    return await CriteriaDAO.create(
        session,
        name=data.name,
        conveyor_component_id=data.conveyor_component_id,
    )