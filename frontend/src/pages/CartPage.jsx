import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cartAPI } from '../utils/api'
import { useCart } from '../context/CartContext'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function CartPage() {
  const [cart, setCart]     = useState(null)
  const [loading, setLoading] = useState(true)
  const { fetchCart }         = useCart()
  const navigate              = useNavigate()

  const load = async () => {
    try {
      const res = await cartAPI.get()
      setCart(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleRemove = async (itemId) => {
    await cartAPI.remove(itemId)
    await load()
    await fetchCart()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart</h1>

      {!cart || cart.items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Browse products and add them to your cart"
          action={
            <Link to="/products" className="btn-primary mt-2">
              Browse Products
            </Link>
          }
        />
      ) : (
        <>
          {/* Cart items */}
          <div className="card divide-y divide-gray-100 mb-6">
            {cart.items.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  👟
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.product_name}</p>
                  <p className="text-sm text-gray-400">
                    {item.product_price.toLocaleString()} ETB × {item.quantity}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-800">
                    {item.subtotal.toLocaleString()} ETB
                  </p>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-xs text-red-400 hover:text-red-600 mt-1">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order total */}
          <div className="card p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Total</span>
              <span className="text-2xl font-bold text-primary-500">
                {cart.total.toLocaleString()} ETB
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full btn-primary py-3 text-base">
            Proceed to Checkout →
          </button>
        </>
      )}
    </div>
  )
}
