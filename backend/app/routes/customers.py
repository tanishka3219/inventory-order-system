from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud, auth, models
from app.database import get_db

router = APIRouter(prefix="/api/customers", tags=["Customers"])

# Role check dependencies
require_admin_or_manager = auth.RoleChecker(["admin", "manager"])

@router.post("", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: schemas.CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    return crud.create_customer(db=db, customer_in=customer_in, user_id=current_user.id)

@router.get("", response_model=List[schemas.CustomerResponse])
def read_customers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_customers(db=db)

@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def read_customer(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    customer = crud.get_customer(db=db, customer_id=customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Customer with ID {customer_id} not found"
        )
    return customer

@router.delete("/{customer_id}", response_model=schemas.CustomerResponse)
def delete_customer(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    return crud.delete_customer(db=db, customer_id=customer_id, user_id=current_user.id)
