from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ..auth import get_current_admin, get_current_user
from ..database import get_db
from ..models import IdsAlert, User
from ..schemas import IdsAlertOut

router = APIRouter(prefix="/api/v1/ids", tags=["ids"])


@router.get("/alerts", response_model=list[IdsAlertOut])
def list_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    level: str | None = Query(None, description="Filtrar por nivel: ALTO, MEDIO, BAJO"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(IdsAlert)
    if level:
        query = query.filter(IdsAlert.level == level.upper())
    return query.order_by(IdsAlert.timestamp.desc()).offset(skip).limit(limit).all()


@router.post("/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_alerts(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    db.query(IdsAlert).delete()
    db.commit()
