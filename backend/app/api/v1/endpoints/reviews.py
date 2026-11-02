"""
app/api/v1/endpoints/reviews.py
────────────────────────────────
Product review endpoints.

Public routes:
  GET  /api/v1/reviews/products/{id}          → get all reviews for a product
  GET  /api/v1/reviews/products/{id}/can-review → check if logged-in user can review

Customer routes (login required):
  POST   /api/v1/reviews/products/{id}        → submit a review
  DELETE /api/v1/reviews/{review_id}          → delete your own review
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut, ProductRatingSummary
from app.services.review_service import (
    create_review, get_product_reviews,
    can_user_review, delete_review,
)

router = APIRouter()


@router.get(
    "/products/{product_id}",
    response_model=ProductRatingSummary,
    summary="Get all reviews for a product",
)
def get_reviews(product_id: int, db: Session = Depends(get_db)):
    """
    Public. Returns all reviews and rating summary for a product.
    Shown on the product detail page.
    """
    data = get_product_reviews(db, product_id)
    return ProductRatingSummary(**data)


@router.get(
    "/products/{product_id}/can-review",
    summary="Check if the current user can review this product",
)
def check_can_review(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns whether the logged-in customer can review this product.
    Used by the frontend to show or hide the review form.
    """
    return can_user_review(db, current_user.id, product_id)


@router.post(
    "/products/{product_id}",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a product review",
)
def submit_review(
    product_id: int,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Submit a star rating and optional comment for a product.
    You must have purchased and received this product to review it.
    You can only review each product once.
    """
    review = create_review(
        db         = db,
        product_id = product_id,
        customer   = current_user,
        data       = data,
    )
    return review


@router.delete(
    "/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete your review",
)
def remove_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a review you wrote. You can only delete your own reviews."""
    delete_review(db, review_id, current_user.id)
