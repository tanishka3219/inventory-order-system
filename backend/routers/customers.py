from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, models, schemas
from database import get_db
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/customers", tags=["customers"])

@router.post("", response_model=schemas.CustomerResponse, status_code=201)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_role(["Admin", "Manager"]))):
    db_customer = crud.get_customer_by_email(db, email=customer.email)
    if db_customer:
        raise HTTPException(status_code=409, detail="Email already registered")
    return crud.create_customer(db=db, customer=customer, user_id=current_user.id)

@router.get("", response_model=List[schemas.CustomerResponse])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    customers = crud.get_customers(db, skip=skip, limit=limit)
    return customers

@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def read_customer(customer_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_customer = crud.get_customer(db, customer_id=customer_id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_role(["Admin"]))):
    db_customer = crud.delete_customer(db, customer_id=customer_id, user_id=current_user.id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"detail": "Customer deleted"}
