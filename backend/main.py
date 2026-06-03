from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine, SessionLocal
from routers import products, customers, orders, dashboard, auth
from auth import get_password_hash

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Seed default admin user
def init_db():
    db = SessionLocal()
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        admin_user = models.User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role="Admin"
        )
        db.add(admin_user)
        db.commit()
    db.close()

init_db()

app = FastAPI(title="Inventory & Order Management API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, change to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Inventory & Order Management API"}
