import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const update = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(form.email, form.password)
      if (user.role === 'seller') navigate('/seller/dashboard')
      else if (user.role === 'admin') navigate('/admin')
      else navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500
                          rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">ዘ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your Zenbil account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <input name="email" type="email" value={form.email} onChange={update}
                required autoFocus
                className="input-field"
                placeholder="you@example.com" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
              </div>
              <div className="relative">
                <input name="password" type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={update}
                  required className="input-field pr-12"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm
                              rounded-xl p-3 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 text-base">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-500 font-semibold hover:underline">
                Create account
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Want to sell?{' '}
              <Link to="/seller/register" className="text-primary-500 font-semibold hover:underline">
                Register your shop
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
