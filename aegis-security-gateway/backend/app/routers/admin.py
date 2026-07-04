from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_current_admin
from ..database import get_db
from ..models import IdsAlert, Scan, SpamLog, User
from ..schemas import AdminOverview, UserOut

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/overview", response_model=AdminOverview)
def admin_overview(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    cutoff = datetime.utcnow() - timedelta(hours=24)

    total_users = db.query(User).count()
    total_scans = db.query(Scan).count()
    total_ids_alerts = db.query(IdsAlert).count()
    total_spam_logs = db.query(SpamLog).count()
    spam_blocked_24h = db.query(SpamLog).filter(
        SpamLog.is_spam.is_(True),
        SpamLog.created_at >= cutoff,
    ).count()
    ids_alerts_24h = db.query(IdsAlert).filter(
        IdsAlert.timestamp >= cutoff
    ).count()

    return AdminOverview(
        total_users=total_users,
        total_scans=total_scans,
        total_ids_alerts=total_ids_alerts,
        total_spam_logs=total_spam_logs,
        spam_blocked_24h=spam_blocked_24h,
        ids_alerts_24h=ids_alerts_24h,
    )


@router.get("/users", response_model=list[UserOut])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
