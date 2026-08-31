from pydantic import BaseModel




class ConveyorBase(BaseModel):
    name: str
    description: str

class ConveyorCreate(ConveyorBase):
    pass

class ConveyorRead(ConveyorCreate):
    id: int

    model_config = {"from_attributes": True}
