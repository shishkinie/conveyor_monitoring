from fastapi import APIRouter, Depends
from app.conveyors.dao import ConveyorDAO

from app.conveyors.schemas import ConveyorCreate, ConveyorRead

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter(prefix="/conveyors", tags=["Конвееры"])


@router.get("/", response_model=list[ConveyorRead])
async def get_all_conveyors(session: AsyncSession = Depends(get_db)):
    conveyors = await ConveyorDAO.find_all(session)
    return conveyors
    


@router.post("/create")
async def create_conveyor(conveyor_in: ConveyorCreate, session: AsyncSession = Depends(get_db)):

    conveyor = await ConveyorDAO.create(session, name=conveyor_in.name, description=conveyor_in.description)
    return conveyor


@router.get("/{conveyor_id}", response_model=ConveyorRead)
async def get_conveyor(conveyor_id: int, session: AsyncSession = Depends(get_db)):
    conveyor = await ConveyorDAO.find_by_id(conveyor_id, session)
    return

    
