"""Создание первого администратора.

Использование:
    python -m app.seed_admin admin@example.com password

Если аргументы не переданы, используются значения по умолчанию:
    admin@example.com / admin12345
"""

import asyncio
import sys

from app.database import SessionLocal
from app.enums import UserRoleEnum
from app.users.DAO import RoleDAO, UserDAO
from app.users.auth import AuthHandler


async def seed_admin(username: str, password: str) -> None:
    async with SessionLocal() as session:
        role = await RoleDAO.find_one_or_none(
            session=session, name=UserRoleEnum.ADMIN.value
        )
        if not role:
            role = await RoleDAO.create(
                session=session, name=UserRoleEnum.ADMIN.value
            )

        existing = await UserDAO.find_one_or_none(session=session, username=username)
        if existing:
            print(f"Пользователь {username} уже существует")
            return

        hashed_password = AuthHandler.get_password_hash(password=password)
        await UserDAO.create(
            session=session,
            username=username,
            hashed_password=hashed_password,
            role_id=role.id,
        )
        print(f"Администратор {username} создан")


if __name__ == "__main__":
    username = sys.argv[1] if len(sys.argv) > 1 else "admin@example.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "admin12345"
    asyncio.run(seed_admin(username, password))
