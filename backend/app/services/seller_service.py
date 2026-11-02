"""
app/services/seller_service.py
───────────────────────────────
Business logic for seller registration and admin approval.
"""

import re
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.models.shop import SellerProfile, Shop, SellerStatus
from app.schemas.shop import SellerRegisterRequest, SellerReviewRequest
from app.services.user_service import create_user, get_user_by_email
from app.schemas.user import UserCreate


def slugify(text: str) -> str:
    """
    Convert a shop name into a URL-friendly slug.
    Example: "Abebe's Shoes & Bags" → "abebes-shoes-bags"

    Rules:
    - Lowercase everything
    - Replace spaces and special characters with hyphens
    - Remove consecutive hyphens
    - Strip leading/trailing hyphens
    """
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)   # remove non-word chars except hyphens
    text = re.sub(r"[\s_]+", "-", text)     # spaces/underscores → hyphens
    text = re.sub(r"-+", "-", text)         # collapse multiple hyphens
    return text.strip("-")


def make_unique_slug(db: Session, base_slug: str) -> str:
    """
    Ensure the slug is unique in the database.
    If "abebes-shoes" is taken, try "abebes-shoes-2", "abebes-shoes-3", etc.
    """
    slug = base_slug
    counter = 2
    while db.query(Shop).filter(Shop.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


def register_seller(db: Session, data: SellerRegisterRequest) -> SellerProfile:
    """
    Register a new seller account with their shop.

    This does three things in one transaction:
    1. Creates a User with role=seller
    2. Creates a SellerProfile with status=pending
    3. Creates a Shop linked to the seller profile

    The seller cannot sell publicly until an admin approves them.

    Raises:
        HTTP 409 if the email is already registered.
    """
    # Step 1 — Create the user account
    user_data = UserCreate(
        email=data.email,
        password=data.password,
        full_name=data.full_name,
        phone=data.phone,
    )
    user = create_user(db=db, data=user_data, role=UserRole.seller)

    # Step 2 — Create the seller profile (status = pending by default)
    seller_profile = SellerProfile(user_id=user.id)
    db.add(seller_profile)
    db.flush()  # flush so seller_profile.id is available before creating shop

    # Step 3 — Create the shop
    base_slug = slugify(data.shop_name)
    slug = make_unique_slug(db, base_slug)

    shop = Shop(
        seller_id=seller_profile.id,
        name=data.shop_name.strip(),
        slug=slug,
        description=data.shop_description,
        phone=data.shop_phone or data.phone,
        location=data.shop_location,
        shop_type=data.shop_type,
        is_active=False,  # Not visible until approved
    )
    db.add(shop)
    db.commit()
    db.refresh(seller_profile)
    return seller_profile


def get_seller_profile(db: Session, user_id: int) -> SellerProfile | None:
    """Get a seller profile by user ID."""
    return db.query(SellerProfile).filter(
        SellerProfile.user_id == user_id
    ).first()


def get_seller_by_id(db: Session, seller_id: int) -> SellerProfile | None:
    """Get a seller profile by its own ID."""
    return db.query(SellerProfile).filter(
        SellerProfile.id == seller_id
    ).first()


def get_all_sellers(
    db: Session,
    status: SellerStatus | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[SellerProfile]:
    """
    Get all seller profiles, optionally filtered by status.
    Used by the admin dashboard to review applications.
    """
    query = db.query(SellerProfile)
    if status:
        query = query.filter(SellerProfile.status == status)
    return query.offset(skip).limit(limit).all()


def review_seller(
    db: Session,
    seller_id: int,
    data: SellerReviewRequest,
    admin_user: User,
) -> SellerProfile:
    """
    Admin approves, rejects, or suspends a seller.

    When approved  → seller's shop becomes visible (is_active=True)
    When rejected  → shop stays hidden
    When suspended → shop is hidden again
    """
    seller = get_seller_by_id(db, seller_id)
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found",
        )

    # Update the seller profile
    seller.status     = data.status
    seller.admin_note = data.admin_note
    seller.reviewed_by = admin_user.id
    seller.reviewed_at = datetime.now(timezone.utc)

    # Update shop visibility based on approval decision
    if seller.shop:
        seller.shop.is_active = (data.status == SellerStatus.approved)

    db.commit()
    db.refresh(seller)
    return seller


def get_shop_by_slug(db: Session, slug: str) -> Shop | None:
    """Get a public shop by its slug. Used for public shop pages."""
    return db.query(Shop).filter(
        Shop.slug == slug,
        Shop.is_active == True,
    ).first()


def update_shop(
    db: Session,
    shop: Shop,
    name: str | None,
    description: str | None,
    phone: str | None,
    location: str | None,
    shop_type=None,
) -> Shop:
    """Update a seller's own shop details."""
    if name is not None:
        shop.name = name.strip()
    if description is not None:
        shop.description = description
    if phone is not None:
        shop.phone = phone
    if location is not None:
        shop.location = location
    if shop_type is not None:
        shop.shop_type = shop_type

    db.commit()
    db.refresh(shop)
    return shop


def get_shops_by_type(db: Session, shop_type) -> list[Shop]:
    """
    Get all active approved shops of a given type.
    Used on the homepage to group shops by type.
    """
    from app.models.shop import SellerStatus
    return db.query(Shop).join(
        SellerProfile, Shop.seller_id == SellerProfile.id
    ).filter(
        Shop.shop_type   == shop_type,
        Shop.is_active   == True,
        SellerProfile.status == SellerStatus.approved,
    ).all()
