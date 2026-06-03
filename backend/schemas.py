from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- Product Schemas ---
class ProductBase(BaseModel):
    product_name: str
    sku: str
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    quantity_in_stock: int = Field(..., ge=0)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Order Schemas ---
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemBase]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: float
    order_status: str
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

# --- Dashboard Schemas ---
class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductResponse]

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "Viewer"

class UserResponse(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
