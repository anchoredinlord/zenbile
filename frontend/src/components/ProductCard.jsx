import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function ProductCard({ product }) {
  const { cart, addToCart, removeFromCart } = useCart()
  const { isLoggedIn } = useAuth()
  const [adding, setAdding]     = useState(false)
  const [removing, setRemoving] = useState(false)

  const imageUrl = product.images?.[0]
    ? `/uploads/products/${product.images[0].filename}`
    : null

  const cartItem = cart?.items?.find(item => item.product_id === product.id)
  const inCart   = !!cartItem

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) { window.location.href = '/login'; return }
    setAdding(true)
    try {
      await addToCart(product.id, 1)
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not add to cart')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (e) => {
    e.preventDefault()
    setRemoving(true)
    try { await removeFromCart(cartItem.id) }
    catch { alert('Could not remove from cart') }
    finally { setRemoving(false) }
  }

  return (
    <Link to={`/products/${product.id}`}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden
                 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                 flex flex-col group">

      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* In-cart badge */}
        {inCart && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs
                          font-bold px-2 py-0.5 rounded-full shadow-sm">
            ✓ {cartItem.quantity} in cart
          </div>
        )}

        {/* Out of stock overlay */}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">

        {/* Product name */}
        <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1 line-clamp-2 flex-1">
          {product.name}
        </h3>

        {/* Sizes hint */}
        {product.available_sizes && (
          <p className="text-xs text-gray-400 mb-2 truncate">
            Sizes: {product.available_sizes}
          </p>
        )}

        {/* Rating if exists */}
        {product.avg_rating > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <svg key={s} className={`w-3 h-3 ${s <= Math.round(product.avg_rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                  fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-400">({product.review_count})</span>
          </div>
        )}

        {/* Price and cart button */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <div>
            <span className="text-base font-bold text-primary-500">
              {product.price?.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 ml-0.5">ETB</span>
          </div>

          {product.stock_quantity > 0 ? (
            <div className="flex gap-1">
              <button onClick={handleAdd} disabled={adding}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all
                  ${inCart
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                  } disabled:opacity-50`}>
                {adding ? '...' : inCart ? '+ More' : 'Add'}
              </button>
              {inCart && (
                <button onClick={handleRemove} disabled={removing}
                  className="text-xs px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100
                             text-red-500 transition-all disabled:opacity-50"
                  title="Remove from cart">
                  {removing ? '...' : '×'}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
