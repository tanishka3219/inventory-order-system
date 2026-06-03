from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, models, schemas
from database import get_db
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/products", tags=["products"])

@router.post("", response_model=schemas.ProductResponse, status_code=201)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_role(["Admin", "Manager"]))):
    db_product = crud.get_product_by_sku(db, sku=product.sku)
    if db_product:
        raise HTTPException(status_code=409, detail="SKU already registered")
    return crud.create_product(db=db, product=product, user_id=current_user.id)

@router.get("", response_model=List[schemas.ProductResponse])
def read_products(skip: int = 0, limit: int = 100, search: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    products = crud.get_products(db, skip=skip, limit=limit, search=search)
    return products

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_role(["Admin", "Manager"]))):
    db_product = crud.update_product(db, product_id=product_id, product_update=product, user_id=current_user.id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_role(["Admin"]))):
    db_product = crud.delete_product(db, product_id=product_id, user_id=current_user.id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"detail": "Product deleted"}
