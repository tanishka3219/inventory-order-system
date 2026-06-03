from sqlalchemy.orm import Session
import models, schemas
from fastapi import HTTPException
import json

def log_audit(db: Session, user_id: int, action: str, details: str = None):
    audit_log = models.AuditLog(user_id=user_id, action=action, details=details)
    db.add(audit_log)
    db.commit()

# --- Product CRUD ---
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(models.Product)
    if search:
        query = query.filter(models.Product.product_name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate, user_id: int):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    log_audit(db, user_id, "CREATE_PRODUCT", f"Product SKU {product.sku} created")
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate, user_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    log_audit(db, user_id, "UPDATE_PRODUCT", f"Product ID {product_id} updated")
    return db_product

def delete_product(db: Session, product_id: int, user_id: int):
    db_product = get_product(db, product_id)
    if db_product:
        db.delete(db_product)
        db.commit()
        log_audit(db, user_id, "DELETE_PRODUCT", f"Product ID {product_id} deleted")
    return db_product

# --- Customer CRUD ---
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate, user_id: int):
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    log_audit(db, user_id, "CREATE_CUSTOMER", f"Customer {customer.email} created")
    return db_customer

def delete_customer(db: Session, customer_id: int, user_id: int):
    db_customer = get_customer(db, customer_id)
    if db_customer:
        db.delete(db_customer)
        db.commit()
        log_audit(db, user_id, "DELETE_CUSTOMER", f"Customer ID {customer_id} deleted")
    return db_customer

# --- Order CRUD ---
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.Order)
    if status:
        query = query.filter(models.Order.order_status == status)
    return query.offset(skip).limit(limit).all()

def create_order(db: Session, order: schemas.OrderCreate, user_id: int):
    db_customer = get_customer(db, order.customer_id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    total_amount = 0.0
    order_items = []

    for item in order.items:
        db_product = get_product(db, item.product_id)
        if not db_product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        if db_product.quantity_in_stock < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock available for product '{db_product.product_name}'."
            )
        
        subtotal = db_product.price * item.quantity
        total_amount += subtotal
        
        db_product.quantity_in_stock -= item.quantity
        
        order_items.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": db_product.price,
            "subtotal": subtotal
        })

    db_order = models.Order(customer_id=order.customer_id, total_amount=total_amount)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for oi in order_items:
        db_order_item = models.OrderItem(order_id=db_order.id, **oi)
        db.add(db_order_item)
    
    db.commit()
    db.refresh(db_order)
    
    log_audit(db, user_id, "CREATE_ORDER", f"Order ID {db_order.id} created for amount {total_amount}")
    return db_order

def delete_order(db: Session, order_id: int, user_id: int):
    db_order = get_order(db, order_id)
    if db_order:
        db.delete(db_order)
        db.commit()
        log_audit(db, user_id, "DELETE_ORDER", f"Order ID {order_id} deleted")
    return db_order

# --- Dashboard CRUD ---
def get_dashboard_stats(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    low_stock_products = db.query(models.Product).filter(models.Product.quantity_in_stock < 10).all()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products
    }
