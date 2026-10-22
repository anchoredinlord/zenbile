import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'

// Pages
import HomePage             from './pages/HomePage'
import ProductsPage         from './pages/ProductsPage'
import ProductDetailPage    from './pages/ProductDetailPage'
import CartPage             from './pages/CartPage'
import CheckoutPage         from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import LoginPage            from './pages/LoginPage'
import RegisterPage         from './pages/RegisterPage'
import SellerRegisterPage   from './pages/SellerRegisterPage'
import SellerDashboardPage  from './pages/SellerDashboardPage'
import AddProductPage       from './pages/AddProductPage'
import OrdersPage           from './pages/OrdersPage'
import AdminDashboardPage  from './pages/AdminDashboardPage'

// Route guards
function RequireAuth({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return null
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function RequireSeller({ children }) {
  const { isLoggedIn, isSeller, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!isSeller && !isAdmin) return <Navigate to="/" replace />
  return children
}

function RequireAdmin({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/"              element={<HomePage />} />
          <Route path="/products"      element={<ProductsPage />} />
          <Route path="/products/:id"  element={<ProductDetailPage />} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/register"      element={<RegisterPage />} />
          <Route path="/seller/register" element={<SellerRegisterPage />} />

          {/* Requires login */}
          <Route path="/cart"     element={<RequireAuth><CartPage /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/orders/:reference" element={<RequireAuth><OrderConfirmationPage /></RequireAuth>} />

          {/* Seller only */}
          <Route path="/seller/dashboard"
            element={<RequireSeller><SellerDashboardPage /></RequireSeller>} />
          <Route path="/seller/products/new"
            element={<RequireSeller><AddProductPage /></RequireSeller>} />
          <Route path="/seller/products/:id/edit"
            element={<RequireSeller><AddProductPage /></RequireSeller>} />

          {/* Admin only */}
          <Route path="/admin"
            element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />

          {/* 404 */}
          <Route path="*" element={
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🤔</p>
              <p className="text-gray-500">Page not found</p>
            </div>
          } />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          © 2026 Zenbil — Ethiopian Online Marketplace
        </div>
      </footer>
    </div>
  )
}
