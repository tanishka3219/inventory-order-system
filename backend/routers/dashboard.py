from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import crud, schemas, models
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_dashboard_stats(db)
