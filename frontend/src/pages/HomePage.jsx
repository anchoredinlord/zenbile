import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productsAPI } from '../utils/api'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function HomePage() {
  const [products, setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productsAPI.list({ page_size: 8 }),
          productsAPI.categories(),
        ])
        setProducts(prodRes.data.products || [])
        setCategories(catRes.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search)}`)
  }

  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Shop Ethiopia's Best Sellers
          </h1>
          <p className="text-lg text-primary-100 mb-8">
            Discover products from hundreds of local shops in one place
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex max-w-xl mx-auto gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search shoes, clothing, accessories..."
              className="flex-1 px-4 py-3 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button type="submit" className="bg-white text-primary-600 font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors">
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ── Categories ── */}
        {categories.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Shop by Category</h2>
            <div className="flex gap-3 flex-wrap">
              <Link to="/products"
                className="bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-500
                           px-4 py-2 rounded-full text-sm font-medium transition-colors">
                All Products
              </Link>
              {categories.map(cat => (
                <Link key={cat.id}
                  to={`/products?category_id=${cat.id}`}
                  className="bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-500
                             px-4 py-2 rounded-full text-sm font-medium transition-colors">
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Products ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Latest Products</h2>
            <Link to="/products" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
              View all →
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🏪</p>
              <p className="font-medium">No products yet</p>
              <p className="text-sm mt-1">Sellers are setting up their shops</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {/* ── Seller CTA ── */}
        <section className="mt-16 bg-gray-800 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Are you a seller?</h2>
          <p className="text-gray-300 mb-6">
            Register your shop and start selling to thousands of customers today
          </p>
          <Link to="/seller/register" className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
            Register Your Shop
          </Link>
        </section>
      </div>
    </div>
  )
}
