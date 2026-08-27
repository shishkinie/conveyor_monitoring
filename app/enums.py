from enum import Enum

class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    WORKER = "worker"
    MANAGER = "manager"