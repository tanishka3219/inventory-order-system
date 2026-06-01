def test_create_customer(client, admin_token):
    response = client.post(
        "/api/customers",
        json={"full_name": "Alice Johnson", "email": "alice@test.com", "phone_number": "123-456-7890"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Alice Johnson"
    assert data["email"] == "alice@test.com"
    assert data["phone_number"] == "123-456-7890"
    assert "id" in data

def test_create_customer_duplicate_email(client, admin_token):
    payload = {"full_name": "Bob Smith", "email": "bob@test.com"}
    r1 = client.post("/api/customers", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert r1.status_code == 201
    
    r2 = client.post("/api/customers", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert r2.status_code == 409
    assert "already exists" in r2.json()["detail"]

def test_list_customers(client, staff_token, admin_token):
    client.post(
        "/api/customers", 
        json={"full_name": "Customer A", "email": "a@test.com"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    response = client.get("/api/customers", headers={"Authorization": f"Bearer {staff_token}"})
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["full_name"] == "Customer A"
