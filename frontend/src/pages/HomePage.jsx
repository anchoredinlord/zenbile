import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productsAPI, sellersAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'

// Category banner config — icon + gradient for each category
const CATEGORY_BANNERS = {
  1: { icon: '👟', gradient: 'from-orange-400 to-rose-500',  bg: 'bg-orange-50' },
  2: { icon: '👗', gradient: 'from-purple-400 to-pink-500',  bg: 'bg-purple-50' },
  3: { icon: '📱', gradient: 'from-blue-400 to-cyan-500',    bg: 'bg-blue-50'   },
  4: { icon: '🏠', gradient: 'from-green-400 to-teal-500',   bg: 'bg-green-50'  },
  5: { icon: '💍', gradient: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50' },
}
const DEFAULT_BANNER = { icon: '🛍️', gradient: 'from-gray-400 to-gray-600', bg: 'bg-gray-50' }

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
          productsAPI.list({ page_size: 20 }),
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

  const renderCTA = () => {
    if (isAdmin) return (
      <section className="mt-12 rounded-3xl bg-gradient-to-r from-gray-800 to-gray-900
                           text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Admin Panel</p>
          <h2 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h2>
          <p className="text-gray-300 mt-1">Review seller applications and manage the platform</p>
        </div>
        <Link to="/admin" className="btn-primary whitespace-nowrap px-8 py-3 text-base">
          Open Admin Panel
        </Link>
      </section>
    )

    if (isSeller) return (
      <section className="mt-12 rounded-3xl bg-gradient-to-r from-primary-500 to-primary-700
                           text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm text-primary-200 mb-1">Seller Dashboard</p>
          <h2 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h2>
          <p className="text-primary-100 mt-1">Manage your products and incoming orders</p>
        </div>
        <Link to="/seller/dashboard" className="bg-white text-primary-600 hover:bg-primary-50
                                                font-bold px-8 py-3 rounded-xl transition-colors whitespace-nowrap">
          Go to Dashboard
        </Link>
      </section>
    )

    if (isLoggedIn) return (
      <section className="mt-12 rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-600
                           text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm text-blue-200 mb-1">My Account</p>
          <h2 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h2>
          <p className="text-blue-100 mt-1">Check your orders or keep browsing</p>
        </div>
        <div className="flex gap-3">
          <Link to="/orders" className="bg-white text-blue-600 hover:bg-blue-50
                                        font-bold px-6 py-2.5 rounded-xl transition-colors">
            My Orders
          </Link>
          <Link to="/products" className="border-2 border-white text-white hover:bg-white/10
                                          font-bold px-6 py-2.5 rounded-xl transition-colors">
            Browse
          </Link>
        </div>
      </section>
    )

    return (
      <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700
                        text-white p-7 flex flex-col justify-between min-h-40">
          <div>
            <span className="text-3xl">🛍️</span>
            <h2 className="text-xl font-bold mt-2">Start Shopping</h2>
            <p className="text-primary-100 text-sm mt-1">
              Create a free account and order from local shops across Ethiopia
            </p>
          </div>
          <Link to="/register"
            className="mt-4 bg-white text-primary-600 hover:bg-primary-50 font-bold
                       px-6 py-2.5 rounded-xl transition-colors self-start text-sm">
            Create Account →
          </Link>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900
                        text-white p-7 flex flex-col justify-between min-h-40">
          <div>
            <span className="text-3xl">🏪</span>
            <h2 className="text-xl font-bold mt-2">Sell on Zenbil</h2>
            <p className="text-gray-300 text-sm mt-1">
              Register your shop and reach thousands of customers across Ethiopia
            </p>
          </div>
          <Link to="/seller/register"
            className="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-bold
                       px-6 py-2.5 rounded-xl transition-colors self-start text-sm">
            Register Shop →
          </Link>
        </div>
      </section>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-500 to-orange-400">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-primary-100 text-sm font-medium mb-2 tracking-wide uppercase">
              Ethiopia's Online Marketplace
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Shop from Local<br />Ethiopian Sellers
            </h1>
            <p className="text-primary-100 mb-8 text-base sm:text-lg max-w-md">
              Discover products from hundreds of verified local shops — clothing, shoes, electronics, and more.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch}
              className="flex bg-white rounded-2xl overflow-hidden shadow-xl max-w-lg">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                type="text"
                placeholder="What are you looking for?"
                className="flex-1 px-5 py-3.5 text-gray-800 text-sm outline-none"
              />
              <button type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 font-semibold
                           text-sm transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Category pills ── */}
        {categories.length > 0 && (
          <section className="mb-8">
            <div className="flex gap-2 flex-wrap">
              <Link to="/products"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500
                           text-white text-sm font-medium shadow-sm hover:bg-primary-600 transition-colors">
                🛍️ All Products
              </Link>
              {categories.map((cat, i) => {
                const banner = CATEGORY_BANNERS[cat.id] || DEFAULT_BANNER
                return (
                  <Link key={cat.id}
                    to={`/products?category_id=${cat.id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white
                               border border-gray-200 text-sm font-medium text-gray-700
                               hover:border-primary-400 hover:text-primary-500 transition-colors shadow-sm">
                    {banner.icon} {cat.name}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Category banners ── */}
        {categories.length > 0 && (
          <section className="mb-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.slice(0, 4).map((cat, i) => {
                const banner = CATEGORY_BANNERS[cat.id] || DEFAULT_BANNER
                const catProducts = products.filter(p => p.category_id === cat.id)
                return (
                  <Link key={cat.id} to={`/products?category_id=${cat.id}`}
                    className={`${banner.bg} rounded-2xl p-5 flex flex-col justify-between
                                min-h-28 hover:shadow-md transition-all duration-200 group`}>
                    <div className="text-3xl">{banner.icon}</div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{cat.name}</p>
                      <p className="text-xs text-gray-500">{catProducts.length} products</p>
                      <span className="text-xs font-semibold text-primary-500 group-hover:underline">
                        Shop Now →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Products grouped by category ── */}
        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-lg font-bold text-gray-700">No products yet</h3>
            <p className="text-gray-400 text-sm mt-1">Sellers are setting up their shops</p>
          </div>
        ) : (
          <>
            {categories.map(cat => {
              const catProds = products.filter(p => p.category_id === cat.id)
              if (catProds.length === 0) return null
              const banner = CATEGORY_BANNERS[cat.id] || DEFAULT_BANNER
              return (
                <section key={cat.id} className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="section-title">
                      <span>{banner.icon}</span> {cat.name}
                    </h2>
                    <Link to={`/products?category_id=${cat.id}`}
                      className="text-sm text-primary-500 hover:text-primary-600 font-medium
                                 flex items-center gap-1">
                      View all
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {catProds.slice(0, 5).map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                </section>
              )
            })}

            {/* Uncategorized */}
            {(() => {
              const un = products.filter(p => !p.category_id)
              if (!un.length) return null
              return (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="section-title">🛍️ Other Products</h2>
                    <Link to="/products" className="text-sm text-primary-500 font-medium">View all →</Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {un.slice(0, 5).map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                </section>
              )
            })()}
          </>
        )}

        {/* ── CTA section ── */}
        {renderCTA()}
      </div>
    </div>
  )
}
