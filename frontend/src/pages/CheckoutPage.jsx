import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersAPI, cartAPI } from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function CheckoutPage() {
  const { user }      = useAuth()
  const { fetchCart } = useCart()
  const navigate      = useNavigate()
  const [cartData, setCartData] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

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
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
        <p className="text-gray-400 text-sm mt-1">Complete your order details below</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {['Cart', 'Details', 'Confirmation'].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${i === 1 ? 'bg-primary-500 text-white' :
                i < 1   ? 'bg-green-500 text-white' :
                          'bg-gray-100 text-gray-400'}`}>
              {i < 1 ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block
              ${i === 1 ? 'text-gray-800' : 'text-gray-400'}`}>
              {step}
            </span>
            {i < 2 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Contact details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full
                                 flex items-center justify-center text-xs font-bold">1</span>
                Contact Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input name="customer_name" value={form.customer_name} onChange={update}
                    required className="input-field" placeholder="Your full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input name="customer_phone" value={form.customer_phone} onChange={update}
                    className="input-field" placeholder="09xxxxxxxx" />
                </div>
              </div>
            </div>

            {/* Delivery method */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full
                                 flex items-center justify-center text-xs font-bold">2</span>
                Fulfillment Method
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'pickup', icon: '📍', title: 'Pickup', desc: 'Collect from seller\'s shop' },
                  { value: 'delivery', icon: '🚚', title: 'Delivery', desc: 'Delivered to your address' },
                ].map(opt => (
                  <label key={opt.value}
                    className={`flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${form.fulfillment_method === opt.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="fulfillment_method" value={opt.value}
                      checked={form.fulfillment_method === opt.value}
                      onChange={update} className="sr-only" />
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-semibold text-gray-800 text-sm">{opt.title}</span>
                    <span className="text-xs text-gray-400">{opt.desc}</span>
                  </label>
                ))}
              </div>

              {form.fulfillment_method === 'delivery' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Delivery Address <span className="text-red-400">*</span>
                  </label>
                  <textarea name="delivery_address" value={form.delivery_address} onChange={update}
                    required className="input-field" rows={3}
                    placeholder="Area, street, landmark... (e.g. Bole, near Total station)" />
                </div>
              )}
            </div>

            {/* Note */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full
                                 flex items-center justify-center text-xs font-bold">3</span>
                Additional Note
                <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </h2>
              <textarea name="customer_note" value={form.customer_note} onChange={update}
                className="input-field" rows={2}
                placeholder="Special instructions for the seller..." />
            </div>

            {/* Payment notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <span className="text-xl flex-shrink-0">💳</span>
              <div className="text-sm text-amber-700">
                <p className="font-semibold mb-0.5">Pay on Pickup / Delivery</p>
                <p>Payment is arranged directly with the seller after they confirm your order.
                   You will not be charged online.</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 flex gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 text-base">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Placing Order...
                </>
              ) : (
                <>
                  Place Order
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right — order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <h2 className="font-bold text-gray-800 mb-4">Your Order</h2>

            {cartData?.items?.length > 0 ? (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cartData.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-gray-700 font-medium truncate">{item.product_name}</p>
                        <p className="text-gray-400">× {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-gray-700 flex-shrink-0">
                        {item.subtotal?.toLocaleString()} ETB
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="text-xl font-bold text-primary-500">
                      {cartData.total?.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">Loading cart...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
