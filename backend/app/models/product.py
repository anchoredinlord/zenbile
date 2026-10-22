"""
app/models/product.py
─────────────────────
Database models for categories, products, and product images.

Three tables:

1. categories  — product categories managed by admin (e.g. Shoes, Clothing)
2. products    — individual items sellers list for sale
3. product_images — up to 5 photos per product

WHY store images in a separate table?
  A product can have multiple photos. Storing them in a separate table
  means we can add, remove, or reorder images independently without
  changing the product row. Each image row stores just the filename.

PRICE STORAGE:
  We store price as an Integer representing the smallest currency unit
  (Ethiopian Birr, no decimal). 15000 = 150.00 ETB.
  This avoids floating-point rounding errors in price calculations.
  The frontend divides by 100 to display "150.00 ETB".
"""

import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Text, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class ProductStatus(str, enum.Enum):
    """
    draft     → saved but not visible to customers yet
    active    → visible and available to buy
    out_of_stock → visible but cannot be ordered
    archived  → hidden by the seller, no longer for sale
    """
    draft        = "draft"
    active       = "active"
    out_of_stock = "out_of_stock"
    archived     = "archived"


class Category(Base):
    """
    Product categories managed by the admin.
    Examples: Shoes, Clothing, Bags, Electronics

    Table: categories
    """
    __tablename__ = "categories"

    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)

    # Optional description shown on the category page
    description = Column(Text, nullable=True)

    # Whether this category is visible on the storefront
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationship — lets us write category.products to get all products
    products = relationship("Product", back_populates="category")

    def __repr__(self):
        return f"<Category id={self.id} name={self.name}>"


class Product(Base):
    """
    A product listed by a seller.

    Table: products
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    # Which shop this product belongs to
    shop_id = Column(
        Integer,
        ForeignKey("shops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Which category this product belongs to
    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Product details
    name        = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Price in smallest currency unit (e.g. 15000 = 150.00 ETB)
    # Using Integer avoids floating-point issues
    price_cents = Column(Integer, nullable=False)

    # How many units are currently available
    stock_quantity = Column(Integer, nullable=False, default=0)

    # Product status
    status = Column(
        SAEnum(ProductStatus, name="product_status_enum"),
        nullable=False,
        default=ProductStatus.draft,
    )

    # Optional extra fields for clothing/shoes
    # e.g. "Red, Blue", "S, M, L, XL", "42, 43, 44"
    available_colors = Column(String(255), nullable=True)
    available_sizes  = Column(String(255), nullable=True)

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
    shop     = relationship("Shop", backref="products")
    category = relationship("Category", back_populates="products")
    images   = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.display_order",
    )

    def __repr__(self):
        return f"<Product id={self.id} name={self.name} price={self.price_cents}>"


class ProductImage(Base):
    """
    A photo belonging to a product.
    Each product can have up to 5 images.

    Table: product_images
    """
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Filename stored on disk, e.g. "abc123.jpg"
    # Full URL is built as: /uploads/products/abc123.jpg
    filename = Column(String(255), nullable=False)

    # 0 = main/cover photo, 1-4 = additional photos
    display_order = Column(Integer, nullable=False, default=0)

    uploaded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationship
    product = relationship("Product", back_populates="images")

    def __repr__(self):
        return f"<ProductImage id={self.id} product_id={self.product_id}>"
