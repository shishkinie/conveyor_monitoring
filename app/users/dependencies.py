from app.users.auth import AuthHandler
from app.users.models import User
from app.database import get_db
from app.exceptions import UserNotFound
from app.enums import UserRoleEnum

from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_db)) -> User:

    user_id = AuthHandler.decode_access_token(token=token)

    from sqlalchemy.future import select
    from sqlalchemy.orm import joinedload

    query = select(User).where(User.id == user_id).options(joinedload(User.role))
    result = await session.execute(query)
    user = result.scalars().first()

    if not user:
        raise UserNotFound
    
    return user

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.name != UserRoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not an admin")
    return current_user