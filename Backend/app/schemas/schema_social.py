from pydantic import BaseModel, ConfigDict


class FollowUserResponse(BaseModel):
    id: int
    username: str
    subscription_tier: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UserSearchResult(BaseModel):
    id: int
    username: str
    photo_url: str | None = None
    subscription_tier: str | None = None
