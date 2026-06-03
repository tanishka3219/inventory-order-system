from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, schemas, models
from database import get_db
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("", response_model=schemas.OrderResponse, status_code=201)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_role(["Admin", "Manager"]))):
    return crud.create_order(db=db, order=order, user_id=current_user.id)

@router.get("", response_model=List[schemas.OrderResponse])
def read_orders(skip: int = 0, limit: int = 100, status: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_orders(db, skip=skip, limit=limit, status=status)

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def read_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_order = crud.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_role(["Admin"]))):
    db_order = crud.delete_order(db, order_id=order_id, user_id=current_user.id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"detail": "Order deleted"}
