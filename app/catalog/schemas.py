from pydantic import BaseModel



class CriteriaBase(BaseModel):
    name: str
    component_id: int


class CriteriaRead(CriteriaBase):
    id: int


# -----------------------------------------------

class ComponentTypeCreate(BaseModel):

    name: str


class ComponentTypeRead(BaseModel):
    
    id: int
    name: str

    model_config = {"from_attributes": True}





class ComponentBase(BaseModel):
    name: str
    conveyor_id: int
    component_type_id: int


class ComponentCreate(ComponentBase):
    pass  


class ComponentRead(ComponentBase):

    id: int
    
    model_config = {"from_attributes": True}


class ComponentWithPartsRead(ComponentRead):
    parts: list[CriteriaRead] 