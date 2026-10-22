import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { sellersAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function SellerRegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '',
    shop_name: '', shop_description: '', shop_location: '', shop_phone: '',
  })

  const update = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await sellersAPI.register(form)
      // Auto-login after registration
      await login(form.email, form.password)
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Shop Registered!</h1>
      <p className="text-gray-500 mb-6">
        Your shop application has been submitted. Our admin will review and approve it shortly.
        You'll be able to add products once approved.
      </p>
      <Link to="/seller/dashboard" className="btn-primary px-8 py-3">
        Go to Dashboard
      </Link>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <span className="text-4xl font-bold text-primary-500">ዘንቢል</span>
        <h1 className="text-xl font-semibold text-gray-800 mt-2">Register Your Shop</h1>
        <p className="text-gray-400 text-sm mt-1">Start selling to thousands of customers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Account info */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Your Account</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input name="full_name" value={form.full_name} onChange={update}
                required className="input-field" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input name="email" type="email" value={form.email} onChange={update}
                required className="input-field" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={update}
                className="input-field" placeholder="09xxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input name="password" type="password" value={form.password} onChange={update}
                required className="input-field" placeholder="At least 8 characters" />
            </div>
          </div>
        </div>

        {/* Shop info */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Your Shop</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
              <input name="shop_name" value={form.shop_name} onChange={update}
                required className="input-field" placeholder="e.g. Abebe Leather Goods" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="shop_description" value={form.shop_description} onChange={update}
                className="input-field" rows={3}
                placeholder="Tell customers what you sell..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input name="shop_location" value={form.shop_location} onChange={update}
                className="input-field" placeholder="e.g. Bole, Addis Ababa" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Phone</label>
              <input name="shop_phone" value={form.shop_phone} onChange={update}
                className="input-field" placeholder="09xxxxxxxx" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base">
          {loading ? 'Registering...' : 'Register Shop'}
        </button>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
