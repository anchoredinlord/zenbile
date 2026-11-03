import { useState, useEffect } from 'react'
import { productsAPI } from '../utils/api'
import api from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved:  'bg-green-100 text-green-700 border-green-200',
  rejected:  'bg-red-100 text-red-600 border-red-200',
  suspended: 'bg-gray-100 text-gray-500 border-gray-200',
}

export default function AdminDashboardPage() {
  const [tab, setTab]             = useState('sellers')
  const [sellers, setSellers]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]     = useState(true)
  const [newCat, setNewCat]       = useState('')
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
    } finally { setLoading(false) }
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
      await api.post('/products/categories', { name: newCat.trim() })
      setNewCat('')
      await loadData()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to create category')
    } finally { setCatLoading(false) }
  }

  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?\n\nProducts will become uncategorized but will NOT be deleted.`)) return
    try {
      await api.delete(`/products/categories/${category.id}`)
      await loadData()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to delete category')
    }
  }

  if (loading) return <LoadingSpinner />

  const pending  = sellers.filter(s => s.status === 'pending')
  const approved = sellers.filter(s => s.status === 'approved')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Manage sellers, categories, and platform activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending Sellers',  value: pending.length,  color: 'text-yellow-500', bg: 'bg-yellow-50',  icon: '⏳' },
          { label: 'Active Sellers',   value: approved.length, color: 'text-green-500',  bg: 'bg-green-50',   icon: '✅' },
          { label: 'Total Sellers',    value: sellers.length,  color: 'text-primary-500',bg: 'bg-primary-50', icon: '🏪' },
          { label: 'Categories',       value: categories.length, color: 'text-blue-500', bg: 'bg-blue-50',    icon: '📂' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center text-lg mb-3`}>
              {stat.icon}
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {['sellers', 'categories'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 transition-colors
              ${tab === t
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
            {t}
            {t === 'sellers' && pending.length > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Sellers Tab ── */}
      {tab === 'sellers' && (
        <div className="space-y-4">
          {sellers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🏪</p>
              <p className="font-medium">No seller applications yet</p>
            </div>
          ) : sellers.map(seller => (
            <div key={seller.id}
              className="bg-white rounded-2xl border border-gray-100 p-5">

              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center
                                  justify-center text-xl flex-shrink-0">
                    🏪
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800">
                        {seller.shop?.name || 'Unnamed Shop'}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                                        border capitalize ${STATUS_STYLES[seller.status]}`}>
                        {seller.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {seller.shop?.location && `📍 ${seller.shop.location} · `}
                      {seller.shop?.shop_type && `${seller.shop.shop_type.replace(/_/g,' ')} · `}
                      Applied {new Date(seller.created_at).toLocaleDateString()}
                    </p>
                    {seller.shop?.description && (
                      <p className="text-sm text-gray-500 mt-1 max-w-lg">
                        {seller.shop.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Note input */}
              <input
                value={reviewNote[seller.id] || ''}
                onChange={e => setReviewNote(n => ({ ...n, [seller.id]: e.target.value }))}
                className="input-field text-sm mb-3"
                placeholder="Add a note for the seller (optional)..."
              />

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {seller.status !== 'approved' && (
                  <button onClick={() => reviewSeller(seller.id, 'approved')}
                    className="flex items-center gap-1.5 text-sm bg-green-500 hover:bg-green-600
                               text-white px-4 py-2 rounded-xl font-medium transition-colors">
                    ✓ Approve
                  </button>
                )}
                {seller.status !== 'rejected' && (
                  <button onClick={() => reviewSeller(seller.id, 'rejected')}
                    className="flex items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100
                               text-red-600 px-4 py-2 rounded-xl font-medium transition-colors border border-red-200">
                    ✗ Reject
                  </button>
                )}
                {seller.status === 'approved' && (
                  <button onClick={() => reviewSeller(seller.id, 'suspended')}
                    className="flex items-center gap-1.5 text-sm bg-gray-100 hover:bg-gray-200
                               text-gray-600 px-4 py-2 rounded-xl font-medium transition-colors">
                    ⏸ Suspend
                  </button>
                )}
              </div>

              {seller.admin_note && (
                <p className="text-xs text-gray-400 mt-3 italic bg-gray-50 px-3 py-2 rounded-xl">
                  💬 Note: {seller.admin_note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Categories Tab ── */}
      {tab === 'categories' && (
        <div>
          <form onSubmit={addCategory} className="flex gap-3 mb-6">
            <input
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              className="input-field flex-1"
              placeholder="New category name (e.g. Electronics, Bags)"
              required
            />
            <button type="submit" disabled={catLoading} className="btn-primary px-6 whitespace-nowrap">
              {catLoading ? '...' : '+ Add'}
            </button>
          </form>

          {categories.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No categories yet</p>
          ) : (
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id}
                  className="bg-white rounded-2xl border border-gray-100 px-5 py-3.5
                             flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center
                                    justify-center text-sm">📂</div>
                    <div>
                      <span className="font-semibold text-gray-800">{cat.name}</span>
                      <span className="text-xs text-gray-400 ml-2">/{cat.slug}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteCategory(cat)}
                    className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50
                               px-3 py-1.5 rounded-xl transition-colors font-medium">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
