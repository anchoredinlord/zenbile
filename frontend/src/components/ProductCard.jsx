import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function ProductCard({ product }) {
  const { cart, addToCart, removeFromCart } = useCart()
  const { isLoggedIn } = useAuth()
  const [adding, setAdding]   = useState(false)
  const [removing, setRemoving] = useState(false)

  const imageUrl = product.images?.[0]
    ? `/uploads/products/${product.images[0].filename}`
    : null

  // Check if this product is already in the cart
  const cartItem = cart?.items?.find(item => item.product_id === product.id)
  const inCart   = !!cartItem

  const handleAddToCart = async (e) => {
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

  const handleRemoveFromCart = async (e) => {
    e.preventDefault()
    setRemoving(true)
    try {
      await removeFromCart(cartItem.id)
    } catch (err) {
      alert('Could not remove from cart')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Link to={`/products/${product.id}`}
      className="card group hover:shadow-md transition-shadow duration-200 flex flex-col">

      {/* Product image */}
      <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-5xl">👟</span>
          </div>
        )}

        {/* In cart badge */}
        {inCart && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            ✓ In cart ×{cartItem.quantity}
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
          {product.name}
        </h3>

        {product.available_sizes && (
          <p className="text-xs text-gray-400 mb-1">Sizes: {product.available_sizes}</p>
        )}

        <div className="mt-auto pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-primary-500">
              {product.price.toLocaleString()} ETB
            </span>
            <span className="text-xs text-gray-400">{product.stock_quantity} left</span>
          </div>

          {/* Cart buttons */}
          {product.stock_quantity > 0 ? (
            <div className="flex gap-1.5">
              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all
                  bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50">
                {adding ? '...' : inCart ? '+ Add More' : '+ Cart'}
              </button>

              {/* Remove from cart — only shown when item is in cart */}
              {inCart && (
                <button
                  onClick={handleRemoveFromCart}
                  disabled={removing}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all
                    bg-red-50 hover:bg-red-100 text-red-500 disabled:opacity-50"
                  title="Remove from cart">
                  {removing ? '...' : '✕'}
                </button>
              )}
            </div>
          ) : (
            <span className="block text-center text-xs text-gray-400 bg-gray-100 px-2 py-1.5 rounded-lg">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
