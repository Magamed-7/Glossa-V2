from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str | None
    score: int
    photo_url: str | None = None


class MyRankResponse(BaseModel):
    rank: int | None
    score: int
