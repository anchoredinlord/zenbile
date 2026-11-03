import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ordersAPI } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

const STATUS_STYLES = {
  pending:   { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200', dot: 'bg-yellow-400' },
  confirmed: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   dot: 'bg-blue-400'   },
  partial:   { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200', dot: 'bg-orange-400' },
  completed: { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',  dot: 'bg-green-400'  },
  cancelled: { bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200',   dot: 'bg-gray-300'   },
}

export default function OrdersPage() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersAPI.myOrders()
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
        <p className="text-sm text-gray-400 mt-1">
          {orders.length} order{orders.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders yet"
          message="Your order history will appear here after you make a purchase"
          action={<Link to="/products" className="btn-primary mt-3 px-8">Start Shopping</Link>}
        />
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending
            return (
              <Link key={order.id} to={`/orders/${order.reference}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center
                           justify-between hover:shadow-md transition-all duration-200 group">

                <div className="flex items-center gap-4">
                  {/* Status dot */}
                  <div className={`w-10 h-10 ${style.bg} rounded-xl flex items-center
                                   justify-center flex-shrink-0`}>
                    <div className={`w-3 h-3 ${style.dot} rounded-full`} />
                  </div>

                  <div>
                    <p className="font-mono font-bold text-gray-800 text-sm tracking-wider">
                      {order.reference}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-ET', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      {order.total?.toLocaleString()} <span className="text-xs text-gray-400 font-normal">ETB</span>
                    </p>
                    <span className={`text-xs font-semibold capitalize px-2 py-0.5
                                     rounded-full ${style.bg} ${style.text}`}>
                      {order.status === 'partial' ? 'In Progress' : order.status}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
