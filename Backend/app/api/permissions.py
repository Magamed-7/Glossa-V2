from fastapi import Depends

from app.api.auth import get_current_user
from app.core.errors import AppError


def require_roles(roles: list[str]):
    async def dependency(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise AppError(code='FORBIDDEN', message='You do not have access to this resource', status_code=403)

        return current_user

    return dependency
