from pydantic import BaseModel, EmailStr, Field
from app.enums import UserRoleEnum

class UserBaseSchema(BaseModel):

    username: EmailStr



class MeRead(UserBaseSchema):

    id: int
    role: str
    
    model_config = {'from_attributes': True}

class UserCreate(UserBaseSchema):

    password: str = Field(min_length=6, max_length=50)
    role: UserRoleEnum


class UserRead(UserBaseSchema):

    id: int

    model_config = {'from_attributes': True}

class TokenSchema(BaseModel):

    access_token: str
    token_type: str = "bearer"
