/**
 * src/context/CartContext.jsx
 * ────────────────────────────
 * Global cart state — item count shown in the navbar.
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { cartAPI } from '../utils/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isLoggedIn } = useAuth()
  const [cartCount, setCartCount] = useState(0)
  const [cart, setCart] = useState(null)

  const fetchCart = async () => {
    if (!isLoggedIn) { setCartCount(0); return }
    try {
      const res = await cartAPI.get()
      setCart(res.data)
      setCartCount(res.data.item_count || 0)
    } catch {
      setCartCount(0)
    }
  }

  useEffect(() => { fetchCart() }, [isLoggedIn])

  const addToCart = async (productId, quantity = 1) => {
    await cartAPI.add({ product_id: productId, quantity })
    await fetchCart()
  }

  const removeFromCart = async (itemId) => {
    await cartAPI.remove(itemId)
    await fetchCart()
  }

  return (
    <CartContext.Provider value={{ cart, cartCount, addToCart, removeFromCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
