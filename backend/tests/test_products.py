def test_create_product_admin(client, admin_token):
    response = client.post(
        "/api/products",
        json={"product_name": "Test Product", "sku": "PROD-TEST-123", "price": 49.99, "quantity_in_stock": 100, "description": "High quality testing product"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["product_name"] == "Test Product"
    assert data["sku"] == "PROD-TEST-123"
    assert data["price"] == 49.99
    assert data["quantity_in_stock"] == 100

def test_create_product_staff_forbidden(client, staff_token):
    response = client.post(
        "/api/products",
        json={"product_name": "Forbidden Prod", "sku": "FORBID-SKU", "price": 10.00, "quantity_in_stock": 5},
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert response.status_code == 403
    assert "Permission denied" in response.json()["detail"]

def test_create_product_invalid_price(client, admin_token):
    response = client.post(
        "/api/products",
        json={"product_name": "Bad Price", "sku": "BAD-PRICE", "price": -5.00, "quantity_in_stock": 10},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    # FastAPI returns 422 for pydantic validation errors
    assert response.status_code == 422

def test_read_products_list(client, staff_token, admin_token):
    # Seed products
    client.post(
        "/api/products",
        json={"product_name": "Keyboard", "sku": "KEY-001", "price": 19.99, "quantity_in_stock": 50},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    client.post(
        "/api/products",
        json={"product_name": "Mouse", "sku": "MOU-002", "price": 9.99, "quantity_in_stock": 8},  # low stock
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Get all products
    r_all = client.get("/api/products", headers={"Authorization": f"Bearer {staff_token}"})
    assert r_all.status_code == 200
    all_data = r_all.json()
    assert all_data["total"] == 2
    assert len(all_data["items"]) == 2
    
    # Search products
    r_search = client.get("/api/products?search=Keyboard", headers={"Authorization": f"Bearer {staff_token}"})
    assert r_search.json()["total"] == 1
    assert r_search.json()["items"][0]["sku"] == "KEY-001"
    
    # Filter low stock (<= 10)
    r_low = client.get("/api/products?low_stock=true", headers={"Authorization": f"Bearer {staff_token}"})
    assert r_low.json()["total"] == 1
    assert r_low.json()["items"][0]["sku"] == "MOU-002"

def test_update_product(client, admin_token):
    # Create product
    res = client.post(
        "/api/products",
        json={"product_name": "Old Name", "sku": "SKU-OLD", "price": 5.00, "quantity_in_stock": 10},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    pid = res.json()["id"]
    
    # Update details
    r_up = client.put(
        f"/api/products/{pid}",
        json={"product_name": "New Name", "price": 6.50},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r_up.status_code == 200
    data = r_up.json()
    assert data["product_name"] == "New Name"
    assert data["price"] == 6.50
    assert data["sku"] == "SKU-OLD" # should remain unchanged
