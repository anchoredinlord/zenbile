import { useState, useEffect } from 'react'
import { sellersAPI, productsAPI } from '../utils/api'
import api from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  approved:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-600',
  suspended: 'bg-gray-100 text-gray-500',
}

export default function AdminDashboardPage() {
  const [tab, setTab]           = useState('sellers')
  const [sellers, setSellers]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]   = useState(true)
  const [newCat, setNewCat]     = useState('')
  const [catLoading, setCatLoading] = useState(false)
  const [reviewNote, setReviewNote] = useState({})

  const loadData = async () => {
    try {
      const [selRes, catRes] = await Promise.all([
        api.get('/sellers/admin/all'),
        productsAPI.categories(),
      ])
      setSellers(selRes.data)
      setCategories(catRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const reviewSeller = async (sellerId, status) => {
    try {
      await api.put(`/sellers/admin/${sellerId}/review`, {
        status,
        admin_note: reviewNote[sellerId] || '',
      })
      await loadData()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to update seller')
    }
  }

  const addCategory = async (e) => {
    e.preventDefault()
    if (!newCat.trim()) return
    setCatLoading(true)
    try {
      await productsAPI.create  // categories endpoint
      await api.post('/products/categories', { name: newCat.trim() })
      setNewCat('')
      await loadData()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to create category')
    } finally {
      setCatLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const pending  = sellers.filter(s => s.status === 'pending')
  const approved = sellers.filter(s => s.status === 'approved')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage sellers, categories, and platform activity</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-500">{pending.length}</p>
          <p className="text-xs text-gray-400 mt-1">Pending Sellers</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{approved.length}</p>
          <p className="text-xs text-gray-400 mt-1">Active Sellers</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-500">{sellers.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Sellers</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">{categories.length}</p>
          <p className="text-xs text-gray-400 mt-1">Categories</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {['sellers', 'categories'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors
              ${tab === t
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
            {t === 'sellers' && pending.length > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Sellers Tab ── */}
      {tab === 'sellers' && (
        <div className="space-y-4">

          {/* Pending first */}
          {sellers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-3xl mb-2">🏪</p>
              <p>No seller applications yet</p>
            </div>
          ) : sellers.map(seller => (
            <div key={seller.id} className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">
                      {seller.shop?.name || 'Unnamed Shop'}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[seller.status]}`}>
                      {seller.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {seller.shop?.location && `📍 ${seller.shop.location} · `}
                    Seller #{seller.id} · Applied {new Date(seller.created_at).toLocaleDateString()}
                  </p>
                  {seller.shop?.description && (
                    <p className="text-sm text-gray-500 mt-1">{seller.shop.description}</p>
                  )}
                </div>
              </div>

              {/* Admin note input */}
              <input
                value={reviewNote[seller.id] || ''}
                onChange={e => setReviewNote(n => ({ ...n, [seller.id]: e.target.value }))}
                className="input-field text-sm mb-3"
                placeholder="Add a note (optional)..."
              />

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {seller.status !== 'approved' && (
                  <button
                    onClick={() => reviewSeller(seller.id, 'approved')}
                    className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg font-medium">
                    ✓ Approve
                  </button>
                )}
                {seller.status !== 'rejected' && (
                  <button
                    onClick={() => reviewSeller(seller.id, 'rejected')}
                    className="text-sm bg-red-100 hover:bg-red-200 text-red-600 px-4 py-1.5 rounded-lg font-medium">
                    ✗ Reject
                  </button>
                )}
                {seller.status === 'approved' && (
                  <button
                    onClick={() => reviewSeller(seller.id, 'suspended')}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-lg font-medium">
                    ⏸ Suspend
                  </button>
                )}
              </div>

              {seller.admin_note && (
                <p className="text-xs text-gray-400 mt-2 italic">
                  Note: {seller.admin_note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Categories Tab ── */}
      {tab === 'categories' && (
        <div>
          {/* Add category form */}
          <form onSubmit={addCategory} className="flex gap-2 mb-6">
            <input
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              className="input-field flex-1"
              placeholder="New category name (e.g. Bags, Clothing)"
              required
            />
            <button type="submit" disabled={catLoading}
              className="btn-primary px-5 whitespace-nowrap">
              {catLoading ? '...' : '+ Add'}
            </button>
          </form>

          {/* Category list */}
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No categories yet</p>
            ) : categories.map(cat => (
              <div key={cat.id} className="card px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{cat.name}</span>
                  {cat.description && (
                    <span className="text-sm text-gray-400 ml-2">— {cat.description}</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">/{cat.slug}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
