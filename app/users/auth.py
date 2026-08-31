from app.exceptions import UserNotFound
from app.users.models import User
from app.users.DAO import UserDAO
from app.database import get_db
from app.config import settings

from datetime import datetime, timedelta, timezone

import jwt
import bcrypt

from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import Depends, HTTPException, status


class AuthHandler():

    @staticmethod
    def decode_access_token(token: str) -> int:

        try:
            payload = jwt.decode(jwt=token, key=settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")

            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, 
                    detail="Токен не содержит ID пользователя"
                )
            
            return int(user_id)   

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Срок действия токена истек"
            )

        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Невалидный токен"
            )


    @staticmethod
    def create_access_token(user_id:int) -> str:

        expire = datetime.now(timezone.utc) + timedelta(days=1)

        payload = {
            "sub": str(user_id),
            "exp": expire
        }

        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        

    @staticmethod
    def get_password_hash(password: str) -> str:

        salt = bcrypt.gensalt()
        pwd_bytes = password.encode(encoding="utf-8")
        hashed_pwd_bytes = bcrypt.hashpw(pwd_bytes, salt)

        return hashed_pwd_bytes.decode("utf-8")

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:

        return bcrypt.checkpw(
            password=password.encode("utf-8"), 
            hashed_password=hashed_password.encode("utf-8")
        )


    
