import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/api'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '', full_name: '', phone: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const update = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authAPI.register(form)
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
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
          <h1 className="text-2xl font-bold text-gray-800">Create an account</h1>
          <p className="text-gray-400 text-sm mt-1">Start shopping from local Ethiopian sellers</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
              <input name="full_name" value={form.full_name} onChange={update}
                required className="input-field" placeholder="Your full name" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
              <input name="email" type="email" value={form.email} onChange={update}
                required className="input-field" placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone Number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input name="phone" value={form.phone} onChange={update}
                className="input-field" placeholder="09xxxxxxxx" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <input name="password" type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={update}
                  required className="input-field pr-12"
                  placeholder="At least 8 characters" />
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
              className="w-full btn-primary py-3 text-base mt-2">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account...
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-500 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
