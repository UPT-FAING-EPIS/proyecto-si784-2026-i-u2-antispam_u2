from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..engines import antispam_engine
from ..models import SpamLog, User
from ..schemas import SpamCheckRequest, SpamCheckResult, SpamLogOut

router = APIRouter(prefix="/api/v1/antispam", tags=["antispam"])


@router.post("/check", response_model=SpamCheckResult)
def check_spam(
    payload: SpamCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = antispam_engine.analyze(payload.content, payload.author)

    log = SpamLog(
        user_id=current_user.id,
        author=payload.author,
        content=payload.content[:2000],
        is_spam=result["is_spam"],
        reason=result["reason"],
        score=result["score"],
        client_ip=payload.client_ip,
    )
    db.add(log)
    db.commit()

    return SpamCheckResult(**result)


class SpamStats(BaseModel):
    total_logs: int
    spam_total: int
    spam_blocked_24h: int
    clean_total: int


@router.get("/stats", response_model=SpamStats)
def spam_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cutoff = datetime.utcnow() - timedelta(hours=24)
    query = db.query(SpamLog)
    if not current_user.is_admin:
        query = query.filter(SpamLog.user_id == current_user.id)
    total = query.count()
    spam_total = query.filter(SpamLog.is_spam.is_(True)).count()
    spam_24h = query.filter(SpamLog.is_spam.is_(True), SpamLog.created_at >= cutoff).count()
    return SpamStats(
        total_logs=total,
        spam_total=spam_total,
        spam_blocked_24h=spam_24h,
        clean_total=total - spam_total,
    )


@router.get("/logs", response_model=list[SpamLogOut])
def list_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SpamLog)
    if not current_user.is_admin:
        query = query.filter(SpamLog.user_id == current_user.id)
    return query.order_by(SpamLog.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/logs/{log_id}/approve", response_model=SpamLogOut)
def approve_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(SpamLog).filter(SpamLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log no encontrado")
    if not current_user.is_admin and log.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin acceso")
    log.is_spam = False
    log.reason = "approved_by_user"
    db.commit()
    db.refresh(log)
    return log
