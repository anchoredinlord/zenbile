"""
app/api/v1/endpoints/sellers.py
────────────────────────────────
Endpoints for seller registration, shop management, and admin approval.

Routes:
  POST   /api/v1/sellers/register          → register as a seller
  GET    /api/v1/sellers/me                → seller sees their own profile
  PUT    /api/v1/sellers/me/shop           → seller updates their shop
  GET    /api/v1/sellers/shops/{slug}      → public shop page
  GET    /api/v1/sellers/admin/all         → admin sees all sellers
  PUT    /api/v1/sellers/admin/{id}/review → admin approves/rejects
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.core.deps import get_current_active_user, require_admin, require_seller
from app.models.user import User
from app.models.shop import SellerStatus, ShopType, SHOP_TYPE_LABELS
from app.schemas.shop import (
    SellerRegisterRequest,
    SellerRegisterResponse,
    SellerProfileOut,
    SellerReviewRequest,
    ShopOut,
    ShopUpdate,
    ShopTypeOut,
)
from app.services.seller_service import (
    register_seller,
    get_seller_profile,
    get_all_sellers,
    review_seller,
    get_shop_by_slug,
    update_shop,
    get_shops_by_type,
)

router = APIRouter()


# ── Public endpoints (no login needed) ───────────────────────────────────────

@router.get(
    "/shops/{slug}",
    response_model=ShopOut,
    summary="View a public shop page",
)
def public_shop_page(slug: str, db: Session = Depends(get_db)):
    """
    Returns a shop's public profile.
    Only approved and active shops are visible.
    """
    shop = get_shop_by_slug(db, slug)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )
    return shop


# ── Seller registration (no login needed) ────────────────────────────────────

@router.post(
    "/register",
    response_model=SellerRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register as a new seller",
)
def seller_register(
    data: SellerRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Register a new seller account with a shop.

    This creates:
    - A user account with role=seller
    - A seller profile with status=pending
    - A shop (hidden until admin approves)

    The seller must wait for admin approval before their shop goes live.
    """
    seller = register_seller(db=db, data=data)
    return SellerRegisterResponse(
        message="Registration successful. Please wait for admin approval before your shop goes live.",
        seller_id=seller.id,
        shop_slug=seller.shop.slug,
        status=seller.status,
    )


# ── Seller's own dashboard ────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=SellerProfileOut,
    summary="Get your seller profile and shop",
)
def get_my_seller_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    """
    Returns the logged-in seller's profile and shop information.
    Shows approval status so the seller knows if they are pending/approved.
    """
    seller = get_seller_profile(db, current_user.id)
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller profile not found",
        )
    return seller


@router.put(
    "/me/shop",
    response_model=ShopOut,
    summary="Update your shop details",
)
def update_my_shop(
    data: ShopUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    """
    Update the logged-in seller's shop name, description, phone, or location.
    Sellers can only update their own shop.
    """
    seller = get_seller_profile(db, current_user.id)
    if not seller or not seller.shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    # Only approved sellers can update their shop
    if seller.status != SellerStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your shop must be approved before you can update it",
        )

    shop = update_shop(
        db=db,
        shop=seller.shop,
        name=data.name,
        description=data.description,
        phone=data.phone,
        location=data.location,
        shop_type=data.shop_type,
    )
    return shop


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get(
    "/admin/all",
    response_model=list[SellerProfileOut],
    summary="[Admin] List all seller applications",
)
def admin_list_sellers(
    status: Optional[SellerStatus] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Admin only. List all seller profiles.
    Filter by status: pending, approved, rejected, suspended.

    Example: GET /api/v1/sellers/admin/all?status=pending
    """
    return get_all_sellers(db, status=status, skip=skip, limit=limit)


@router.put(
    "/admin/{seller_id}/review",
    response_model=SellerProfileOut,
    summary="[Admin] Approve, reject, or suspend a seller",
)
def admin_review_seller(
    seller_id: int,
    data: SellerReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Admin only. Approve, reject, or suspend a seller application.

    - approved  → shop becomes publicly visible
    - rejected  → seller is notified (shop stays hidden)
    - suspended → shop is hidden again
    """
    seller = review_seller(
        db=db,
        seller_id=seller_id,
        data=data,
        admin_user=current_user,
    )
    return seller


# ── Shop type endpoints ────────────────────────────────────────────────────────

@router.get(
    "/shop-types",
    response_model=list[ShopTypeOut],
    summary="List all available shop types",
)
def list_shop_types():
    """
    Public. Returns all available shop types with their labels and icons.
    Used to populate the shop type dropdown on the seller registration form.
    """
    return [
        ShopTypeOut(value=k, label=v["label"], icon=v["icon"])
        for k, v in SHOP_TYPE_LABELS.items()
    ]


@router.get(
    "/by-type/{shop_type}",
    response_model=list[ShopOut],
    summary="Get all approved shops of a specific type",
)
def shops_by_type(
    shop_type: ShopType,
    db: Session = Depends(get_db),
):
    """
    Public. Returns all active approved shops of the given type.
    Used on the homepage to show shops grouped by category.
    Example: GET /api/v1/sellers/by-type/shoes_footwear
    """
    return get_shops_by_type(db, shop_type)
