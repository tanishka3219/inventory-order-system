def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "newuser@test.com", "password": "securepassword", "full_name": "New User", "role": "staff"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "staff"
    assert "id" in data

def test_register_duplicate_user(client):
    payload = {"email": "dup@test.com", "password": "securepassword", "full_name": "Dup User"}
    r1 = client.post("/api/auth/register", json=payload)
    assert r1.status_code == 201
    
    r2 = client.post("/api/auth/register", json=payload)
    assert r2.status_code == 409
    assert r2.json()["detail"] == "A user with this email address already exists"

def test_login_success(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "admin@test.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_password(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "admin@test.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

def test_read_me_authenticated(client, staff_token):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "staff@test.com"
    assert data["role"] == "staff"
