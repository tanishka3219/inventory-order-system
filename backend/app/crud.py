from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from typing import List, Optional
import json

from app import models, schemas, auth

# ==========================================
# AUDIT LOG HELPER
# ==========================================
def create_audit_log(
    db: Session, 
    user_id: Optional[int], 
    action: str, 
    target_table: str, 
    target_id: Optional[int], 
    details: Optional[str] = None
) -> models.AuditLog:
    log_entry = models.AuditLog(
        user_id=user_id,
        action=action,
        target_table=target_table,
        target_id=target_id,
        details=details
    )
    db.add(log_entry)
    db.flush()  # gets ID without committing
    return log_entry


# ==========================================
# USER CRUD
# ==========================================
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    hashed_password = auth.get_password_hash(user_in.password)
    db_user = models.User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Log user registration (or creation)
    create_audit_log(db, db_user.id, "REGISTER", "users", db_user.id, f"User {db_user.email} registered")
    db.commit()
    return db_user


# ==========================================
# PRODUCT CRUD
# ==========================================
def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(
    db: Session, 
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None, 
    low_stock: bool = False
) -> tuple[List[models.Product], int]:
    query = db.query(models.Product)
    
    if search:
        search_filter = or_(
            models.Product.product_name.ilike(f"%{search}%"),
            models.Product.sku.ilike(f"%{search}%"),
            models.Product.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
        
    if low_stock:
        # Define low stock threshold as <= 10 items
        query = query.filter(models.Product.quantity_in_stock <= 10)
        
    total_count = query.count()
    items = query.order_by(models.Product.id.desc()).offset(skip).limit(limit).all()
    return items, total_count

def create_product(db: Session, product_in: schemas.ProductCreate, user_id: int) -> models.Product:
    # Check if SKU is unique
    existing_product = get_product_by_sku(db, product_in.sku)
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{product_in.sku}' already exists"
        )
        
    db_product = models.Product(**product_in.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Log product creation
    create_audit_log(
        db, 
        user_id, 
        "CREATE_PRODUCT", 
        "products", 
        db_product.id, 
        f"Created product: {db_product.product_name} (SKU: {db_product.sku}) with quantity {db_product.quantity_in_stock}"
    )
    db.commit()
    return db_product

def update_product(db: Session, product_id: int, product_in: schemas.ProductUpdate, user_id: int) -> models.Product:
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    update_data = product_in.model_dump(exclude_unset=True)
    
    # Check SKU uniqueness if it's changing
    if "sku" in update_data and update_data["sku"] != db_product.sku:
        existing = get_product_by_sku(db, update_data["sku"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{update_data['sku']}' already exists"
            )
            
    old_details = {
        "sku": db_product.sku,
        "product_name": db_product.product_name,
        "price": db_product.price,
        "quantity_in_stock": db_product.quantity_in_stock
    }
    
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    
    # Log product update
    new_details = {
        "sku": db_product.sku,
        "product_name": db_product.product_name,
        "price": db_product.price,
        "quantity_in_stock": db_product.quantity_in_stock
    }
    details_str = f"Updated properties: Old: {old_details} -> New: {new_details}"
    create_audit_log(db, user_id, "UPDATE_PRODUCT", "products", db_product.id, details_str)
    db.commit()
    return db_product

def delete_product(db: Session, product_id: int, user_id: int) -> models.Product:
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    # Check if there are orders referencing this product.
    # If yes, we can raise a conflict, or restrict deletion (as per foreign key)
    # The ForeignKey has RESTRICT, so SQLAlchemy will raise an IntegrityError. Let's catch and format nicely.
    try:
        product_name = db_product.product_name
        sku = db_product.sku
        db.delete(db_product)
        db.commit()
        
        # Log product deletion
        create_audit_log(db, user_id, "DELETE_PRODUCT", "products", product_id, f"Deleted product: {product_name} (SKU: {sku})")
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete product because it is referenced by existing orders."
        )
    return db_product


# ==========================================
# CUSTOMER CRUD
# ==========================================
def get_customer(db: Session, customer_id: int) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Customer]:
    return db.query(models.Customer).order_by(models.Customer.id.desc()).offset(skip).limit(limit).all()

def create_customer(db: Session, customer_in: schemas.CustomerCreate, user_id: int) -> models.Customer:
    # Check if email is unique
    existing_customer = get_customer_by_email(db, customer_in.email)
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Customer with email '{customer_in.email}' already exists"
        )
        
    db_customer = models.Customer(**customer_in.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    # Log customer creation
    create_audit_log(
        db, 
        user_id, 
        "CREATE_CUSTOMER", 
        "customers", 
        db_customer.id, 
        f"Registered customer: {db_customer.full_name} ({db_customer.email})"
    )
    db.commit()
    return db_customer

def delete_customer(db: Session, customer_id: int, user_id: int) -> models.Customer:
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        
    customer_name = db_customer.full_name
    email = db_customer.email
    db.delete(db_customer)
    db.commit()
    
    # Log customer deletion
    create_audit_log(db, user_id, "DELETE_CUSTOMER", "customers", customer_id, f"Deleted customer: {customer_name} ({email})")
    db.commit()
    return db_customer


# ==========================================
# ORDER CRUD & BUSINESS LOGIC
# ==========================================
def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[models.Order]:
    query = db.query(models.Order)
    if status:
        query = query.filter(models.Order.order_status == status)
    return query.order_by(models.Order.id.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_in: schemas.OrderCreate, user_id: int) -> models.Order:
    # 1. Verify customer exists
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Customer with ID {order_in.customer_id} not found"
        )
        
    # Start atomic order processing
    # We will accumulate items and calculate price, checking stocks
    db_order_items = []
    total_amount = 0.0
    
    # We use a nested list or dict to prevent duplicate product requests in the same order
    # combining their quantities if duplicate IDs are specified.
    consolidated_items = {}
    for item in order_in.items:
        consolidated_items[item.product_id] = consolidated_items.get(item.product_id, 0) + item.quantity

    # Fetch and lock rows to prevent stock race conditions
    for product_id, quantity in consolidated_items.items():
        product = db.query(models.Product).filter(models.Product.id == product_id).with_for_update().first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found"
            )
            
        # Business Rule: Reject order if stock insufficient
        if product.quantity_in_stock < quantity:
            # Requirements specifically demand HTTP Status 400 and JSON {"error": "Insufficient stock available"} or similar
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient stock available"
            )
            
        # Calculate pricing
        subtotal = product.price * quantity
        total_amount += subtotal
        
        # Deduct inventory stock
        product.quantity_in_stock -= quantity
        
        # Prepare OrderItem database instance
        db_order_item = models.OrderItem(
            product_id=product_id,
            quantity=quantity,
            unit_price=product.price,
            subtotal=subtotal
        )
        db_order_items.append(db_order_item)

    # Create Order object
    db_order = models.Order(
        customer_id=order_in.customer_id,
        total_amount=total_amount,
        order_status="Completed"  # Completed by default, or Pending. Let's default to Completed as it represents processed checkouts.
    )
    
    db.add(db_order)
    db.flush()  # gets db_order.id
    
    # Associate Order Items
    for item in db_order_items:
        item.order_id = db_order.id
        db.add(item)
        
    # Log order placement
    item_details = [{"product_id": k, "qty": v} for k, v in consolidated_items.items()]
    details_str = f"Placed order for customer {customer.full_name} (ID: {customer.id}) totaling ${total_amount:.2f}. Items: {json.dumps(item_details)}"
    create_audit_log(db, user_id, "ORDER_PLACE", "orders", db_order.id, details_str)
    
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int, user_id: int) -> models.Order:
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    # Before deleting, restore the stock of products in the order if it wasn't cancelled already
    if db_order.order_status != "Cancelled":
        for item in db_order.order_items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            if product:
                product.quantity_in_stock += item.quantity
                
    order_id_val = db_order.id
    customer_name = db_order.customer.full_name
    total_val = db_order.total_amount
    
    db.delete(db_order)
    db.commit()
    
    # Log deletion
    create_audit_log(db, user_id, "DELETE_ORDER", "orders", order_id_val, f"Deleted order {order_id_val} (Customer: {customer_name}, Total: ${total_val:.2f}). Restored inventory.")
    db.commit()
    return db_order

def update_order_status(db: Session, order_id: int, new_status: str, user_id: int) -> models.Order:
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    old_status = db_order.order_status
    if old_status == new_status:
        return db_order
        
    # If transitioning to Cancelled, we should restore stock
    if new_status == "Cancelled" and old_status != "Cancelled":
        for item in db_order.order_items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            if product:
                product.quantity_in_stock += item.quantity
                
    # If transitioning FROM Cancelled to Completed, we check stock and reduce
    elif old_status == "Cancelled" and new_status in ["Completed", "Pending"]:
        for item in db_order.order_items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            if not product or product.quantity_in_stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock available to reactivate order. Product ID {item.product_id} lacks stock."
                )
            product.quantity_in_stock -= item.quantity
            
    db_order.order_status = new_status
    db.commit()
    db.refresh(db_order)
    
    # Log change
    create_audit_log(db, user_id, "ORDER_STATUS_UPDATE", "orders", order_id, f"Order status updated from {old_status} to {new_status}")
    db.commit()
    return db_order


# ==========================================
# AUDIT LOG CRUD
# ==========================================
def get_audit_logs(db: Session, skip: int = 0, limit: int = 100) -> List[models.AuditLog]:
    return db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).offset(skip).limit(limit).all()
