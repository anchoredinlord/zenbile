import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ordersAPI } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

// Progress steps for seller fulfillment
const SELLER_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'completed']

const SELLER_STEP_LABELS = {
  pending:   'Waiting for seller',
  confirmed: 'Seller confirmed',
  preparing: 'Preparing your order',
  ready:     'Ready for pickup / Out for delivery',
  completed: 'Order completed',
  rejected:  'Rejected by seller',
  cancelled: 'Cancelled',
}

const SELLER_STEP_ICONS = {
  pending:   '⏳',
  confirmed: '✅',
  preparing: '📦',
  ready:     '🏪',
  completed: '🎉',
  rejected:  '❌',
  cancelled: '🚫',
}

const ORDER_STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  partial:   'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function OrderConfirmationPage() {
  const { reference }       = useParams()
  const [order, setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    ordersAPI.getOrder(reference)
      .then(r => setOrder(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // Auto-refresh every 30 seconds so Meron sees status updates
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [reference])

  if (loading) return <LoadingSpinner />
  if (!order)  return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-4xl mb-3">😕</p>
      <p>Order not found</p>
      <Link to="/orders" className="text-primary-500 mt-4 inline-block">← My Orders</Link>
    </div>
  )

  const isNew = order.status === 'pending'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{isNew ? '✅' : '📦'}</div>
        <h1 className="text-2xl font-bold text-gray-800">
          {isNew ? 'Order Placed!' : 'Order Status'}
        </h1>
        <p className="text-gray-500 mt-1">Reference number</p>
        <span className="inline-block mt-2 bg-gray-100 text-gray-700 font-mono
                         font-bold text-lg px-4 py-2 rounded-lg tracking-wider">
          {order.reference}
        </span>

        {/* Overall order status */}
        <div className="mt-3">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize
            ${ORDER_STATUS_COLORS[order.status]}`}>
            {order.status === 'partial' ? 'In Progress' : order.status}
          </span>
        </div>
      </div>

      {/* Order summary */}
      <div className="card p-5 mb-5">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-gray-700">Order Total</span>
          <span className="text-xl font-bold text-primary-500">
            {order.total?.toLocaleString()} ETB
          </span>
        </div>
        <div className="text-sm text-gray-500 space-y-1 border-t border-gray-100 pt-3">
          <div><span className="font-medium text-gray-700">Name: </span>{order.customer_name}</div>
          {order.customer_phone && (
            <div><span className="font-medium text-gray-700">Phone: </span>{order.customer_phone}</div>
          )}
          {order.delivery_address && (
            <div><span className="font-medium text-gray-700">Delivery to: </span>{order.delivery_address}</div>
          )}
          {order.customer_note && (
            <div><span className="font-medium text-gray-700">Your note: </span>{order.customer_note}</div>
          )}
        </div>
      </div>

      {/* Seller fulfillment cards */}
      <h2 className="font-semibold text-gray-700 mb-3">Fulfillment Status</h2>
      {order.seller_orders?.map((so, idx) => {
        const currentStep = SELLER_STEPS.indexOf(so.status)
        const isRejected  = so.status === 'rejected' || so.status === 'cancelled'

        return (
          <div key={so.id} className="card p-5 mb-4">

            {/* Shop header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-800">
                  🏪 Shop #{so.shop_id}
                </p>
                <p className="text-xs text-gray-400 capitalize mt-0.5">
                  {so.fulfillment_method === 'pickup' ? '📍 Pickup from shop' : '🚚 Delivery to you'}
                </p>
              </div>
              <span className="text-2xl">{SELLER_STEP_ICONS[so.status]}</span>
            </div>

            {/* Progress bar — only for non-rejected orders */}
            {!isRejected && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  {SELLER_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center flex-1">
                      {/* Step circle */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center
                                       text-xs font-bold border-2 transition-all flex-shrink-0
                        ${i <= currentStep
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-200 text-gray-400'
                        }`}>
                        {i <= currentStep ? '✓' : i + 1}
                      </div>
                      {/* Connector line */}
                      {i < SELLER_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1
                          ${i < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
                {/* Current status label */}
                <p className={`text-sm font-semibold text-center mt-2
                  ${so.status === 'ready' ? 'text-primary-500' :
                    so.status === 'completed' ? 'text-green-600' : 'text-gray-600'}`}>
                  {SELLER_STEP_LABELS[so.status]}
                </p>
              </div>
            )}

            {/* Rejected state */}
            {isRejected && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600 font-medium">
                  ❌ This seller could not fulfill your order
                </p>
                <p className="text-xs text-red-400 mt-1">
                  Contact support if you were charged
                </p>
              </div>
            )}

            {/* READY FOR PICKUP — prominent notice */}
            {so.status === 'ready' && so.fulfillment_method === 'pickup' && (
              <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 mb-4 text-center">
                <p className="text-lg font-bold text-green-700">🏪 Your order is ready for pickup!</p>
                <p className="text-sm text-green-600 mt-1">
                  Go to the seller's shop to collect your items and pay
                </p>
              </div>
            )}

            {so.status === 'ready' && so.fulfillment_method === 'delivery' && (
              <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 mb-4 text-center">
                <p className="text-lg font-bold text-blue-700">🚚 Your order is on the way!</p>
                <p className="text-sm text-blue-600 mt-1">
                  The seller is delivering your items
                </p>
              </div>
            )}

            {/* Seller note */}
            {so.seller_note && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-blue-600 mb-1">
                  💬 Message from seller:
                </p>
                <p className="text-sm text-blue-800">{so.seller_note}</p>
              </div>
            )}

            {/* Items in this seller's order */}
            <div className="border-t border-gray-100 pt-3 space-y-1">
              {so.items?.map(item => (
                <div key={item.id}
                  className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">
                    {item.product_name} <span className="text-gray-400">× {item.quantity}</span>
                  </span>
                  <span className="text-gray-700 font-medium">
                    {item.subtotal?.toLocaleString()} ETB
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotal */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="font-bold text-gray-700">
                {so.subtotal?.toLocaleString()} ETB
              </span>
            </div>
          </div>
        )
      })}

      {/* Payment notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
        <p className="font-semibold mb-1">💳 Payment</p>
        <p>
          {order.payment_status === 'paid'
            ? '✓ Payment confirmed'
            : 'Pay when you pick up your items or when the delivery arrives. Do not pay before your order is marked as ready.'}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Link to="/orders"
          className="flex-1 btn-secondary text-center py-2.5">
          ← All Orders
        </Link>
        <Link to="/products"
          className="flex-1 btn-primary text-center py-2.5">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
