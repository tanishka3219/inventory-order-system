def test_create_order_success(client, admin_token):
    # 1. Create a product with stock = 10
    r_prod = client.post(
        "/api/products",
        json={"product_name": "Widget", "sku": "WIDG-001", "price": 10.00, "quantity_in_stock": 10},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    prod_id = r_prod.json()["id"]

    # 2. Create a customer
    r_cust = client.post(
        "/api/customers",
        json={"full_name": "Charlie Brown", "email": "charlie@test.com"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    cust_id = r_cust.json()["id"]

    # 3. Place order for 3 items
    r_order = client.post(
        "/api/orders",
        json={
            "customer_id": cust_id,
            "items": [
                {"product_id": prod_id, "quantity": 3}
            ]
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r_order.status_code == 201
    order_data = r_order.json()
    assert order_data["total_amount"] == 30.00
    assert order_data["order_status"] == "Completed"
    assert len(order_data["order_items"]) == 1
    assert order_data["order_items"][0]["quantity"] == 3

    # 4. Verify product stock is reduced to 7
    r_prod_verify = client.get(f"/api/products/{prod_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_prod_verify.json()["quantity_in_stock"] == 7

def test_create_order_insufficient_stock(client, admin_token):
    # 1. Create a product with stock = 5
    r_prod = client.post(
        "/api/products",
        json={"product_name": "Gizmo", "sku": "GIZ-002", "price": 15.00, "quantity_in_stock": 5},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    prod_id = r_prod.json()["id"]

    # 2. Create a customer
    r_cust = client.post(
        "/api/customers",
        json={"full_name": "Snoopy", "email": "snoopy@test.com"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    cust_id = r_cust.json()["id"]

    # 3. Place order for 7 items (stock is only 5!)
    r_order = client.post(
        "/api/orders",
        json={
            "customer_id": cust_id,
            "items": [
                {"product_id": prod_id, "quantity": 7}
            ]
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    # Business Rules say: Return status 400 and detail error.
    assert r_order.status_code == 400
    assert r_order.json()["detail"] == "Insufficient stock available"

    # 4. Verify stock remains 5
    r_prod_verify = client.get(f"/api/products/{prod_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_prod_verify.json()["quantity_in_stock"] == 5

def test_cancel_order_restores_stock(client, admin_token):
    # 1. Create product (stock = 10) & customer
    r_prod = client.post(
        "/api/products",
        json={"product_name": "Device", "sku": "DEV-003", "price": 100.00, "quantity_in_stock": 10},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    prod_id = r_prod.json()["id"]
    
    r_cust = client.post(
        "/api/customers",
        json={"full_name": "Linus", "email": "linus@test.com"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    cust_id = r_cust.json()["id"]

    # 2. Place order for 4 items
    r_order = client.post(
        "/api/orders",
        json={
            "customer_id": cust_id,
            "items": [{"product_id": prod_id, "quantity": 4}]
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    order_id = r_order.json()["id"]
    
    # Stock should be 6
    r_prod_verify1 = client.get(f"/api/products/{prod_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_prod_verify1.json()["quantity_in_stock"] == 6

    # 3. Cancel the order
    r_status = client.put(
        f"/api/orders/{order_id}/status",
        json={"status": "Cancelled"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r_status.status_code == 200
    assert r_status.json()["order_status"] == "Cancelled"

    # 4. Verify stock restored to 10
    r_prod_verify2 = client.get(f"/api/products/{prod_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_prod_verify2.json()["quantity_in_stock"] == 10
