from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app import schemas, crud, auth, models
from app.database import get_db

router = APIRouter(prefix="/api/products", tags=["Products"])

# Role check dependencies
require_admin_or_manager = auth.RoleChecker(["admin", "manager"])

@router.post("", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: schemas.ProductCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    return crud.create_product(db=db, product_in=product_in, user_id=current_user.id)

@router.get("", response_model=dict)
def read_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    low_stock: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    products, total = crud.get_products(
        db=db, skip=skip, limit=limit, search=search, low_stock=low_stock
    )
    return {
        "items": [schemas.ProductResponse.model_validate(p) for p in products],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def read_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    product = crud.get_product(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Product with ID {product_id} not found"
        )
    return product

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int, 
    product_in: schemas.ProductUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    return crud.update_product(db=db, product_id=product_id, product_in=product_in, user_id=current_user.id)

@router.delete("/{product_id}", response_model=schemas.ProductResponse)
def delete_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    return crud.delete_product(db=db, product_id=product_id, user_id=current_user.id)
