from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud, auth, models
from app.database import get_db

router = APIRouter(prefix="/api/orders", tags=["Orders"])

# Role check dependencies
require_admin_or_manager = auth.RoleChecker(["admin", "manager"])

@router.post("", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: schemas.OrderCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_order(db=db, order_in=order_in, user_id=current_user.id)

@router.get("", response_model=List[schemas.OrderResponse])
def read_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_orders(db=db)

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def read_order(
    order_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    order = crud.get_order(db=db, order_id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Order with ID {order_id} not found"
        )
    return order

@router.delete("/{order_id}", response_model=schemas.OrderResponse)
def delete_order(
    order_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    return crud.delete_order(db=db, order_id=order_id, user_id=current_user.id)

@router.put("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    status_update: schemas.OrderUpdateStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    if status_update.status not in ["Pending", "Completed", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Status must be Pending, Completed, or Cancelled."
        )
    return crud.update_order_status(db=db, order_id=order_id, new_status=status_update.status, user_id=current_user.id)
