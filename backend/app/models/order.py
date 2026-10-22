"""
app/models/order.py
───────────────────
Database models for shopping carts and orders.

FIVE tables:

1. carts       — one cart per customer (created automatically on first add)
2. cart_items  — individual products in a cart
3. orders      — the customer-facing order (one per checkout)
4. order_items — individual products within an order (price locked at purchase)
5. seller_orders — one record per seller involved in an order

WHY seller_orders?
  When a customer orders from 3 different shops in one checkout,
  we create 1 order but 3 seller_orders.
  Each seller sees only their own seller_order and fulfills it independently.
  The customer sees the overall order status plus each seller's status.

PRICE LOCKING:
  order_items stores the price AT THE TIME OF PURCHASE.
  If the seller later changes the price, old orders are unaffected.
  This is critical for trust and dispute resolution.

PAYMENT vs ORDER STATUS:
  order.payment_status tracks whether payment was received.
  seller_order.status tracks whether the seller fulfilled their part.
  These are intentionally separate — placing an order does NOT mean payment.
"""

import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Text, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class OrderStatus(str, enum.Enum):
    """
    Overall status of a customer's order.
    pending    → just placed, not yet confirmed by sellers
    confirmed  → all sellers confirmed availability
    partial    → some sellers confirmed, some rejected
    completed  → all seller orders fulfilled
    cancelled  → customer or system cancelled the order
    """
    pending   = "pending"
    confirmed = "confirmed"
    partial   = "partial"
    completed = "completed"
    cancelled = "cancelled"


class SellerOrderStatus(str, enum.Enum):
    """
    Status of one seller's fulfillment within an order.
    pending      → seller has not responded yet
    confirmed    → seller confirmed the item is available
    preparing    → seller is preparing the order
    ready        → ready for pickup or out for delivery
    completed    → customer received the item
    rejected     → seller rejected (out of stock, etc.)
    cancelled    → cancelled before fulfillment
    """
    pending   = "pending"
    confirmed = "confirmed"
    preparing = "preparing"
    ready     = "ready"
    completed = "completed"
    rejected  = "rejected"
    cancelled = "cancelled"


class PaymentStatus(str, enum.Enum):
    """
    Payment is tracked separately from order status.
    unpaid    → order placed but payment not received
    pending   → payment initiated but not confirmed
    paid      → payment confirmed
    refunded  → payment returned to customer
    """
    unpaid   = "unpaid"
    pending  = "pending"
    paid     = "paid"
    refunded = "refunded"


class FulfillmentMethod(str, enum.Enum):
    pickup   = "pickup"
    delivery = "delivery"


# ── Cart ──────────────────────────────────────────────────────────────────────

class Cart(Base):
    """
    Shopping cart — one per customer.
    Created automatically when the customer first adds a product.

    Table: carts
    """
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,   # One active cart per customer
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    items    = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan",
    )


class CartItem(Base):
    """
    One product in a customer's cart.

    Table: cart_items
    """
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)

    cart_id = Column(
        Integer,
        ForeignKey("carts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    quantity = Column(Integer, nullable=False, default=1)

    added_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    cart    = relationship("Cart", back_populates="items")
    product = relationship("Product")


# ── Order ─────────────────────────────────────────────────────────────────────

class Order(Base):
    """
    The customer-facing order created at checkout.
    One order per checkout, regardless of how many sellers are involved.

    Table: orders
    """
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Human-readable order reference e.g. "ZEN-20261022-0001"
    reference = Column(String(50), unique=True, nullable=False, index=True)

    status = Column(
        SAEnum(OrderStatus, name="order_status_enum"),
        nullable=False,
        default=OrderStatus.pending,
    )

    payment_status = Column(
        SAEnum(PaymentStatus, name="payment_status_enum"),
        nullable=False,
        default=PaymentStatus.unpaid,
    )

    # Total price in cents at time of order
    total_cents = Column(Integer, nullable=False)

    # Customer contact details (copied at order time in case account is deleted)
    customer_name  = Column(String(150), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(20),  nullable=True)

    # Delivery address (if applicable)
    delivery_address = Column(Text, nullable=True)

    # Optional note from the customer
    customer_note = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    customer      = relationship("User", foreign_keys=[customer_id])
    items         = relationship("OrderItem", back_populates="order",
                                 cascade="all, delete-orphan")
    seller_orders = relationship("SellerOrder", back_populates="order",
                                 cascade="all, delete-orphan")


class OrderItem(Base):
    """
    One product line within an order.
    Price and name are copied from the product AT ORDER TIME.
    This means the order history is always accurate even if
    the seller later changes prices.

    Table: order_items
    """
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,   # SET NULL if product is deleted — order history preserved
    )

    # Seller order this item belongs to
    seller_order_id = Column(
        Integer,
        ForeignKey("seller_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # LOCKED AT ORDER TIME — do not update these from product table later
    product_name  = Column(String(255), nullable=False)
    unit_price_cents = Column(Integer, nullable=False)
    quantity      = Column(Integer, nullable=False)
    subtotal_cents = Column(Integer, nullable=False)  # unit_price * quantity

    # Relationships
    order        = relationship("Order", back_populates="items")
    product      = relationship("Product")
    seller_order = relationship("SellerOrder", back_populates="items")


class SellerOrder(Base):
    """
    One seller's portion of a customer order.
    Each seller sees and manages only their own SellerOrder.

    Table: seller_orders
    """
    __tablename__ = "seller_orders"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    shop_id = Column(
        Integer,
        ForeignKey("shops.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    status = Column(
        SAEnum(SellerOrderStatus, name="seller_order_status_enum"),
        nullable=False,
        default=SellerOrderStatus.pending,
    )

    fulfillment_method = Column(
        SAEnum(FulfillmentMethod, name="fulfillment_method_enum"),
        nullable=False,
        default=FulfillmentMethod.pickup,
    )

    # Subtotal for this seller's items only (cents)
    subtotal_cents = Column(Integer, nullable=False)

    # Note from seller to customer
    seller_note = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    order = relationship("Order", back_populates="seller_orders")
    shop  = relationship("Shop")
    items = relationship("OrderItem", back_populates="seller_order")
