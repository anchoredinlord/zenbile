"""
app/schemas/order.py
────────────────────
Pydantic schemas for cart and order operations.
"""

from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Optional
from app.models.order import (
    OrderStatus, SellerOrderStatus, PaymentStatus, FulfillmentMethod
)


# ── Cart schemas ──────────────────────────────────────────────────────────────

class CartItemAdd(BaseModel):
    """Customer adds a product to their cart."""
    product_id: int
    quantity: int = 1

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class CartItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str = ""
    product_price: float = 0.0
    quantity: int
    subtotal: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class CartOut(BaseModel):
    id: int
    items: list[CartItemOut] = []
    total: float = 0.0
    item_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ── Checkout schemas ──────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    """Data the customer sends when placing an order."""
    customer_name: str
    customer_phone: Optional[str] = None
    delivery_address: Optional[str] = None
    customer_note: Optional[str] = None
    fulfillment_method: FulfillmentMethod = FulfillmentMethod.pickup

    @field_validator("customer_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Customer name is required")
        return v


# ── Order schemas ─────────────────────────────────────────────────────────────

class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: str
    unit_price_cents: int
    unit_price: float = 0.0
    quantity: int
    subtotal_cents: int
    subtotal: float = 0.0

    model_config = ConfigDict(from_attributes=True)

    def model_post_init(self, __context):
        self.unit_price = self.unit_price_cents / 100
        self.subtotal   = self.subtotal_cents / 100


class SellerOrderOut(BaseModel):
    id: int
    shop_id: Optional[int]
    shop_name: str = ""
    status: SellerOrderStatus
    fulfillment_method: FulfillmentMethod
    subtotal_cents: int
    subtotal: float = 0.0
    seller_note: Optional[str]
    items: list[OrderItemOut] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    def model_post_init(self, __context):
        self.subtotal = self.subtotal_cents / 100
        if self.shop_id and hasattr(self, '_shop'):
            self.shop_name = getattr(self, '_shop').name if self._shop else ""


class OrderOut(BaseModel):
    id: int
    reference: str
    status: OrderStatus
    payment_status: PaymentStatus
    total_cents: int
    total: float = 0.0
    customer_name: str
    customer_email: str
    customer_phone: Optional[str]
    delivery_address: Optional[str]
    customer_note: Optional[str]
    seller_orders: list[SellerOrderOut] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    def model_post_init(self, __context):
        self.total = self.total_cents / 100


# ── Seller order update ───────────────────────────────────────────────────────

class SellerOrderUpdate(BaseModel):
    """Seller updates the status of their portion of an order."""
    status: SellerOrderStatus
    seller_note: Optional[str] = None
