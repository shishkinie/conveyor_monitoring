from pydantic import BaseModel, EmailStr, Field
from app.enums import UserRoleEnum

class UserBaseSchema(BaseModel):

    username: EmailStr



class UserCreateSchema(UserBaseSchema):

    password: str = Field(min_length=6, max_length=50)
    role: UserRoleEnum


class UserResponseSchema(UserBaseSchema):

    id: int

    model_config = {'from_attributes': True}

class TokenSchema(BaseModel):

    access_token: str
    token_type: str = "bearer"
