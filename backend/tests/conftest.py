import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.auth import get_password_hash
from app.models import User

from sqlalchemy.pool import StaticPool
from app import models  # Ensures all model classes are registered on Base.metadata

# SQLite in-memory database with StaticPool to share a single connection
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Setup tables before test
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Seed default test users
    hashed_pwd = get_password_hash("password123")
    admin_user = User(
        email="admin@test.com",
        hashed_password=hashed_pwd,
        full_name="Test Admin",
        role="admin"
    )
    staff_user = User(
        email="staff@test.com",
        hashed_password=hashed_pwd,
        full_name="Test Staff",
        role="staff"
    )
    session.add(admin_user)
    session.add(staff_user)
    session.commit()
    
    try:
        yield session
    finally:
        session.close()
        # Drop tables after test
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def admin_token(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "admin@test.com", "password": "password123"}
    )
    return response.json()["access_token"]

@pytest.fixture(scope="function")
def staff_token(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "staff@test.com", "password": "password123"}
    )
    return response.json()["access_token"]
