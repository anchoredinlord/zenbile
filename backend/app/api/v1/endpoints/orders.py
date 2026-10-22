"""
app/api/v1/endpoints/orders.py
───────────────────────────────
Cart and order endpoints.

Customer routes:
  GET    /api/v1/orders/cart              → view cart
  POST   /api/v1/orders/cart/items        → add item to cart
  DELETE /api/v1/orders/cart/items/{id}   → remove item from cart
  POST   /api/v1/orders/checkout          → place order
  GET    /api/v1/orders/my               → customer's order history
  GET    /api/v1/orders/my/{reference}   → view one order

Seller routes:
  GET  /api/v1/orders/seller             → seller's incoming orders
  PUT  /api/v1/orders/seller/{id}/status → update fulfillment status
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_active_user, require_seller
from app.models.user import User
from app.models.order import SellerOrderStatus
from app.schemas.order import (
    CartItemAdd, CartOut, CheckoutRequest,
    OrderOut, SellerOrderOut, SellerOrderUpdate,
)
from app.services.order_service import (
    add_to_cart, remove_from_cart, build_cart_response,
    get_or_create_cart, create_order,
    get_customer_orders, get_order_by_reference,
    get_seller_orders, update_seller_order_status,
)
from app.services.product_service import get_seller_shop

router = APIRouter()


# ── Cart endpoints ────────────────────────────────────────────────────────────

@router.get("/cart", summary="View your shopping cart")
def view_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns the current customer's cart with all items and total price."""
    cart = get_or_create_cart(db, current_user.id)
    return build_cart_response(cart)


@router.post(
    "/cart/items",
    summary="Add a product to your cart",
    status_code=status.HTTP_201_CREATED,
)
def add_item_to_cart(
    data: CartItemAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Add a product to the cart.
    If the product is already in the cart, quantity is increased.
    """
    cart = add_to_cart(db=db, customer_id=current_user.id, data=data)
    return build_cart_response(cart)


@router.delete(
    "/cart/items/{item_id}",
    summary="Remove an item from your cart",
)
def remove_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove one item from the cart by its cart item ID."""
    cart = remove_from_cart(db=db, customer_id=current_user.id, item_id=item_id)
    return build_cart_response(cart)


# ── Checkout ──────────────────────────────────────────────────────────────────

@router.post(
    "/checkout",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Place your order",
)
def checkout(
    data: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Convert the cart into a confirmed order.

    This endpoint:
    - Validates all products are still available
    - Deducts stock atomically (prevents overselling)
    - Creates one order with separate seller fulfillment records
    - Clears the cart on success

    The order starts with payment_status=unpaid.
    Payment is arranged separately with each seller.
    """
    order = create_order(db=db, customer=current_user, data=data)
    return order


# ── Customer order history ────────────────────────────────────────────────────

@router.get(
    "/my",
    response_model=list[OrderOut],
    summary="View your order history",
)
def my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns all orders placed by the logged-in customer, newest first."""
    return get_customer_orders(db, current_user.id)


@router.get(
    "/my/{reference}",
    response_model=OrderOut,
    summary="View a specific order",
)
def get_my_order(
    reference: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns full details of one order including all seller fulfillment records.
    Only the customer who placed the order can view it.
    """
    return get_order_by_reference(db, reference, current_user.id)


# ── Seller order management ───────────────────────────────────────────────────

@router.get(
    "/seller",
    response_model=list[SellerOrderOut],
    summary="[Seller] View incoming orders",
)
def seller_incoming_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    """
    Seller only. Returns all orders containing products from this seller's shop.
    Each record shows only the items belonging to this seller.
    """
    shop = get_seller_shop(db, current_user.id)
    return get_seller_orders(db, shop.id)


@router.put(
    "/seller/{seller_order_id}/status",
    response_model=SellerOrderOut,
    summary="[Seller] Update order fulfillment status",
)
def update_my_seller_order(
    seller_order_id: int,
    data: SellerOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    """
    Seller only. Update the status of your portion of an order.

    Typical flow:
      pending → confirmed → preparing → ready → completed

    If you cannot fulfill the order:
      pending → rejected
    """
    shop = get_seller_shop(db, current_user.id)
    return update_seller_order_status(
        db=db,
        seller_order_id=seller_order_id,
        shop_id=shop.id,
        new_status=data.status,
        seller_note=data.seller_note,
    )
