"""
app/schemas/review.py
──────────────────────
Pydantic schemas for product reviews.
"""

from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Optional


class ReviewCreate(BaseModel):
    """Data a customer sends when writing a review."""
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_must_be_valid(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5")
        return v

    @field_validator("comment")
    @classmethod
    def comment_not_too_long(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v.strip()) > 1000:
            raise ValueError("Comment cannot exceed 1000 characters")
        return v.strip() if v else v


class ReviewOut(BaseModel):
    """Review data returned in API responses."""
    id: int
    product_id: int
    customer_id: int
    customer_name: str = ""   # filled from relationship
    rating: int
    comment: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    def model_post_init(self, __context):
        # Pull the customer's name from the relationship
        if hasattr(self, 'customer') and self.customer:
            self.customer_name = self.customer.full_name


class ProductRatingSummary(BaseModel):
    """
    Summary of all reviews for one product.
    Shown at the top of the product detail page.
    """
    average_rating: float       # e.g. 4.2
    total_reviews: int          # e.g. 27
    star_counts: dict           # { "5": 12, "4": 8, "3": 4, "2": 2, "1": 1 }
    reviews: list[ReviewOut]    # all individual reviews
