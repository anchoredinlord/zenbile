import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/api'

export default function ProfilePage() {
  const { user, login }     = useAuth()
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone:     user?.phone     || '',
    email:     user?.email     || '',
  })

  const update = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // Save profile changes (name, phone, email)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await authAPI.updateProfile({
        full_name: form.full_name,
        phone:     form.phone,
        email:     form.email !== user?.email ? form.email : undefined,
      })
      // Update localStorage with new user data
      localStorage.setItem('zenbil_user', JSON.stringify(res.data))
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Upload profile photo
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const res = await authAPI.uploadAvatar(file)
      // Update localStorage with new avatar_url
      localStorage.setItem('zenbil_user', JSON.stringify(res.data))
      setSuccess('Profile photo updated!')
      setTimeout(() => setSuccess(''), 4000)
      // Force re-render by reloading user from storage
      window.location.reload()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const avatarUrl = user?.avatar_url

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account details and photo</p>
      </div>

      {/* Profile photo section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        <h2 className="font-bold text-gray-700 mb-4">Profile Photo</h2>

        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-primary-100
                            border-2 border-primary-200 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile"
                  className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary-500">
                  {user?.full_name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            {/* Upload overlay button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 hover:bg-primary-600
                         text-white rounded-full flex items-center justify-center shadow-md
                         transition-colors disabled:opacity-50">
              {uploading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Upload instructions */}
          <div>
            <p className="font-medium text-gray-700 text-sm mb-1">
              {uploading ? 'Uploading...' : 'Upload your photo'}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              JPG, PNG or WebP · Maximum 3MB
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-sm py-2 px-4 disabled:opacity-50">
              {avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Account details section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-700 mb-4">Account Details</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Full Name
            </label>
            <input name="full_name" value={form.full_name} onChange={update}
              className="input-field" placeholder="Your full name" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Address
              <span className="ml-2 text-xs font-normal text-gray-400">
                (you will log in with this email)
              </span>
            </label>
            <input name="email" type="email" value={form.email} onChange={update}
              className="input-field" placeholder="your@email.com" />
            {form.email !== user?.email && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                ⚠️ You will need to use this new email to log in next time
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Phone Number
              <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input name="phone" value={form.phone} onChange={update}
              className="input-field" placeholder="09xxxxxxxx" />
          </div>

          {/* Account info (read-only) */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Account type</span>
              <span className="font-semibold text-gray-700 capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Member since</span>
              <span className="font-semibold text-gray-700">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-ET', {
                      year: 'numeric', month: 'long'
                    })
                  : '—'}
              </span>
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm
                            rounded-xl p-3 flex items-center gap-2">
              ✓ {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm
                            rounded-xl p-3 flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={saving} className="w-full btn-primary py-3">
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
