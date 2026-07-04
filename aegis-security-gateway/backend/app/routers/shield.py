from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_api_key_user
from ..database import get_db
from ..engines import antispam_engine
from ..engines.ids_engine import check_ip_reputation
from ..models import SpamLog, User
from ..schemas import ShieldRequest, ShieldResponse

router = APIRouter(prefix="/api/v1/shield", tags=["shield"])


@router.post("/check-request", response_model=ShieldResponse)
def check_request(
    payload: ShieldRequest,
    db: Session = Depends(get_db),
    api_user: User = Depends(get_api_key_user),
):
    spam_result = antispam_engine.analyze(payload.content, payload.author)
    ids_result = check_ip_reputation(db, payload.client_ip)

    log = SpamLog(
        user_id=api_user.id,
        author=payload.author,
        content=payload.content[:2000],
        is_spam=spam_result["is_spam"],
        reason=spam_result["reason"],
        score=spam_result["score"],
        client_ip=payload.client_ip,
    )
    db.add(log)
    db.commit()

    is_safe = not spam_result["is_spam"] and not ids_result["is_malicious"]
    verdict = "allowed" if is_safe else "blocked"

    return ShieldResponse(
        safe=is_safe,
        verdict=verdict,
        checks={
            "antispam": {
                "is_spam": spam_result["is_spam"],
                "reason": spam_result["reason"],
                "score": spam_result["score"],
                "detail": spam_result["detail"],
            },
            "ids": {
                "is_malicious": ids_result["is_malicious"],
                "reason": ids_result["reason"],
                "severity": ids_result["severity"],
            },
        },
    )
