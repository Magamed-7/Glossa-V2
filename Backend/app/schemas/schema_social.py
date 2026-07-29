from pydantic import BaseModel


class FollowUserResponse(BaseModel):
    id: int
    username: str
