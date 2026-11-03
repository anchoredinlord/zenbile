import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cartAPI } from '../utils/api'
import { useCart } from '../context/CartContext'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function CartPage() {
  const [cart, setCart]       = useState(null)
  const [loading, setLoading] = useState(true)
  const { fetchCart }         = useCart()
  const navigate              = useNavigate()

  const load = async () => {
    try {
      const res = await cartAPI.get()
      setCart(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleRemove = async (itemId) => {
    await cartAPI.remove(itemId)
    await load()
    await fetchCart()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Shopping Cart
          {cart?.item_count > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({cart.item_count} item{cart.item_count !== 1 ? 's' : ''})
            </span>
          )}
        </h1>
        <Link to="/products" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
          ← Continue Shopping
        </Link>
      </div>

      {!cart || cart.items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Browse products and add them to your cart"
          action={
            <Link to="/products" className="btn-primary mt-3 px-8">
              Start Shopping
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Cart items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map(item => (
              <div key={item.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">

                {/* Product image placeholder */}
                <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center
                                flex-shrink-0 border border-gray-100">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{item.product_name}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {item.product_price?.toLocaleString()} ETB × {item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="font-bold text-gray-800">
                    {item.subtotal?.toLocaleString()} <span className="text-xs text-gray-400">ETB</span>
                  </p>
                  <button onClick={() => handleRemove(item.id)}
                    className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-400
                               hover:text-red-600 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal ({cart.item_count} items)</span>
                  <span className="font-medium text-gray-700">{cart.total?.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery fee</span>
                  <span className="text-green-600 font-medium">Agreed with seller</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-primary-500">
                    {cart.total?.toLocaleString()} ETB
                  </span>
                </div>
              </div>

              <button onClick={() => navigate('/checkout')}
                className="w-full btn-primary py-3 text-base">
                Proceed to Checkout
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure checkout
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
