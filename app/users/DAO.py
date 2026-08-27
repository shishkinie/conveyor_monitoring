from app.core.base_dao import BaseDAO
from app.users.models import User, Role


class UserDAO(BaseDAO): 

    model = User

class RoleDAO(BaseDAO):

    model = Role