import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
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

  const search     = searchParams.get('search')     || ''
  const categoryId = searchParams.get('category_id') || ''

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const params = { page, page_size: 20 }
        if (search)     params.search = search
        if (categoryId) params.category_id = categoryId
        const [prodRes, catRes] = await Promise.all([
          productsAPI.list(params),
          productsAPI.categories(),
        ])
        setProducts(prodRes.data.products)
        setTotal(prodRes.data.total)
        setCategories(catRes.data)
      } finally { setLoading(false) }
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

  const activeCat = categories.find(c => String(c.id) === categoryId)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-4 flex items-center gap-2">
        <Link to="/" className="hover:text-primary-500">Home</Link>
        <span>/</span>
        <span className="text-gray-600">{activeCat ? activeCat.name : search ? `"${search}"` : 'All Products'}</span>
      </nav>

      {/* Header + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {search ? `Results for "${search}"` : activeCat ? activeCat.name : 'All Products'}
          </h1>
          {!loading && (
            <p className="text-sm text-gray-400 mt-0.5">
              {total} product{total !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setFilter('category_id', '')}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors
            ${!categoryId
              ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
              : 'bg-white border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-500'}`}>
          All
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setFilter('category_id', cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors
              ${String(categoryId) === String(cat.id)
                ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-500'}`}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? <LoadingSpinner /> : products.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No products found"
          message={search
            ? `No results for "${search}". Try different keywords.`
            : 'No products in this category yet.'}
          action={<Link to="/products" className="btn-primary mt-3">Browse All Products</Link>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center items-center gap-3 mt-10">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary px-5 py-2 text-sm disabled:opacity-40">
                ← Previous
              </button>
              <span className="text-sm text-gray-500 px-4 py-2 bg-white rounded-xl border border-gray-200">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
                className="btn-secondary px-5 py-2 text-sm disabled:opacity-40">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
