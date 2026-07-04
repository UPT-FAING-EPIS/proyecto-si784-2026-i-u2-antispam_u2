from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import IdsAlert


def check_ip_reputation(db: Session, source_ip: str) -> dict:
    last_alert = (
        db.query(IdsAlert)
        .filter(IdsAlert.source_ip == source_ip)
        .order_by(IdsAlert.timestamp.desc())
        .first()
    )

    if last_alert is None:
        return {
            "is_malicious": False,
            "reason": None,
            "severity": None,
        }

    return {
        "is_malicious": True,
        "reason": f"{last_alert.type}: {last_alert.description}",
        "severity": last_alert.level,
    }
