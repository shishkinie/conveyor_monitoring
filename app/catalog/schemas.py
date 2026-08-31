from pydantic import BaseModel, ConfigDict


class ComponentCreate(BaseModel):
    name: str


class ComponentRead(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class CriteriaCreate(BaseModel):
    name: str
    conveyor_component_id: int


class CriteriaRead(BaseModel):
    id: int
    name: str
    conveyor_component_id: int

    model_config = ConfigDict(from_attributes=True)


class ConveyorComponentCreate(BaseModel):
    component_id: int


class ConveyorComponentRead(BaseModel):
    id: int
    conveyor_id: int
    component_id: int
    component: ComponentRead | None = None
    criterias: list[CriteriaRead] = []

    model_config = ConfigDict(from_attributes=True)