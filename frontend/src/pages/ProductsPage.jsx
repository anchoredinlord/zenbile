import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsAPI } from '../utils/api'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)

  const search     = searchParams.get('search') || ''
  const categoryId = searchParams.get('category_id') || ''

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const params = { page, page_size: 20 }
        if (search) params.search = search
        if (categoryId) params.category_id = categoryId

        const [prodRes, catRes] = await Promise.all([
          productsAPI.list(params),
          productsAPI.categories(),
        ])
        setProducts(prodRes.data.products)
        setTotal(prodRes.data.total)
        setCategories(catRes.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [search, categoryId, page])

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val)
    else next.delete(key)
    setSearchParams(next)
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {search ? `Results for "${search}"` : 'All Products'}
          </h1>
          {!loading && <p className="text-gray-400 text-sm">{total} products found</p>}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('category_id', '')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${!categoryId ? 'bg-primary-500 text-white border-primary-500' : 'bg-white border-gray-200 hover:border-primary-400'}`}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat.id}
              onClick={() => setFilter('category_id', cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                ${categoryId == cat.id ? 'bg-primary-500 text-white border-primary-500' : 'bg-white border-gray-200 hover:border-primary-400'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No products found"
          message={search ? `No results for "${search}". Try a different search.` : 'No products in this category yet.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
                ← Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
