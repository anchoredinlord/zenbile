import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout, isLoggedIn, isSeller, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-500">ዘንቢል</span>
            <span className="text-lg font-semibold text-gray-700 hidden sm:block">Zenbil</span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <form onSubmit={(e) => {
              e.preventDefault()
              const q = e.target.q.value.trim()
              if (q) navigate(`/products?search=${encodeURIComponent(q)}`)
            }}>
              <div className="relative">
                <input
                  name="q"
                  type="text"
                  placeholder="Search products..."
                  className="input-field pl-10 pr-4"
                />
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
              </div>
            </form>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-500">
              <span className="text-xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white
                                 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                {isSeller && (
                  <Link to="/seller/dashboard"
                    className="text-sm text-gray-600 hover:text-primary-500 hidden sm:block">
                    Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin"
                    className="text-sm text-gray-600 hover:text-primary-500 hidden sm:block">
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 hidden sm:block">
                    {user?.full_name?.split(' ')[0]}
                  </span>
                  <button onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-500 transition-colors">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-1.5 px-3">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 px-3">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
