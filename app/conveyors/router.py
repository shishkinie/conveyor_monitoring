from fastapi import APIRouter, Depends
from app.conveyors.dao import ConveyorDAO

from app.conveyors.schemas import ConveyorCreateSchema

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter(prefix="/conveyors", tags=["Конвееры"])


@router.post("/create")
async def create_conveyor(conveyor_in: ConveyorCreateSchema, session: AsyncSession = Depends(get_db)):

    conveyor = await ConveyorDAO.create(session, name=conveyor_in.name, description=conveyor_in.description)
    return conveyor


@router.get("/{conveyor_id}")
async def get_conveyors(conveyor_id: int, session: AsyncSession = Depends(get_db)):
    conveyor = await ConveyorDAO.find_by_id(conveyor_id, session)
    return conveyor.id, conveyor.name, conveyor.description, conveyor.components
    
