import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout, isLoggedIn, isSeller, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const navigate      = useNavigate()
  const location      = useLocation()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [searchQuery, setSearch]  = useState('')

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setMenuOpen(false)
    }
  }

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">

      {/* ── Top bar ── */}
      <div className="bg-primary-500 text-white text-xs py-1.5 text-center hidden sm:block">
        🛍️ Free shipping on orders over 500 ETB &nbsp;·&nbsp; Shop local Ethiopian products
      </div>

      {/* ── Main navbar ── */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ዘ</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-gray-800">Zenbil</span>
              <span className="text-xs text-gray-400 block leading-none">ዘንቢል</span>
            </div>
          </Link>

          {/* Search bar — desktop */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
            <div className="flex w-full border border-gray-200 rounded-xl overflow-hidden
                            focus-within:border-primary-400 focus-within:ring-2
                            focus-within:ring-primary-100 transition-all">
              <input
                value={searchQuery}
                onChange={e => setSearch(e.target.value)}
                type="text"
                placeholder="Search products, shops..."
                className="flex-1 px-4 py-2.5 text-sm outline-none bg-white text-gray-700"
              />
              <button type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-white px-5 font-medium
                           text-sm transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Cart */}
            <Link to="/cart"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl
                         hover:bg-gray-50 text-gray-600 hover:text-primary-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:block text-sm font-medium">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white
                                 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User section — desktop */}
            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-1">
                {isSeller && (
                  <Link to="/seller/dashboard"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                               font-medium text-gray-600 hover:text-primary-500 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard
                  </Link>
                )}
                {!isSeller && !isAdmin && (
                  <Link to="/orders"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                               font-medium text-gray-600 hover:text-primary-500 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Orders
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                               font-medium text-gray-600 hover:text-primary-500 hover:bg-gray-50 transition-colors">
                    ⚙️ Admin
                  </Link>
                )}

                {/* User avatar dropdown */}
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200 ml-1">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100
                                  border border-primary-200 flex items-center
                                  justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name}
                        className="w-full h-full object-cover" />
                    ) : (
                      user?.full_name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-gray-700 leading-none">
                      {user?.full_name?.split(' ')[0]}
                    </p>
                    <p className="text-xs text-gray-400 capitalize leading-none mt-0.5">
                      {user?.role}
                    </p>
                  </div>
                  <button onClick={handleLogout}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors px-1">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-primary-500 px-3 py-2
                             rounded-xl hover:bg-gray-50 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(o => !o)}
              className="sm:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors">
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="flex border border-gray-200 rounded-xl overflow-hidden">
            <input
              value={searchQuery}
              onChange={e => setSearch(e.target.value)}
              type="text"
              placeholder="Search products..."
              className="flex-1 px-4 py-2.5 text-sm outline-none"
            />
            <button type="submit"
              className="bg-primary-500 text-white px-4 text-sm font-medium">
              Search
            </button>
          </form>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100
                                border border-primary-200 flex items-center
                                justify-center text-primary-600 font-bold flex-shrink-0">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name}
                      className="w-full h-full object-cover" />
                  ) : (
                    user?.full_name?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{user?.full_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>

              {isSeller && (
                <Link to="/seller/dashboard" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700">
                  📊 Seller Dashboard
                </Link>
              )}
              {!isSeller && !isAdmin && (
                <>
                  <Link to="/orders" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700">
                    📦 My Orders
                  </Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700">
                    👤 My Profile
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700">
                  ⚙️ Admin Panel
                </Link>
              )}
              <Link to="/cart" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700">
                🛒 Cart {cartCount > 0 && <span className="bg-primary-500 text-white text-xs rounded-full px-1.5 py-0.5">{cartCount}</span>}
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-500 w-full text-left">
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary-500 text-white font-medium">
                Create Account
              </Link>
              <Link to="/seller/register" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-600">
                🏪 Register as Seller
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
