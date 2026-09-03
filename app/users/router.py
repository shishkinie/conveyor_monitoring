from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import UserAlreadyExistException, IncorrectUsernameOrPassword

from app.database import get_db
from app.users.DAO import UserDAO, RoleDAO
from app.users.models import User
from app.users.auth import AuthHandler
from app.users.dependencies import get_current_user, get_current_admin
from app.users.schemas import UserCreate, UserRead, TokenSchema, MeRead


router = APIRouter(prefix="/auth", tags=["Авторизация"])


@router.post("/register", response_model=UserRead)
async def register(payload: UserCreate, session: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin)):

    role = await RoleDAO.find_one_or_none(session=session, name=payload.role)

    if not role:
        raise IncorrectUsernameOrPassword

    user = await UserDAO.find_one_or_none(session=session, username=payload.username)

    if user is not None:
        raise UserAlreadyExistException
    
    hashed_password = AuthHandler.get_password_hash(password=payload.password)

    new_user = await UserDAO.create(
        session=session, 
        username=payload.username, 
        hashed_password=hashed_password, 
        role_id=role.id
        )
    
    return new_user


@router.post("/login", response_model=TokenSchema)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_db)):
    user = await UserDAO.find_one_or_none(session=session, username=form_data.username)

    if not user: 
        raise IncorrectUsernameOrPassword
    
    is_valid = AuthHandler.verify_password(password=form_data.password, hashed_password=user.hashed_password)

    if not is_valid:
        raise IncorrectUsernameOrPassword

    token = AuthHandler.create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}



@router.get("/me", response_model=MeRead)
async def me(user: User = Depends(get_current_user)):
    
    return {"id": user.id, "username": user.username, "role": user.role.name}






