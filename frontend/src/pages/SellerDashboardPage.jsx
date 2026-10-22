import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { sellersAPI, productsAPI, ordersAPI } from '../utils/api'
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

export default function SellerDashboardPage() {
  const [profile, setProfile]   = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('orders')

  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, prodRes, ordRes] = await Promise.all([
          sellersAPI.myProfile(),
          productsAPI.myProducts(),
          ordersAPI.sellerOrders(),
        ])
        setProfile(profRes.data)
        setProducts(prodRes.data)
        setOrders(ordRes.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateOrderStatus(orderId, { status: newStatus })
      const res = await ordersAPI.sellerOrders()
      setOrders(res.data)
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to update status')
    }
  }

  const toggleProductStatus = async (product) => {
    const newStatus = product.status === 'active' ? 'archived' : 'active'
    await productsAPI.update(product.id, { status: newStatus })
    const res = await productsAPI.myProducts()
    setProducts(res.data)
  }

  if (loading) return <LoadingSpinner />

  const isApproved = profile?.status === 'approved'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Shop header */}
      <div className="card p-5 mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{profile?.shop?.name || 'Your Shop'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{profile?.shop?.location}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize
          ${profile?.status === 'approved' ? 'bg-green-100 text-green-700' :
            profile?.status === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                                             'bg-red-100 text-red-700'}`}>
          {profile?.status}
        </span>
      </div>

      {/* Pending notice */}
      {!isApproved && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-yellow-800 text-sm">
          ⏳ Your shop is pending admin approval. You can prepare your products but they won't be visible to customers until approved.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-500">{products.length}</p>
          <p className="text-xs text-gray-400 mt-1">Products</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-500">{orders.filter(o => o.status === 'pending').length}</p>
          <p className="text-xs text-gray-400 mt-1">Pending Orders</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-500">{orders.filter(o => o.status === 'completed').length}</p>
          <p className="text-xs text-gray-400 mt-1">Completed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {['orders', 'products'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors
              ${tab === t ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-3xl mb-2">📦</p>
              <p>No orders yet</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="card p-4">
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-gray-800">Order #{order.id}</p>
                  <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </div>

              {order.items?.map(item => (
                <div key={item.id} className="text-sm text-gray-600 py-1 border-t border-gray-50">
                  {item.product_name} × {item.quantity} — {item.subtotal?.toLocaleString()} ETB
                </div>
              ))}

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-primary-500">{order.subtotal?.toLocaleString()} ETB</span>
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg">
                        Confirm
                      </button>
                      <button onClick={() => updateOrderStatus(order.id, 'rejected')}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg">
                        Reject
                      </button>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <button onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg">
                      Mark Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg">
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg">
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products tab */}
      {tab === 'products' && (
        <div>
          <div className="flex justify-end mb-4">
            <Link to="/seller/products/new" className="btn-primary text-sm px-4 py-2">
              + Add Product
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-3xl mb-2">🛍️</p>
              <p>No products yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    👟
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-sm text-gray-400">{p.price?.toLocaleString()} ETB · Stock: {p.stock_quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium
                      ${p.status === 'active' ? 'bg-green-100 text-green-700' :
                        p.status === 'draft'  ? 'bg-gray-100 text-gray-500' :
                                                'bg-red-100 text-red-500'}`}>
                      {p.status}
                    </span>
                    <Link to={`/seller/products/${p.id}/edit`}
                      className="text-xs text-gray-400 hover:text-primary-500 px-2">Edit</Link>
                    <button onClick={() => toggleProductStatus(p)}
                      className="text-xs text-gray-400 hover:text-gray-600">
                      {p.status === 'active' ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
