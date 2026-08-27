from pydantic import BaseModel


class ConveyorCreateSchema(BaseModel):
    
    name: str
    description: str