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

// Which status buttons to show based on current status
const NEXT_STATUSES = {
  pending:   [{ status: 'confirmed', label: 'Confirm',        color: 'bg-blue-500 hover:bg-blue-600 text-white' },
              { status: 'rejected',  label: 'Reject',         color: 'bg-red-100 hover:bg-red-200 text-red-600' }],
  confirmed: [{ status: 'preparing', label: 'Mark Preparing', color: 'bg-purple-500 hover:bg-purple-600 text-white' }],
  preparing: [{ status: 'ready',     label: 'Mark Ready',     color: 'bg-indigo-500 hover:bg-indigo-600 text-white' }],
  ready:     [{ status: 'completed', label: 'Mark Completed', color: 'bg-green-500 hover:bg-green-600 text-white' }],
}

export default function SellerDashboardPage() {
  const [profile, setProfile]   = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('orders')

  // Order status update — note per order
  const [orderNotes, setOrderNotes] = useState({})

  // Shop edit form
  const [editingShop, setEditingShop] = useState(false)
  const [shopForm, setShopForm]       = useState({})
  const [shopSaving, setShopSaving]   = useState(false)
  const [shopSaved, setShopSaved]     = useState(false)
  const [shopTypes, setShopTypes]     = useState([])

  // Image management
  const [expandedImages, setExpandedImages] = useState({}) // productId → true/false
  const [uploadingFor, setUploadingFor]     = useState(null)

  const loadAll = async () => {
    try {
      const [profRes, prodRes, ordRes] = await Promise.all([
        sellersAPI.myProfile(),
        productsAPI.myProducts(),
        ordersAPI.sellerOrders(),
      ])
      setProfile(profRes.data)
      setShopForm({
        name:        profRes.data.shop?.name        || '',
        description: profRes.data.shop?.description || '',
        phone:       profRes.data.shop?.phone        || '',
        location:    profRes.data.shop?.location     || '',
        shop_type:   profRes.data.shop?.shop_type    || 'other',
      })
      setProducts(prodRes.data)
      setOrders(ordRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    sellersAPI.shopTypes().then(r => setShopTypes(r.data)).catch(() => {})
  }, [])

  // ── Order actions ──────────────────────────────────────────────────────────

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateOrderStatus(orderId, {
        status: newStatus,
        seller_note: orderNotes[orderId] || null,
      })
      setOrderNotes(n => ({ ...n, [orderId]: '' }))
      const res = await ordersAPI.sellerOrders()
      setOrders(res.data)
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to update status')
    }
  }

  // ── Product actions ────────────────────────────────────────────────────────

  const toggleProductStatus = async (product) => {
    const newStatus = product.status === 'active' ? 'archived' : 'active'
    await productsAPI.update(product.id, { status: newStatus })
    const res = await productsAPI.myProducts()
    setProducts(res.data)
  }

  const deleteProduct = async (product) => {
    if (!window.confirm(`Permanently delete "${product.name}"?\nThis cannot be undone.`)) return
    try {
      await productsAPI.delete(product.id)
      setProducts(prev => prev.filter(p => p.id !== product.id))
    } catch (e) {
      alert(e.response?.data?.detail || 'Could not delete product')
    }
  }

  // ── Image actions ──────────────────────────────────────────────────────────

  const uploadImage = async (productId, file) => {
    setUploadingFor(productId)
    try {
      await productsAPI.uploadImage(productId, file)
      const res = await productsAPI.myProducts()
      setProducts(res.data)
    } catch (e) {
      alert(e.response?.data?.detail || 'Upload failed')
    } finally {
      setUploadingFor(null)
    }
  }

  const deleteImage = async (productId, imageId) => {
    if (!window.confirm('Delete this image?')) return
    try {
      await productsAPI.deleteImage(productId, imageId)
      const res = await productsAPI.myProducts()
      setProducts(res.data)
    } catch (e) {
      alert('Could not delete image')
    }
  }

  // ── Shop edit ──────────────────────────────────────────────────────────────

  const saveShop = async (e) => {
    e.preventDefault()
    setShopSaving(true)
    try {
      await sellersAPI.updateShop(shopForm)
      setShopSaved(true)
      setEditingShop(false)
      setTimeout(() => setShopSaved(false), 3000)
      await loadAll()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update shop')
    } finally {
      setShopSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const isApproved = profile?.status === 'approved'
  const pendingOrders    = orders.filter(o => o.status === 'pending').length
  const completedOrders  = orders.filter(o => o.status === 'completed').length

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ── Shop header ── */}
      <div className="card p-5 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            {!editingShop ? (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-800">
                    {profile?.shop?.name || 'Your Shop'}
                  </h1>
                  <span className={`px-3 py-0.5 rounded-full text-sm font-semibold capitalize
                    ${profile?.status === 'approved'  ? 'bg-green-100 text-green-700' :
                      profile?.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'}`}>
                    {profile?.status}
                  </span>
                  {shopSaved && (
                    <span className="text-xs text-green-600 font-medium">✓ Saved</span>
                  )}
                </div>
                {profile?.shop?.location && (
                  <p className="text-sm text-gray-400 mt-1">📍 {profile.shop.location}</p>
                )}
                {profile?.shop?.description && (
                  <p className="text-sm text-gray-500 mt-1 max-w-lg">{profile.shop.description}</p>
                )}
                <button onClick={() => setEditingShop(true)}
                  className="text-xs text-primary-500 hover:text-primary-600 mt-2 font-medium">
                  ✏️ Edit shop details
                </button>
              </>
            ) : (
              <form onSubmit={saveShop} className="space-y-3 w-full max-w-lg">
                <h2 className="font-semibold text-gray-700 text-sm">Edit Shop Details</h2>
                <input value={shopForm.name} onChange={e => setShopForm(f=>({...f,name:e.target.value}))}
                  className="input-field" placeholder="Shop name" required />
                <select value={shopForm.shop_type}
                  onChange={e => setShopForm(f=>({...f,shop_type:e.target.value}))}
                  className="input-field">
                  {shopTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
                <textarea value={shopForm.description} onChange={e => setShopForm(f=>({...f,description:e.target.value}))}
                  className="input-field" rows={2} placeholder="Shop description" />
                <input value={shopForm.phone} onChange={e => setShopForm(f=>({...f,phone:e.target.value}))}
                  className="input-field" placeholder="Shop phone" />
                <input value={shopForm.location} onChange={e => setShopForm(f=>({...f,location:e.target.value}))}
                  className="input-field" placeholder="Location (e.g. Bole, Addis Ababa)" />
                <div className="flex gap-2">
                  <button type="submit" disabled={shopSaving}
                    className="btn-primary text-sm px-4 py-1.5">
                    {shopSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditingShop(false)}
                    className="btn-secondary text-sm px-4 py-1.5">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Pending approval notice ── */}
      {!isApproved && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-yellow-800 text-sm">
          ⏳ Your shop is pending admin approval. You can prepare your products but they
          won't be visible to customers until approved.
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-500">{products.length}</p>
          <p className="text-xs text-gray-400 mt-1">Products</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-500">{pendingOrders}</p>
          <p className="text-xs text-gray-400 mt-1">Pending Orders</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{completedOrders}</p>
          <p className="text-xs text-gray-400 mt-1">Completed</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 mb-6">
        {['orders', 'products'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors
              ${tab === t
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
            {t === 'orders' && pendingOrders > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingOrders}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Orders tab ── */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-3xl mb-2">📦</p>
              <p>No orders yet</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="card p-4">

              {/* Order header */}
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-gray-800">Order #{order.id}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()} ·{' '}
                    <span className="capitalize">{order.fulfillment_method}</span>
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                  ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </div>

              {/* Items */}
              {order.items?.map(item => (
                <div key={item.id}
                  className="text-sm text-gray-600 py-1 border-t border-gray-50 flex justify-between">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span className="font-medium">{item.subtotal?.toLocaleString()} ETB</span>
                </div>
              ))}

              {/* Subtotal + actions */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-primary-500">
                    {order.subtotal?.toLocaleString()} ETB
                  </span>
                </div>

                {/* Seller note input */}
                {NEXT_STATUSES[order.status] && (
                  <div className="mb-2">
                    <input
                      value={orderNotes[order.id] || ''}
                      onChange={e => setOrderNotes(n => ({ ...n, [order.id]: e.target.value }))}
                      className="input-field text-xs"
                      placeholder="Add a message for the customer (optional)..."
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  {NEXT_STATUSES[order.status]?.map(btn => (
                    <button key={btn.status}
                      onClick={() => updateOrderStatus(order.id, btn.status)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg ${btn.color}`}>
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Show existing seller note */}
                {order.seller_note && (
                  <p className="text-xs text-blue-600 mt-2 italic">
                    💬 Your note: {order.seller_note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Products tab ── */}
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
            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="card p-4">

                  {/* Product row */}
                  <div className="flex items-center gap-3">

                    {/* Thumbnail — first image or emoji */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100
                                    flex items-center justify-center text-2xl flex-shrink-0">
                      {p.images?.[0]
                        ? <img src={`/uploads/products/${p.images[0].filename}`}
                            alt={p.name} className="w-full h-full object-cover" />
                        : '📦'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-sm text-gray-400">
                        {p.price?.toLocaleString()} ETB · Stock: {p.stock_quantity} ·{' '}
                        {p.images?.length || 0} image{p.images?.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium
                        ${p.status === 'active'  ? 'bg-green-100 text-green-700' :
                          p.status === 'draft'   ? 'bg-gray-100 text-gray-500' :
                                                   'bg-red-100 text-red-500'}`}>
                        {p.status}
                      </span>
                      <Link to={`/seller/products/${p.id}/edit`}
                        className="text-xs text-gray-400 hover:text-primary-500">Edit</Link>
                      <button onClick={() => setExpandedImages(e => ({ ...e, [p.id]: !e[p.id] }))}
                        className="text-xs text-gray-400 hover:text-blue-500">
                        {expandedImages[p.id] ? 'Hide images' : 'Images'}
                      </button>
                      <button onClick={() => toggleProductStatus(p)}
                        className="text-xs text-gray-400 hover:text-gray-600">
                        {p.status === 'active' ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => deleteProduct(p)}
                        className="text-xs text-red-400 hover:text-red-600">Delete</button>
                    </div>
                  </div>

                  {/* Image management panel */}
                  {expandedImages[p.id] && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 flex-wrap">

                        {/* Existing images */}
                        {p.images?.map(img => (
                          <div key={img.id} className="relative group">
                            <img
                              src={`/uploads/products/${img.filename}`}
                              alt=""
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              onClick={() => deleteImage(p.id, img.id)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white
                                         rounded-full text-xs items-center justify-center
                                         hidden group-hover:flex">
                              ×
                            </button>
                            {img.display_order === 0 && (
                              <span className="absolute bottom-0 left-0 right-0 bg-black/50
                                               text-white text-xs text-center rounded-b-lg py-0.5">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}

                        {/* Upload new image button */}
                        {(p.images?.length || 0) < 5 && (
                          <label className="w-16 h-16 border-2 border-dashed border-gray-300
                                            rounded-lg flex flex-col items-center justify-center
                                            cursor-pointer hover:border-primary-400 transition-colors">
                            <span className="text-xl text-gray-300">
                              {uploadingFor === p.id ? '⏳' : '+'}
                            </span>
                            <span className="text-xs text-gray-400 mt-0.5">
                              {uploadingFor === p.id ? 'Uploading' : 'Add'}
                            </span>
                            <input type="file" className="hidden"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={uploadingFor === p.id}
                              onChange={e => {
                                if (e.target.files[0]) uploadImage(p.id, e.target.files[0])
                              }} />
                          </label>
                        )}

                        <p className="text-xs text-gray-400 w-full mt-1">
                          {p.images?.length || 0}/5 images · Hover image to delete · First image is the cover
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
