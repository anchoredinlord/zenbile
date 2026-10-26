import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/api'

export default function ProfilePage() {
  const { user, login }   = useAuth()
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone:     user?.phone     || '',
  })

  const update = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      await authAPI.updateProfile(form)
      // Refresh user data in context
      const res = await authAPI.me()
      const updated = res.data
      localStorage.setItem('zenbil_user', JSON.stringify(updated))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

      {/* Account info card */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center
                          text-2xl font-bold text-primary-600 flex-shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.full_name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block
              ${user?.role === 'admin'  ? 'bg-purple-100 text-purple-700' :
                user?.role === 'seller' ? 'bg-blue-100 text-blue-700' :
                                          'bg-green-100 text-green-700'}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Edit Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input name="full_name" value={form.full_name} onChange={update}
            className="input-field" placeholder="Your full name" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input name="phone" value={form.phone} onChange={update}
            className="input-field" placeholder="09xxxxxxxx" />
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500">
          <p className="font-medium text-gray-600 mb-0.5">Email address</p>
          <p>{user?.email}</p>
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
            ✓ Profile updated successfully
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
