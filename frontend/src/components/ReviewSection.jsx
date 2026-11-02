/**
 * ReviewSection.jsx
 * ──────────────────
 * Displays star ratings, review summary, and review form on the product page.
 *
 * Shows:
 * - Average star rating with visual stars
 * - Star breakdown bar chart (how many gave 5 stars, 4 stars, etc.)
 * - Individual review cards (name, stars, comment, date)
 * - Review form if the user is a verified buyer who hasn't reviewed yet
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { reviewsAPI } from '../utils/api'

// ── Star display component ─────────────────────────────────────────────────
function Stars({ rating, size = 'md', interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0)
  const sizes = { sm: 'text-sm', md: 'text-xl', lg: 'text-2xl' }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`${sizes[size]} transition-colors
            ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
            ${(hovered || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ── Rating bar (e.g. ████░░ 12 reviews for 5 stars) ──────────────────────
function RatingBar({ stars, count, total }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500 w-4 text-right">{stars}</span>
      <span className="text-yellow-400 text-xs">★</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-gray-400 w-6 text-right text-xs">{count}</span>
    </div>
  )
}

// ── Main ReviewSection component ───────────────────────────────────────────
export default function ReviewSection({ productId }) {
  const { isLoggedIn, user } = useAuth()

  const [summary, setSummary]         = useState(null)
  const [canReview, setCanReview]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)

  // Review form state
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')

  const loadReviews = async () => {
    try {
      const res = await reviewsAPI.getProductReviews(productId)
      setSummary(res.data)
    } catch {
      setSummary({ average_rating: 0, total_reviews: 0, star_counts: {}, reviews: [] })
    }
  }

  const loadCanReview = async () => {
    if (!isLoggedIn) return
    try {
      const res = await reviewsAPI.canReview(productId)
      setCanReview(res.data)
    } catch {
      setCanReview(null)
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([loadReviews(), loadCanReview()])
      setLoading(false)
    }
    init()
  }, [productId, isLoggedIn])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating'); return }
    setSubmitting(true)
    setError('')
    try {
      await reviewsAPI.submitReview(productId, { rating, comment: comment.trim() || null })
      setSuccess(true)
      setRating(0)
      setComment('')
      await loadReviews()
      await loadCanReview()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return
    try {
      await reviewsAPI.deleteReview(reviewId)
      await loadReviews()
      await loadCanReview()
      setSuccess(false)
    } catch {
      alert('Could not delete review')
    }
  }

  if (loading) return (
    <div className="py-8 text-center text-gray-400 text-sm">Loading reviews...</div>
  )

  const total = summary?.total_reviews || 0
  const avg   = summary?.average_rating || 0

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        Customer Reviews
      </h2>

      {/* ── Rating Summary ── */}
      {total > 0 ? (
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-8 flex-wrap">

            {/* Big average rating */}
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-800">{avg}</p>
              <Stars rating={Math.round(avg)} size="lg" />
              <p className="text-sm text-gray-400 mt-1">{total} review{total !== 1 ? 's' : ''}</p>
            </div>

            {/* Star breakdown bars */}
            <div className="flex-1 min-w-48 space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => (
                <RatingBar
                  key={star}
                  stars={star}
                  count={summary?.star_counts?.[star] || 0}
                  total={total}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 mb-6 text-center text-gray-400">
          <p className="text-3xl mb-2">⭐</p>
          <p className="font-medium text-gray-600">No reviews yet</p>
          <p className="text-sm mt-1">Be the first to review this product</p>
        </div>
      )}

      {/* ── Review Form ── */}
      {!isLoggedIn && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm text-gray-500 text-center">
          <a href="/login" className="text-primary-500 font-medium hover:underline">Sign in</a>
          {' '}to leave a review after receiving your order
        </div>
      )}

      {isLoggedIn && canReview?.can_review && !success && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Write a Review</h3>

          {/* Star rating picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <Stars rating={rating} size="lg" interactive onRate={setRating} />
            <p className="text-xs text-gray-400 mt-1">
              {rating === 0 && 'Click a star to rate'}
              {rating === 1 && '⭐ Poor'}
              {rating === 2 && '⭐⭐ Fair'}
              {rating === 3 && '⭐⭐⭐ Good'}
              {rating === 4 && '⭐⭐⭐⭐ Very Good'}
              {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="input-field"
              rows={3}
              maxLength={1000}
              placeholder="Share your experience with this product..."
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {comment.length}/1000
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="btn-primary px-6 py-2 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Already reviewed */}
      {isLoggedIn && canReview?.already_reviewed && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-700">
          ✓ You have already reviewed this product
        </div>
      )}

      {/* Not a buyer */}
      {isLoggedIn && canReview && !canReview.can_review && !canReview.already_reviewed && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm text-gray-500">
          You can review this product after purchasing and receiving it
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-700">
          ✓ Your review has been submitted. Thank you!
        </div>
      )}

      {/* ── Individual Reviews ── */}
      {total > 0 && (
        <div className="space-y-4">
          {summary.reviews.map(review => (
            <div key={review.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  {/* Reviewer name and stars */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center
                                    justify-center text-sm font-bold text-primary-600">
                      {review.customer_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {review.customer_name || 'Customer'}
                      </p>
                      <Stars rating={review.rating} size="sm" />
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                  {/* Delete button — only for the review author */}
                  {user?.id === review.customer_id && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-xs text-red-400 hover:text-red-600 mt-1">
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Review comment */}
              {review.comment && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed pl-10">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
