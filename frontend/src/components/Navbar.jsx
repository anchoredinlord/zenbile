import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout, isLoggedIn, isSeller, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const navigate      = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl font-bold text-primary-500">ዘንቢል</span>
            <span className="text-lg font-semibold text-gray-700 hidden sm:block">Zenbil</span>
          </Link>

          {/* Desktop search */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <form onSubmit={(e) => {
              e.preventDefault()
              const q = e.target.q.value.trim()
              if (q) navigate(`/products?search=${encodeURIComponent(q)}`)
            }}>
              <div className="relative">
                <input name="q" type="text" placeholder="Search products..."
                  className="input-field pl-10 pr-4" />
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
              </div>
            </form>
          </div>

          {/* Right side — desktop */}
          <div className="flex items-center gap-2">

            {/* Cart icon */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-500">
              <span className="text-xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white
                                 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Desktop nav links */}
            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                {isSeller && (
                  <Link to="/seller/dashboard"
                    className="text-sm text-gray-600 hover:text-primary-500 px-2">
                    Dashboard
                  </Link>
                )}
                {!isSeller && !isAdmin && (
                  <>
                    <Link to="/orders"
                      className="text-sm text-gray-600 hover:text-primary-500 px-2">
                      Orders
                    </Link>
                    <Link to="/profile"
                      className="text-sm text-gray-600 hover:text-primary-500 px-2">
                      Profile
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link to="/admin"
                    className="text-sm text-gray-600 hover:text-primary-500 px-2">
                    Admin
                  </Link>
                )}
                <span className="text-sm text-gray-500 px-1">
                  {user?.full_name?.split(' ')[0]}
                </span>
                <button onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-1.5 px-3">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 px-3">Sign up</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="sm:hidden p-2 text-gray-600 hover:text-primary-500"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <form onSubmit={(e) => {
            e.preventDefault()
            const q = e.target.q.value.trim()
            if (q) { navigate(`/products?search=${encodeURIComponent(q)}`); setMenuOpen(false) }
          }}>
            <div className="relative">
              <input name="q" type="text" placeholder="Search products..."
                className="input-field pl-10 pr-4" />
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-2">
          {isLoggedIn ? (
            <>
              <p className="text-xs text-gray-400 pb-1 border-b border-gray-100">
                Signed in as {user?.full_name} · {user?.role}
              </p>
              {isSeller && (
                <Link to="/seller/dashboard" onClick={() => setMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-primary-500 font-medium">
                  📊 Dashboard
                </Link>
              )}
              {!isSeller && !isAdmin && (
                <>
                  <Link to="/orders" onClick={() => setMenuOpen(false)}
                    className="block py-2 text-gray-700 hover:text-primary-500 font-medium">
                    📦 My Orders
                  </Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}
                    className="block py-2 text-gray-700 hover:text-primary-500 font-medium">
                    👤 My Profile
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-primary-500 font-medium">
                  ⚙️ Admin Panel
                </Link>
              )}
              <Link to="/cart" onClick={() => setMenuOpen(false)}
                className="block py-2 text-gray-700 hover:text-primary-500 font-medium">
                🛒 Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
              <button onClick={handleLogout}
                className="block w-full text-left py-2 text-red-500 font-medium">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="block py-2 text-gray-700 hover:text-primary-500 font-medium">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="block py-2 text-gray-700 hover:text-primary-500 font-medium">Register</Link>
              <Link to="/seller/register" onClick={() => setMenuOpen(false)}
                className="block py-2 text-gray-700 hover:text-primary-500 font-medium">Register as Seller</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
