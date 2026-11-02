"""
app/models/review.py
─────────────────────
Database model for product reviews.

Business rules enforced here:
- One review per customer per product (unique constraint)
- Rating must be 1-5 (check constraint)
- Only customers with a completed order can review (enforced in service)
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, Text, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class Review(Base):
    """
    A product review left by a verified buyer.

    Table: reviews
    """
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    # Which product is being reviewed
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Who wrote the review
    customer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Star rating 1-5
    rating = Column(Integer, nullable=False)

    # Optional written comment
    comment = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Constraints ────────────────────────────────────────────────────────
    __table_args__ = (
        # One review per customer per product
        UniqueConstraint("product_id", "customer_id", name="uq_review_product_customer"),
        # Rating must be between 1 and 5
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating"),
    )

    # Relationships
    product  = relationship("Product", backref="reviews")
    customer = relationship("User",    backref="reviews")

    def __repr__(self):
        return f"<Review product={self.product_id} customer={self.customer_id} rating={self.rating}>"
