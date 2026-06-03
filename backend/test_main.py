from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pytest

from main import app, init_db
from database import Base, get_db
import models
from auth import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Create test admin
    admin = models.User(username="testadmin", hashed_password=get_password_hash("testpass"), role="Admin")
    db.add(admin)
    db.commit()
    db.close()
    
    with TestClient(app) as c:
        yield c
    
    Base.metadata.drop_all(bind=engine)

def test_login(client):
    response = client.post("/api/auth/login", data={"username": "testadmin", "password": "testpass"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_create_customer(client):
    login_response = client.post("/api/auth/login", data={"username": "testadmin", "password": "testpass"})
    token = login_response.json()["access_token"]
    
    response = client.post(
        "/api/customers",
        json={"full_name": "Test Customer", "email": "test@example.com"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"

def test_create_product(client):
    login_response = client.post("/api/auth/login", data={"username": "testadmin", "password": "testpass"})
    token = login_response.json()["access_token"]
    
    response = client.post(
        "/api/products",
        json={"product_name": "Test Product", "sku": "SKU123", "price": 10.5, "quantity_in_stock": 100},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    assert response.json()["sku"] == "SKU123"

def test_unauthorized_access(client):
    response = client.get("/api/products")
    assert response.status_code == 401
