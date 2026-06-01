from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.database import engine, SessionLocal, Base
from app.config import settings
from app.models import User
from app.auth import get_password_hash

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables automatically
    logger.info("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        
        # Seed default admin user if not present
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.email == "admin@inventory.com").first()
            if not admin:
                logger.info("Seeding default admin user...")
                hashed_pwd = get_password_hash("admin123")
                admin_user = User(
                    email="admin@inventory.com",
                    hashed_password=hashed_pwd,
                    full_name="System Administrator",
                    role="admin"
                )
                db.add(admin_user)
                db.commit()
                logger.info("Default admin user created successfully: admin@inventory.com / admin123")
            
            # Seed demo catalog data if empty to populate dashboards
            from app.models import Product, Customer, Order, OrderItem, AuditLog
            if db.query(Product).count() == 0:
                logger.info("Seeding demo products catalog...")
                p1 = Product(product_name="Developer Laptop", sku="LAP-ENT-100", price=1200.00, quantity_in_stock=12, description="32GB RAM, 1TB SSD developer workstation")
                p2 = Product(product_name="Mechanical Keyboard", sku="KEY-RGB-200", price=89.99, quantity_in_stock=6, description="Tactile blue switches, RGB backlighting")
                p3 = Product(product_name="Wireless Mouse", sku="MOU-WRL-300", price=45.50, quantity_in_stock=25, description="High-precision wireless optical mouse")
                p4 = Product(product_name="UltraWide Monitor", sku="MON-CRV-400", price=350.00, quantity_in_stock=3, description="34-inch curved ultra-wide gaming display")
                db.add_all([p1, p2, p3, p4])
                db.commit()
                
                logger.info("Seeding demo customer roster...")
                c1 = Customer(full_name="Alice Smith", email="alice@gmail.com", phone_number="555-0199")
                c2 = Customer(full_name="Bob Miller", email="bob@yahoo.com", phone_number="555-0244")
                db.add_all([c1, c2])
                db.commit()
                
                logger.info("Seeding demo sales orders...")
                # Order 1: Alice buys 1 Laptop and 2 Mice
                sub_lap = p1.price * 1
                sub_mou = p3.price * 2
                total1 = sub_lap + sub_mou
                o1 = Order(customer_id=c1.id, total_amount=total1, order_status="Completed")
                db.add(o1)
                db.commit()
                
                oi1 = OrderItem(order_id=o1.id, product_id=p1.id, quantity=1, unit_price=p1.price, subtotal=sub_lap)
                oi2 = OrderItem(order_id=o1.id, product_id=p3.id, quantity=2, unit_price=p3.price, subtotal=sub_mou)
                db.add_all([oi1, oi2])
                
                # Deduct stock
                p1.quantity_in_stock -= 1
                p3.quantity_in_stock -= 2
                db.commit()
                
                # Order 2: Bob buys 1 monitor
                sub_mon = p4.price * 1
                o2 = Order(customer_id=c2.id, total_amount=sub_mon, order_status="Completed")
                db.add(o2)
                db.commit()
                
                oi3 = OrderItem(order_id=o2.id, product_id=p4.id, quantity=1, unit_price=p4.price, subtotal=sub_mon)
                db.add(oi3)
                
                # Deduct stock
                p4.quantity_in_stock -= 1
                db.commit()
                
                # Add audit logs
                l1 = AuditLog(user_id=admin_user.id if admin_user else None, action="CREATE_PRODUCT", target_table="products", target_id=p1.id, details="Seeded catalog Developer Laptop")
                l2 = AuditLog(user_id=admin_user.id if admin_user else None, action="ORDER_PLACE", target_table="orders", target_id=o1.id, details=f"Seeded checkout order ORD-00001 for ${total1:.2f}")
                db.add_all([l1, l2])
                db.commit()
                logger.info("Demo dashboard dataset seeded successfully!")
        except Exception as e:
            logger.error(f"Error seeding database: {e}")
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to auto-initialize database tables: {e}")
    yield

# Initialize FastAPI App
app = FastAPI(
    title="Inventory & Order Management System API",
    description="Backend API for managing products, customers, orders, and audit logs.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
# In production, we'd limit this to specific domains
origins = [org.strip() for org in settings.CORS_ORIGINS.split(",") if org.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Global Exception Handler for validation or unexpected issues
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact the administrator."}
    )

# Include Routers
from app.routes import auth, products, customers, orders, dashboard, audit

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
app.include_router(audit.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the Inventory & Order Management System API",
        "docs_url": "/docs"
    }
