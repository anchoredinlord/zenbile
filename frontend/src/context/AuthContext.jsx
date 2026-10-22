/**
 * src/context/AuthContext.jsx
 * ────────────────────────────
 * Global authentication state shared across the whole app.
 *
 * What this does:
 * - Stores the logged-in user and JWT token
 * - Persists them to localStorage so login survives page refresh
 * - Provides login() and logout() functions to any component
 *
 * Any component can call:
 *   const { user, login, logout, isLoggedIn } = useAuth()
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  // On app startup, check if there's a saved token and load the user
  useEffect(() => {
    const token = localStorage.getItem('zenbil_token')
    const savedUser = localStorage.getItem('zenbil_user')

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('zenbil_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password })
    const { access_token, user: userData } = response.data

    // Save to localStorage so it persists across page refreshes
    localStorage.setItem('zenbil_token', access_token)
    localStorage.setItem('zenbil_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('zenbil_token')
    localStorage.removeItem('zenbil_user')
    setUser(null)
  }

  const isLoggedIn = !!user
  const isSeller   = user?.role === 'seller'
  const isAdmin    = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn, isSeller, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
