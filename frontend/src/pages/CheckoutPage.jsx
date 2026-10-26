import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersAPI, cartAPI } from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function CheckoutPage() {
  const { user }        = useAuth()
  const { fetchCart }   = useCart()
  const navigate        = useNavigate()
  const [cartData, setCartData]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const [form, setForm] = useState({
    customer_name:      user?.full_name || '',
    customer_phone:     user?.phone     || '',
    fulfillment_method: 'pickup',
    delivery_address:   '',
    customer_note:      '',
  })

  useEffect(() => {
    cartAPI.get().then(r => setCartData(r.data)).catch(() => {})
  }, [])

  const update = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await ordersAPI.checkout(form)
      await fetchCart()
      navigate(`/orders/${res.data.reference}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left — order form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-700">Your Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input name="customer_name" value={form.customer_name} onChange={update}
                required className="input-field" placeholder="Your full name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input name="customer_phone" value={form.customer_phone} onChange={update}
                className="input-field" placeholder="09xxxxxxxx" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fulfillment *</label>
              <select name="fulfillment_method" value={form.fulfillment_method} onChange={update}
                className="input-field">
                <option value="pickup">📍 Pickup from seller</option>
                <option value="delivery">🚚 Delivery to my address</option>
              </select>
            </div>

            {form.fulfillment_method === 'delivery' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                <textarea name="delivery_address" value={form.delivery_address} onChange={update}
                  required className="input-field" rows={3}
                  placeholder="Area, street, landmark..." />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note to Seller</label>
              <textarea name="customer_note" value={form.customer_note} onChange={update}
                className="input-field" rows={2} placeholder="Any special instructions..." />
            </div>
          </div>

          {/* Payment notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            💳 Pay when you pick up or receive your items. You will not be charged online.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base">
            {loading ? 'Placing order...' : 'Place Order'}
          </button>
        </form>

        {/* Right — order summary */}
        <div>
          <div className="card p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Order Summary</h2>

            {cartData?.items?.length > 0 ? (
              <>
                <div className="space-y-3 mb-4">
                  {cartData.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product_name}
                        <span className="text-gray-400 ml-1">× {item.quantity}</span>
                      </span>
                      <span className="font-medium text-gray-700">
                        {item.subtotal?.toLocaleString()} ETB
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="text-xl font-bold text-primary-500">
                    {cartData.total?.toLocaleString()} ETB
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Loading cart...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
