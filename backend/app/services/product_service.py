"""
app/services/product_service.py
────────────────────────────────
Business logic for categories and products.
"""

import re
import uuid
import os
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status, UploadFile

from app.models.product import Category, Product, ProductImage, ProductStatus
from app.models.shop import Shop
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.config import settings


# ── Helpers ───────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def birr_to_cents(birr: float) -> int:
    """Convert 150.50 ETB → 15050 cents."""
    return round(birr * 100)


# ── Categories ────────────────────────────────────────────────────────────────

def create_category(db: Session, name: str, description: str | None) -> Category:
    """Admin creates a new category."""
    slug = slugify(name)

    # Check slug uniqueness
    existing = db.query(Category).filter(Category.slug == slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{name}' already exists",
        )

    category = Category(name=name.strip(), slug=slug, description=description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_all_categories(db: Session) -> list[Category]:
    """Return all active categories — used on the storefront."""
    return db.query(Category).filter(Category.is_active == True).order_by(Category.name).all()


def get_category_by_id(db: Session, category_id: int) -> Category | None:
    return db.query(Category).filter(Category.id == category_id).first()


def delete_category(db: Session, category_id: int) -> None:
    """
    Admin deletes a category.
    Products in this category will have category_id set to NULL
    because the foreign key is defined with ondelete='SET NULL'.
    They remain visible but uncategorized.
    """
    category = get_category_by_id(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    db.delete(category)
    db.commit()


# ── Products ──────────────────────────────────────────────────────────────────

def get_seller_shop(db: Session, user_id: int) -> Shop:
    """
    Get the approved shop for a seller user.
    Raises 403 if the seller is not approved yet.
    Raises 404 if no shop is found.
    """
    from app.models.shop import SellerProfile, SellerStatus
    profile = db.query(SellerProfile).filter(
        SellerProfile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller profile not found",
        )
    if profile.status != SellerStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your seller account must be approved before you can add products",
        )
    return profile.shop


def create_product(db: Session, shop_id: int, data: ProductCreate) -> Product:
    """Create a new product for a shop. Starts as draft."""

    # Validate category exists if provided
    if data.category_id:
        cat = get_category_by_id(db, data.category_id)
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with id {data.category_id} not found",
            )

    product = Product(
        shop_id=shop_id,
        category_id=data.category_id,
        name=data.name.strip(),
        description=data.description,
        price_cents=birr_to_cents(data.price),
        stock_quantity=data.stock_quantity,
        available_colors=data.available_colors,
        available_sizes=data.available_sizes,
        status=ProductStatus.draft,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_product_by_id(db: Session, product_id: int) -> Product | None:
    return db.query(Product).filter(Product.id == product_id).first()


def get_products_for_shop(db: Session, shop_id: int) -> list[Product]:
    """Get all products for a shop (seller's own view — includes drafts)."""
    return db.query(Product).filter(Product.shop_id == shop_id).order_by(
        Product.created_at.desc()
    ).all()


def update_product(db: Session, product: Product, data: ProductUpdate) -> Product:
    """Update a product. Only updates provided fields."""
    if data.name is not None:
        product.name = data.name.strip()
    if data.description is not None:
        product.description = data.description
    if data.price is not None:
        product.price_cents = birr_to_cents(data.price)
    if data.stock_quantity is not None:
        if data.stock_quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock quantity cannot be negative",
            )
        product.stock_quantity = data.stock_quantity
        # Auto-update status based on stock
        if data.stock_quantity == 0 and product.status == ProductStatus.active:
            product.status = ProductStatus.out_of_stock
        elif data.stock_quantity > 0 and product.status == ProductStatus.out_of_stock:
            product.status = ProductStatus.active
    if data.category_id is not None:
        product.category_id = data.category_id
    if data.available_colors is not None:
        product.available_colors = data.available_colors
    if data.available_sizes is not None:
        product.available_sizes = data.available_sizes
    if data.status is not None:
        product.status = data.status

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    """
    Delete a product and its images from database.
    Image files on disk are cleaned up separately.
    """
    # Delete image files from disk
    for image in product.images:
        filepath = os.path.join(settings.UPLOAD_DIR, image.filename)
        if os.path.exists(filepath):
            os.remove(filepath)

    db.delete(product)
    db.commit()


# ── Image uploads ─────────────────────────────────────────────────────────────

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGES_PER_PRODUCT = 5
MAX_FILE_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


async def save_product_image(
    db: Session,
    product: Product,
    file: UploadFile,
) -> ProductImage:
    """
    Validate and save an uploaded product image.

    Validation:
    - Must be jpg, jpeg, png, or webp
    - Max 5MB
    - Max 5 images per product

    The file is saved with a random UUID filename to prevent
    path traversal attacks and filename collisions.
    """
    # Check image count limit
    if len(product.images) >= MAX_IMAGES_PER_PRODUCT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_IMAGES_PER_PRODUCT} images per product",
        )

    # Validate file extension
    original_name = file.filename or "upload"
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Save with UUID filename (safe, no user-controlled paths)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    with open(filepath, "wb") as f:
        f.write(content)

    # Determine display order (0 = first/cover photo)
    next_order = len(product.images)

    image = ProductImage(
        product_id=product.id,
        filename=filename,
        display_order=next_order,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


def delete_product_image(db: Session, image: ProductImage) -> None:
    """Delete a product image from disk and database."""
    filepath = os.path.join(settings.UPLOAD_DIR, image.filename)
    if os.path.exists(filepath):
        os.remove(filepath)
    db.delete(image)
    db.commit()


# ── Public product listing ────────────────────────────────────────────────────

def get_public_products(
    db: Session,
    search: str | None = None,
    category_id: int | None = None,
    shop_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """
    Public product catalog with search and filtering.
    Only returns active products from APPROVED shops.
    """
    from app.models.shop import Shop, SellerProfile, SellerStatus

    query = db.query(Product).join(
        Shop, Product.shop_id == Shop.id
    ).join(
        SellerProfile, Shop.seller_id == SellerProfile.id
    ).filter(
        Product.status == ProductStatus.active,
        Product.stock_quantity > 0,
        Shop.is_active == True,
        SellerProfile.status == SellerStatus.approved,
    )

    if category_id:
        query = query.filter(Product.category_id == category_id)
    if shop_id:
        query = query.filter(Product.shop_id == shop_id)
    if min_price is not None:
        query = query.filter(Product.price_cents >= birr_to_cents(min_price))
    if max_price is not None:
        query = query.filter(Product.price_cents <= birr_to_cents(max_price))
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
            )
        )

    total    = query.count()
    offset   = (page - 1) * page_size
    products = query.order_by(Product.created_at.desc()).offset(offset).limit(page_size).all()

    return {"total": total, "page": page, "page_size": page_size, "products": products}
