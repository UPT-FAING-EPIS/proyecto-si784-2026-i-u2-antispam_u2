from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..ai import analyze_with_deepseek
from ..auth import get_api_key_user, get_current_user
from ..database import get_db, SessionLocal
from ..engines.scanner_engine import scan_target
from ..models import Scan, User, Vulnerability
from ..schemas import ScanCreate, ScanOut, ScanSummary

router = APIRouter(prefix="/api/v1/scanner", tags=["scanner"])


def _run_scan(scan_id: int, target_url: str, modules: list[str], depth: int, timeout: int) -> None:
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return

        scan.status = "running"
        scan.started_at = datetime.utcnow()
        scan.progress = 10
        db.commit()

        try:
            findings, risk_score = scan_target(target_url, modules, depth, timeout)
        except Exception as exc:
            scan.status = "failed"
            scan.error_message = str(exc)
            scan.completed_at = datetime.utcnow()
            db.commit()
            return

        scan.progress = 80
        db.commit()

        for finding in findings:
            vuln = Vulnerability(
                scan_id=scan_id,
                module=finding["module"],
                severity=finding["severity"],
                title=finding["title"],
                description=finding["description"],
                evidence=finding.get("evidence"),
                remediation=finding["remediation"],
                url=finding["url"],
                parameter=finding.get("parameter"),
            )
            db.add(vuln)
        db.commit()

        import asyncio  # noqa: PLC0415
        vuln_dicts = [
            {"module": f["module"], "severity": f["severity"], "title": f["title"],
             "url": f["url"], "parameter": f.get("parameter"), "evidence": f.get("evidence")}
            for f in findings
        ]
        ai_summary = asyncio.run(analyze_with_deepseek(vuln_dicts, target_url))

        scan.status = "completed"
        scan.risk_score = risk_score
        scan.ai_summary = ai_summary
        scan.progress = 100
        scan.completed_at = datetime.utcnow()
        db.commit()

    except Exception as exc:
        db.rollback()
        print(f"[SCANNER] Error en scan {scan_id}: {exc}")
    finally:
        db.close()


@router.post("/scan", response_model=ScanSummary, status_code=status.HTTP_202_ACCEPTED)
def create_scan(
    payload: ScanCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = Scan(
        user_id=current_user.id,
        target_url=payload.target_url,
        status="pending",
        modules=payload.modules,
        depth=payload.depth,
        timeout=payload.timeout,
        progress=0,
        risk_score=0,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    background_tasks.add_task(
        _run_scan, scan.id, payload.target_url, payload.modules, payload.depth, payload.timeout
    )

    return scan


@router.get("/scans", response_model=list[ScanSummary])
def list_scans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Scan)
    if not current_user.is_admin:
        query = query.filter(Scan.user_id == current_user.id)
    return query.order_by(Scan.created_at.desc()).limit(100).all()


@router.get("/scans/{scan_id}", response_model=ScanOut)
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escaneo no encontrado")
    if scan.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    return scan
