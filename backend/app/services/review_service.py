"""
app/services/review_service.py
───────────────────────────────
Business logic for product reviews.

Key rule: only verified buyers can review.
We check that:
1. The customer has an order containing the product
2. That seller order has status = completed
3. The customer has not already reviewed this product
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.review import Review
from app.models.order import Order, OrderItem, SellerOrder, SellerOrderStatus
from app.models.user import User
from app.schemas.review import ReviewCreate


def check_verified_buyer(db: Session, customer_id: int, product_id: int) -> bool:
    """
    Check if a customer has actually bought and received this product.

    We look for:
    - An order item matching the product AND the customer
    - Where the seller order status is 'completed'

    Returns True if they are a verified buyer, False otherwise.
    """
    result = db.query(OrderItem).join(
        Order, OrderItem.order_id == Order.id
    ).join(
        SellerOrder, OrderItem.seller_order_id == SellerOrder.id
    ).filter(
        Order.customer_id    == customer_id,
        OrderItem.product_id == product_id,
        SellerOrder.status   == SellerOrderStatus.completed,
    ).first()

    return result is not None


def create_review(
    db: Session,
    product_id: int,
    customer: User,
    data: ReviewCreate,
) -> Review:
    """
    Create a new review for a product.

    Validates:
    1. Customer must be a verified buyer
    2. Customer has not already reviewed this product
    """
    # Check they actually bought and received it
    if not check_verified_buyer(db, customer.id, product_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review products you have purchased and received",
        )

    # Check they haven't already reviewed it
    existing = db.query(Review).filter(
        Review.product_id  == product_id,
        Review.customer_id == customer.id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this product",
        )

    review = Review(
        product_id  = product_id,
        customer_id = customer.id,
        rating      = data.rating,
        comment     = data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def get_product_reviews(db: Session, product_id: int) -> dict:
    """
    Get all reviews for a product plus a rating summary.

    Returns:
        average_rating: float
        total_reviews:  int
        star_counts:    dict  {1: n, 2: n, 3: n, 4: n, 5: n}
        reviews:        list of Review objects
    """
    reviews = db.query(Review).filter(
        Review.product_id == product_id
    ).order_by(Review.created_at.desc()).all()

    total = len(reviews)

    if total == 0:
        return {
            "average_rating": 0.0,
            "total_reviews":  0,
            "star_counts":    {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "reviews":        [],
        }

    # Calculate average and per-star counts
    total_stars  = sum(r.rating for r in reviews)
    average      = round(total_stars / total, 1)
    star_counts  = {i: 0 for i in range(1, 6)}
    for r in reviews:
        star_counts[r.rating] += 1

    return {
        "average_rating": average,
        "total_reviews":  total,
        "star_counts":    star_counts,
        "reviews":        reviews,
    }


def can_user_review(db: Session, customer_id: int, product_id: int) -> dict:
    """
    Check if a user can review a product.
    Used by the frontend to show/hide the review form.

    Returns:
        can_review:      bool
        already_reviewed: bool
        reason:          str (explanation)
    """
    already = db.query(Review).filter(
        Review.product_id  == product_id,
        Review.customer_id == customer_id,
    ).first()

    if already:
        return {
            "can_review":        False,
            "already_reviewed":  True,
            "reason": "You have already reviewed this product",
        }

    is_buyer = check_verified_buyer(db, customer_id, product_id)
    if not is_buyer:
        return {
            "can_review":        False,
            "already_reviewed":  False,
            "reason": "You can only review products you have purchased and received",
        }

    return {
        "can_review":        True,
        "already_reviewed":  False,
        "reason": "",
    }


def delete_review(db: Session, review_id: int, customer_id: int) -> None:
    """
    Delete a review. Only the author can delete their own review.
    """
    review = db.query(Review).filter(
        Review.id          == review_id,
        Review.customer_id == customer_id,
    ).first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    db.delete(review)
    db.commit()
