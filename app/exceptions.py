from fastapi import Depends, HTTPException, status

UserAlreadyExistException = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Пользователь уже существует"    
)

IncorrectUsernameOrPassword = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Неверный email или пароль",
        headers={"WWW-Authenticate": "Bearer"}, 
    )

UserNotFound = HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                headers={"WWW-Authenticate": "Bearer"},
                detail="Пользователь не найден"
            )

