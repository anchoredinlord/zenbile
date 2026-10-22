import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { isLoggedIn } = useAuth()
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const imageUrl = product.images?.[0]
    ? `/uploads/products/${product.images[0].filename}`
    : null

  const handleAddToCart = async (e) => {
    e.preventDefault() // Don't navigate to product page
    if (!isLoggedIn) { window.location.href = '/login'; return }
    setAdding(true)
    try {
      await addToCart(product.id, 1)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not add to cart')
    } finally {
      setAdding(false)
    }
  }

  return (
    <Link to={`/products/${product.id}`} className="card group hover:shadow-md transition-shadow duration-200 flex flex-col">

      {/* Product image */}
      <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden">
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
      </div>

      {/* Product info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-1 truncate">
          {product.category_id ? '📦 ' : ''}Category
        </p>
        <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
          {product.name}
        </h3>

        {/* Sizes/Colors */}
        {product.available_sizes && (
          <p className="text-xs text-gray-400 mb-1">Sizes: {product.available_sizes}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary-500">
              {product.price.toLocaleString()} ETB
            </span>
            <p className="text-xs text-gray-400">{product.stock_quantity} in stock</p>
          </div>

          {/* Add to cart button */}
          {product.stock_quantity > 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all
                ${added
                  ? 'bg-green-500 text-white'
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
            >
              {adding ? '...' : added ? '✓ Added' : '+ Cart'}
            </button>
          ) : (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
