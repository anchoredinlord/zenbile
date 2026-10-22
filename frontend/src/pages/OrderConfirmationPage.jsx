import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ordersAPI } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready:     'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function OrderConfirmationPage() {
  const { reference } = useParams()
  const [order, setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersAPI.getOrder(reference)
      .then(r => setOrder(r.data))
      .finally(() => setLoading(false))
  }, [reference])

  if (loading) return <LoadingSpinner />
  if (!order) return <div className="text-center py-20 text-gray-400">Order not found</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Success header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">✅</div>
        <h1 className="text-2xl font-bold text-gray-800">Order Placed!</h1>
        <p className="text-gray-500 mt-1">Your order reference is</p>
        <span className="inline-block mt-2 bg-gray-100 text-gray-700 font-mono font-bold text-lg px-4 py-2 rounded-lg">
          {order.reference}
        </span>
      </div>

      {/* Order summary */}
      <div className="card p-5 mb-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-gray-700">Order Total</span>
          <span className="text-xl font-bold text-primary-500">{order.total?.toLocaleString()} ETB</span>
        </div>
        <div className="text-sm text-gray-500 space-y-1">
          <div><span className="font-medium text-gray-700">Name: </span>{order.customer_name}</div>
          {order.customer_phone && <div><span className="font-medium text-gray-700">Phone: </span>{order.customer_phone}</div>}
          {order.customer_note && <div><span className="font-medium text-gray-700">Note: </span>{order.customer_note}</div>}
        </div>
      </div>

      {/* Seller orders */}
      <h2 className="font-semibold text-gray-700 mb-3">Fulfillment Status</h2>
      {order.seller_orders?.map(so => (
        <div key={so.id} className="card p-4 mb-3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="font-medium text-gray-800">Shop #{so.shop_id}</span>
              <span className="ml-2 text-sm text-gray-400 capitalize">{so.fulfillment_method}</span>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[so.status]}`}>
              {so.status}
            </span>
          </div>

          {so.items?.map(item => (
            <div key={item.id} className="flex justify-between text-sm py-1 border-t border-gray-50">
              <span className="text-gray-600">{item.product_name} × {item.quantity}</span>
              <span className="text-gray-700 font-medium">{item.subtotal?.toLocaleString()} ETB</span>
            </div>
          ))}

          {so.seller_note && (
            <div className="mt-2 text-sm bg-blue-50 text-blue-700 rounded p-2">
              💬 {so.seller_note}
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-3 mt-6">
        <Link to="/products" className="flex-1 btn-secondary text-center py-2.5">
          Continue Shopping
        </Link>
        <Link to="/orders" className="flex-1 btn-primary text-center py-2.5">
          My Orders
        </Link>
      </div>
    </div>
  )
}
