import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productsAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function HomePage() {
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const navigate                    = useNavigate()
  const { isLoggedIn, isSeller, isAdmin, user } = useAuth()

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

  // Bottom CTA section changes based on who is logged in
  const renderBottomCTA = () => {
    // Admin — go to admin dashboard
    if (isAdmin) return (
      <section className="mt-16 bg-gray-800 text-white rounded-2xl p-8 text-center">
        <p className="text-3xl mb-3">⚙️</p>
        <h2 className="text-2xl font-bold mb-2">Welcome back, Admin</h2>
        <p className="text-gray-300 mb-6">
          Manage sellers, approve applications, and monitor the marketplace
        </p>
        <Link to="/admin"
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
          Go to Admin Dashboard
        </Link>
      </section>
    )

    // Seller — go to seller dashboard
    if (isSeller) return (
      <section className="mt-16 bg-gray-800 text-white rounded-2xl p-8 text-center">
        <p className="text-3xl mb-3">🏪</p>
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0]}</h2>
        <p className="text-gray-300 mb-6">
          Manage your products, view incoming orders, and update your shop
        </p>
        <Link to="/seller/dashboard"
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
          Go to Seller Dashboard
        </Link>
      </section>
    )

    // Logged in customer — go to orders
    if (isLoggedIn) return (
      <section className="mt-16 bg-gray-800 text-white rounded-2xl p-8 text-center">
        <p className="text-3xl mb-3">📦</p>
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0]}</h2>
        <p className="text-gray-300 mb-6">
          Check your orders or keep shopping
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link to="/orders"
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
            My Orders
          </Link>
          <Link to="/products"
            className="bg-white text-gray-800 hover:bg-gray-100 font-semibold px-8 py-3 rounded-xl transition-colors">
            Browse Products
          </Link>
        </div>
      </section>
    )

    // Not logged in — show all options
    return (
      <section className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer CTA */}
        <div className="bg-gray-800 text-white rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3">🛍️</p>
          <h2 className="text-xl font-bold mb-2">Start Shopping</h2>
          <p className="text-gray-300 mb-6 text-sm">
            Create a free account and order from local shops
          </p>
          <Link to="/register"
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            Create Customer Account
          </Link>
        </div>

        {/* Seller CTA */}
        <div className="bg-primary-600 text-white rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3">🏪</p>
          <h2 className="text-xl font-bold mb-2">Sell on Zenbil</h2>
          <p className="text-primary-100 mb-6 text-sm">
            Register your shop and reach thousands of customers
          </p>
          <Link to="/seller/register"
            className="bg-white text-primary-600 hover:bg-primary-50 font-semibold px-6 py-2.5 rounded-xl transition-colors">
            Register Your Shop
          </Link>
        </div>
      </section>
    )
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
          <form onSubmit={handleSearch} className="flex max-w-xl mx-auto gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search shoes, clothing, accessories..."
              className="flex-1 px-4 py-3 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button type="submit"
              className="bg-white text-primary-600 font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors">
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
            <Link to="/products"
              className="text-primary-500 hover:text-primary-600 text-sm font-medium">
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

        {/* ── Bottom CTA — changes based on role ── */}
        {renderBottomCTA()}

      </div>
    </div>
  )
}
