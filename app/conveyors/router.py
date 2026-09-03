from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.users.dependencies import get_current_admin, get_current_user
from app.users.models import User

from app.conveyors.dao import ConveyorDAO
from app.catalog.dao import ConveyorComponentDAO
from app.conveyors.schemas import ConveyorCreate, ConveyorRead, ConveyorDetailRead
from app.catalog.schemas import ConveyorComponentCreate, ConveyorComponentRead

router = APIRouter(prefix="/conveyors", tags=["Конвейеры"])


@router.get("/", response_model=list[ConveyorRead])
async def get_conveyors(
    session: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):

    return await ConveyorDAO.find_all(session)


@router.post("/create", response_model=ConveyorRead)
async def create_conveyor(
    data: ConveyorCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_admin),
):

    return await ConveyorDAO.create(
        session, name=data.name, description=data.description
    )


@router.get("/{conveyor_id}", response_model=ConveyorDetailRead)
async def get_conveyor(
    conveyor_id: int,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await ConveyorDAO.find_by_id(conveyor_id, session)


@router.post("/{conveyor_id}/components", response_model=ConveyorComponentRead)
async def add_component_to_conveyor(
    conveyor_id: int,
    data: ConveyorComponentCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    created = await ConveyorComponentDAO.create(
        session,
        conveyor_id=conveyor_id,
        component_id=data.component_id,
    )
    return await ConveyorComponentDAO.find_by_id(created.id, session)
