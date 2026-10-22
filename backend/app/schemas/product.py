"""
app/schemas/product.py
──────────────────────
Pydantic schemas for categories and products.

Price convention:
  API accepts and returns price in WHOLE BIRR (e.g. 150.50).
  Internally we store price_cents (15050) to avoid float errors.
  Conversion happens in the service layer.
"""

from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Optional
from app.models.product import ProductStatus


# ── Category schemas ──────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Category name cannot be empty")
        return v


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# ── Product Image schema ──────────────────────────────────────────────────────

class ProductImageOut(BaseModel):
    id: int
    filename: str
    display_order: int

    # Build the full URL from just the filename
    @property
    def url(self) -> str:
        return f"/uploads/products/{self.filename}"

    model_config = ConfigDict(from_attributes=True)


# ── Product schemas ───────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    """Data a seller sends when creating a new product."""
    name: str
    description: Optional[str] = None
    price: float                    # In whole Birr, e.g. 150.50
    stock_quantity: int = 0
    category_id: Optional[int] = None
    available_colors: Optional[str] = None
    available_sizes: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Product name cannot be empty")
        return v

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Price must be greater than zero")
        return v

    @field_validator("stock_quantity")
    @classmethod
    def stock_not_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Stock quantity cannot be negative")
        return v


class ProductUpdate(BaseModel):
    """Fields a seller can update on their product."""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    category_id: Optional[int] = None
    available_colors: Optional[str] = None
    available_sizes: Optional[str] = None
    status: Optional[ProductStatus] = None


class ProductOut(BaseModel):
    """Product data returned in API responses."""
    id: int
    shop_id: int
    category_id: Optional[int]
    name: str
    description: Optional[str]
    price_cents: int
    price: float = 0.0              # Computed from price_cents
    stock_quantity: int
    status: ProductStatus
    available_colors: Optional[str]
    available_sizes: Optional[str]
    images: list[ProductImageOut] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    def model_post_init(self, __context):
        # Convert stored cents back to Birr for display
        self.price = self.price_cents / 100


class ProductListOut(BaseModel):
    """Paginated product list response."""
    total: int
    page: int
    page_size: int
    products: list[ProductOut]
