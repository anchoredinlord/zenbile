"""
app/services/order_service.py
──────────────────────────────
Business logic for cart management and order processing.

The most critical part of this file is create_order().
It uses a database transaction to ensure that either:
  - ALL stock deductions succeed and the order is created, OR
  - NOTHING changes (if any product is out of stock)

This prevents overselling — two customers cannot both buy the last item.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.order import (
    Cart, CartItem, Order, OrderItem, SellerOrder,
    OrderStatus, SellerOrderStatus, PaymentStatus,
)
from app.models.product import Product, ProductStatus
from app.models.shop import Shop
from app.models.user import User
from app.schemas.order import CartItemAdd, CheckoutRequest


# ── Reference number generator ────────────────────────────────────────────────

def generate_order_reference() -> str:
    """
    Generate a human-readable order reference like ZEN-20261022-A3F2.
    Used on receipts and for customer support queries.
    """
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    unique = uuid.uuid4().hex[:4].upper()
    return f"ZEN-{today}-{unique}"


# ── Cart operations ───────────────────────────────────────────────────────────

def get_or_create_cart(db: Session, customer_id: int) -> Cart:
    """
    Get the customer's existing cart, or create one if they don't have one.
    Every customer has exactly one active cart.
    """
    cart = db.query(Cart).filter(Cart.customer_id == customer_id).first()
    if not cart:
        cart = Cart(customer_id=customer_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def add_to_cart(db: Session, customer_id: int, data: CartItemAdd) -> Cart:
    """
    Add a product to the customer's cart.

    Rules:
    - Product must be active and in stock
    - If the product is already in the cart, update the quantity
    - Quantity cannot exceed available stock
    """
    # Validate the product
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product or product.status != ProductStatus.active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or not available",
        )
    if product.stock_quantity < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This product is out of stock",
        )

    cart = get_or_create_cart(db, customer_id)

    # Check if product is already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == data.product_id,
    ).first()

    if existing_item:
        # Update quantity
        new_quantity = existing_item.quantity + data.quantity
        if new_quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {product.stock_quantity} units available",
            )
        existing_item.quantity = new_quantity
    else:
        # Add new item
        if data.quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {product.stock_quantity} units available",
            )
        item = CartItem(
            cart_id=cart.id,
            product_id=data.product_id,
            quantity=data.quantity,
        )
        db.add(item)

    db.commit()
    db.refresh(cart)
    return cart


def remove_from_cart(db: Session, customer_id: int, item_id: int) -> Cart:
    """Remove one item from the cart."""
    cart = get_or_create_cart(db, customer_id)
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    db.delete(item)
    db.commit()
    db.refresh(cart)
    return cart


def clear_cart(db: Session, customer_id: int) -> None:
    """Remove all items from the cart (called after successful checkout)."""
    cart = db.query(Cart).filter(Cart.customer_id == customer_id).first()
    if cart:
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()


def build_cart_response(cart: Cart) -> dict:
    """
    Build a cart response with computed totals.
    We compute totals here rather than storing them, so they're always
    accurate even if a seller changes prices.
    """
    items_out = []
    total_cents = 0

    for item in cart.items:
        if item.product:
            subtotal = item.product.price_cents * item.quantity
            total_cents += subtotal
            items_out.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name,
                "product_price": item.product.price_cents / 100,
                "quantity": item.quantity,
                "subtotal": subtotal / 100,
            })

    return {
        "id": cart.id,
        "items": items_out,
        "total": total_cents / 100,
        "item_count": len(items_out),
    }


# ── Order creation ────────────────────────────────────────────────────────────

def create_order(
    db: Session,
    customer: User,
    data: CheckoutRequest,
) -> Order:
    """
    Convert the customer's cart into a confirmed order.

    This is the most important function in the whole marketplace.
    It runs inside a database transaction. If ANYTHING fails
    (product unavailable, stock too low), the entire operation
    rolls back — no partial orders, no overselling.

    Steps:
    1. Load the customer's cart and validate it's not empty
    2. Validate each product is still active and has enough stock
    3. Deduct stock for each product
    4. Group items by shop to create seller_orders
    5. Create the main Order and all related records
    6. Clear the cart
    """
    cart = db.query(Cart).filter(Cart.customer_id == customer.id).first()

    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty",
        )

    # ── Validate all products before changing anything ────────────────────────
    validated_items = []
    for cart_item in cart.items:
        product = db.query(Product).filter(
            Product.id == cart_item.product_id
        ).with_for_update().first()  # Lock the row to prevent race conditions

        if not product or product.status != ProductStatus.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{product.name if product else 'A product'}' is no longer available",
            )
        if product.stock_quantity < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {product.stock_quantity} units of '{product.name}' are available",
            )
        validated_items.append((cart_item, product))

    # ── Deduct stock and group by shop ────────────────────────────────────────
    shop_items: dict[int, list[tuple]] = {}  # shop_id → [(cart_item, product)]

    for cart_item, product in validated_items:
        product.stock_quantity -= cart_item.quantity
        if product.stock_quantity == 0:
            product.status = ProductStatus.out_of_stock

        shop_id = product.shop_id
        if shop_id not in shop_items:
            shop_items[shop_id] = []
        shop_items[shop_id].append((cart_item, product))

    # ── Calculate total ───────────────────────────────────────────────────────
    total_cents = sum(
        p.price_cents * ci.quantity
        for ci, p in validated_items
    )

    # ── Create the main order ─────────────────────────────────────────────────
    order = Order(
        customer_id=customer.id,
        reference=generate_order_reference(),
        status=OrderStatus.pending,
        payment_status=PaymentStatus.unpaid,
        total_cents=total_cents,
        customer_name=data.customer_name,
        customer_email=customer.email,
        customer_phone=data.customer_phone or customer.phone,
        delivery_address=data.delivery_address,
        customer_note=data.customer_note,
    )
    db.add(order)
    db.flush()  # Get order.id without committing

    # ── Create seller orders and order items ──────────────────────────────────
    for shop_id, items in shop_items.items():
        seller_subtotal = sum(
            p.price_cents * ci.quantity for ci, p in items
        )

        seller_order = SellerOrder(
            order_id=order.id,
            shop_id=shop_id,
            status=SellerOrderStatus.pending,
            fulfillment_method=data.fulfillment_method,
            subtotal_cents=seller_subtotal,
        )
        db.add(seller_order)
        db.flush()  # Get seller_order.id

        for cart_item, product in items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                seller_order_id=seller_order.id,
                product_name=product.name,        # LOCKED at purchase time
                unit_price_cents=product.price_cents,  # LOCKED at purchase time
                quantity=cart_item.quantity,
                subtotal_cents=product.price_cents * cart_item.quantity,
            )
            db.add(order_item)

    # ── Commit everything at once ─────────────────────────────────────────────
    db.commit()
    db.refresh(order)

    # ── Clear the cart ────────────────────────────────────────────────────────
    clear_cart(db, customer.id)

    return order


# ── Order retrieval ───────────────────────────────────────────────────────────

def get_order_by_reference(db: Session, reference: str, customer_id: int) -> Order:
    """Get a customer's order by reference number."""
    order = db.query(Order).filter(
        Order.reference == reference,
        Order.customer_id == customer_id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def get_customer_orders(db: Session, customer_id: int) -> list[Order]:
    """Get all orders for a customer, newest first."""
    return db.query(Order).filter(
        Order.customer_id == customer_id
    ).order_by(Order.created_at.desc()).all()


def get_seller_orders(db: Session, shop_id: int) -> list[SellerOrder]:
    """Get all seller orders for a shop, newest first."""
    return db.query(SellerOrder).filter(
        SellerOrder.shop_id == shop_id
    ).order_by(SellerOrder.created_at.desc()).all()


def update_seller_order_status(
    db: Session,
    seller_order_id: int,
    shop_id: int,
    new_status: SellerOrderStatus,
    seller_note: str | None,
) -> SellerOrder:
    """
    Seller updates their fulfillment status.
    Validates that the seller_order belongs to their shop.
    """
    seller_order = db.query(SellerOrder).filter(
        SellerOrder.id == seller_order_id,
        SellerOrder.shop_id == shop_id,
    ).first()

    if not seller_order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    seller_order.status = new_status
    if seller_note is not None:
        seller_order.seller_note = seller_note

    # Update the parent order status based on all seller orders
    _update_parent_order_status(db, seller_order.order)

    db.commit()
    db.refresh(seller_order)
    return seller_order


def _update_parent_order_status(db: Session, order: Order) -> None:
    """
    Automatically update the parent Order status based on seller order statuses.
    Called whenever a seller updates their status.
    """
    statuses = {so.status for so in order.seller_orders}

    if all(s == SellerOrderStatus.completed for s in statuses):
        order.status = OrderStatus.completed
    elif all(s == SellerOrderStatus.rejected for s in statuses):
        order.status = OrderStatus.cancelled
    elif SellerOrderStatus.completed in statuses or SellerOrderStatus.confirmed in statuses:
        order.status = OrderStatus.partial
    elif all(s == SellerOrderStatus.confirmed for s in statuses):
        order.status = OrderStatus.confirmed
