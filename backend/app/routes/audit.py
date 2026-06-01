from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud, auth, models
from app.database import get_db

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])

# Restricted to admin and manager roles
require_admin_or_manager = auth.RoleChecker(["admin", "manager"])

@router.get("", response_model=List[schemas.AuditLogResponse])
def read_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    logs = crud.get_audit_logs(db=db, skip=skip, limit=limit)
    return logs
