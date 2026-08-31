from pydantic import BaseModel, ConfigDict

from app.catalog.schemas import ConveyorComponentRead


class ConveyorCreate(BaseModel):
    name: str
    description: str


class ConveyorRead(BaseModel):
    id: int
    name: str
    description: str

    model_config = ConfigDict(from_attributes=True)


class ConveyorDetailRead(ConveyorRead):
    conveyor_components: list[ConveyorComponentRead] = []