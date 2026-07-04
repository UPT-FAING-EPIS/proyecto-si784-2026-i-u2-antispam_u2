from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from ..auth import hash_api_key
from ..database import get_db
from ..engines import antispam_engine
from ..models import ApiKey, SpamLog

router = APIRouter(prefix="/api/v1/public", tags=["public"])


class PublicSpamRequest(BaseModel):
    author: str | None = None
    content: str
    user_email: str | None = None
    client_ip: str | None = None

    @field_validator("author", mode="before")
    @classmethod
    def coerce_author(cls, v: object) -> str:
        if not v:
            return "unknown"
        return str(v)


class PublicSpamResponse(BaseModel):
    isSpam: bool
    reason: str | None
    score: int


@router.post("/spam-check", response_model=PublicSpamResponse)
def public_spam_check(
    payload: PublicSpamRequest,
    db: Session = Depends(get_db),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
):
    user_id = None
    if x_api_key:
        api_key = db.query(ApiKey).filter(
            ApiKey.key_hash == hash_api_key(x_api_key),
            ApiKey.is_active.is_(True),
        ).first()
        if api_key:
            user_id = api_key.user_id

    result = antispam_engine.analyze(payload.content, payload.author)

    log = SpamLog(
        user_id=user_id,
        user_email=payload.user_email,
        author=payload.author[:255],
        content=payload.content[:2000],
        is_spam=result["is_spam"],
        reason=result["reason"],
        score=result["score"],
        client_ip=payload.client_ip,
    )
    db.add(log)
    db.commit()

    return PublicSpamResponse(
        isSpam=result["is_spam"],
        reason=result["reason"],
        score=result["score"],
    )
