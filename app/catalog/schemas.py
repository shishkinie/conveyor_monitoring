from pydantic import BaseModel
from app.catalog.models import Criteria

class ComponentResponseSchema(BaseModel):
    id: int
    name: 
    conveyor_id: 
    component_type_id: 

    conveyor: 
    component_type: 
    criterias: 

    model_config = {"from_attributes": True}

class ComponentWithParts(ComponentBase):
    parts: list[Criteria] 