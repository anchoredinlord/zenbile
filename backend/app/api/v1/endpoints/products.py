"""
app/api/v1/endpoints/products.py
──────────────────────────────────
Product and category endpoints.

Public routes (no login needed):
  GET  /api/v1/products/              → browse all active products
  GET  /api/v1/products/{id}          → view one product
  GET  /api/v1/products/categories    → list all categories

Seller routes (seller login required):
  POST   /api/v1/products/            → create a product
  PUT    /api/v1/products/{id}        → update your product
  DELETE /api/v1/products/{id}        → delete your product
  POST   /api/v1/products/{id}/images → upload a product image
  DELETE /api/v1/products/{id}/images/{image_id} → delete an image

Admin routes:
  POST   /api/v1/products/categories        → create a category
  DELETE /api/v1/products/categories/{id}   → delete a category
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.core.deps import get_current_active_user, require_seller, require_admin
from app.models.user import User
from app.models.product import ProductStatus
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductOut,
    ProductListOut, CategoryCreate, CategoryOut, ProductImageOut,
)
from app.services.product_service import (
    create_product, get_product_by_id, get_products_for_shop,
    update_product, delete_product, save_product_image,
    delete_product_image, get_public_products,
    create_category, get_all_categories, get_seller_shop,
    delete_category,
)

router = APIRouter()


# ── Category endpoints ────────────────────────────────────────────────────────

@router.get(
    "/categories",
    response_model=list[CategoryOut],
    summary="List all product categories",
)
def list_categories(db: Session = Depends(get_db)):
    """Public. Returns all active categories for the storefront."""
    return get_all_categories(db)


@router.post(
    "/categories",
    response_model=CategoryOut,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Create a product category",
)
def admin_create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin only. Create a new product category."""
    return create_category(db, name=data.name, description=data.description)


@router.delete(
    "/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Delete a category",
)
def admin_delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Admin only. Delete a category.
    Products in this category become uncategorized — they are not deleted.
    """
    delete_category(db, category_id)


# ── Public product browsing ───────────────────────────────────────────────────

@router.get(
    "/",
    response_model=ProductListOut,
    summary="Browse all products",
)
def browse_products(
    search: Optional[str] = Query(None, description="Search by name or description"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    shop_id: Optional[int] = Query(None, description="Filter by shop"),
    min_price: Optional[float] = Query(None, description="Minimum price in ETB"),
    max_price: Optional[float] = Query(None, description="Maximum price in ETB"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Products per page"),
    db: Session = Depends(get_db),
):
    """
    Public product catalog. Supports search and filtering.

    Examples:
      GET /api/v1/products/?search=shoes
      GET /api/v1/products/?category_id=1&min_price=100&max_price=500
      GET /api/v1/products/?shop_id=1&page=2
    """
    return get_public_products(
        db=db,
        search=search,
        category_id=category_id,
        shop_id=shop_id,
        min_price=min_price,
        max_price=max_price,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{product_id}",
    response_model=ProductOut,
    summary="View a single product",
)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Public. Returns a single product's details.
    Only returns active products.
    """
    product = get_product_by_id(db, product_id)
    if not product or product.status not in (
        ProductStatus.active, ProductStatus.out_of_stock
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


# ── Seller product management ─────────────────────────────────────────────────

@router.get(
    "/my/products",
    response_model=list[ProductOut],
    summary="[Seller] List your own products",
)
def my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    """
    Seller only. Returns all products for the logged-in seller's shop.
    Includes drafts and archived products (unlike the public view).
    """
    shop = get_seller_shop(db, current_user.id)
    return get_products_for_shop(db, shop.id)


@router.post(
    "/",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
    summary="[Seller] Create a new product",
)
def create_new_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    """
    Seller only. Create a new product listing.
    Product starts as 'draft' — set status to 'active' when ready to sell.
    """
    shop = get_seller_shop(db, current_user.id)
    return create_product(db=db, shop_id=shop.id, data=data)


@router.put(
    "/{product_id}",
    response_model=ProductOut,
    summary="[Seller] Update your product",
)
def update_my_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    """
    Seller only. Update a product you own.
    You cannot edit another seller's products.
    """
    shop = get_seller_shop(db, current_user.id)
    product = get_product_by_id(db, product_id)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # SECURITY: verify this product belongs to the seller's shop
    if product.shop_id != shop.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this product",
        )

    return update_product(db=db, product=product, data=data)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Seller] Delete your product",
)
def delete_my_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    """
    Seller only. Permanently delete a product and all its images.
    """
    shop = get_seller_shop(db, current_user.id)
    product = get_product_by_id(db, product_id)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.shop_id != shop.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this product",
        )

    delete_product(db=db, product=product)


# ── Image upload ──────────────────────────────────────────────────────────────

@router.post(
    "/{product_id}/images",
    response_model=ProductImageOut,
    status_code=status.HTTP_201_CREATED,
    summary="[Seller] Upload a product image",
)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(..., description="Image file (jpg, png, webp, max 5MB)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    """
    Seller only. Upload an image for your product.
    Max 5 images per product. Allowed types: jpg, jpeg, png, webp.
    """
    shop = get_seller_shop(db, current_user.id)
    product = get_product_by_id(db, product_id)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.shop_id != shop.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to upload images for this product",
        )

    return await save_product_image(db=db, product=product, file=file)


@router.delete(
    "/{product_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Seller] Delete a product image",
)
def remove_product_image(
    product_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    """Seller only. Delete one image from your product."""
    shop = get_seller_shop(db, current_user.id)
    product = get_product_by_id(db, product_id)

    if not product or product.shop_id != shop.id:
        raise HTTPException(status_code=404, detail="Product not found")

    image = next((img for img in product.images if img.id == image_id), None)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    delete_product_image(db=db, image=image)
