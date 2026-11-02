/**
 * src/utils/api.js
 * ─────────────────
 * Axios API client configured to talk to the FastAPI backend.
 *
 * All API calls go through this file so:
 * - The base URL is in one place (easy to change for production)
 * - JWT tokens are attached automatically to every request
 * - 401 errors log the user out automatically
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',   // proxied to http://localhost:8000/api/v1 by Vite
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — attach JWT token ─────────────────────────────────
// Before every request, read the token from localStorage and add it
// to the Authorization header. If there's no token, the header is omitted.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zenbil_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — handle auth errors ─────────────────────────────
// If the server returns 401 (token expired or invalid), clear the stored
// token and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('zenbil_token')
      localStorage.removeItem('zenbil_user')
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Typed API functions ────────────────────────────────────────────────────
// Each function corresponds to one backend endpoint.
// Keeping them here makes it easy to find and update API calls.

export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  me:            ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
}

export const productsAPI = {
  list:        (params)   => api.get('/products/', { params }),
  get:         (id)       => api.get(`/products/${id}`),
  categories:  ()         => api.get('/products/categories'),
  // Seller
  myProducts:  ()         => api.get('/products/my/products'),
  create:      (data)     => api.post('/products/', data),
  update:      (id, data) => api.put(`/products/${id}`, data),
  delete:      (id)       => api.delete(`/products/${id}`),
  uploadImage: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/products/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteImage: (productId, imageId) =>
    api.delete(`/products/${productId}/images/${imageId}`),
}

export const cartAPI = {
  get:    ()       => api.get('/orders/cart'),
  add:    (data)   => api.post('/orders/cart/items', data),
  remove: (itemId) => api.delete(`/orders/cart/items/${itemId}`),
}

export const ordersAPI = {
  checkout:    (data)      => api.post('/orders/checkout', data),
  myOrders:    ()          => api.get('/orders/my'),
  getOrder:    (reference) => api.get(`/orders/my/${reference}`),
  // Seller
  sellerOrders:      ()         => api.get('/orders/seller'),
  updateOrderStatus: (id, data) => api.put(`/orders/seller/${id}/status`, data),
}

export const sellersAPI = {
  register:     (data)      => api.post('/sellers/register', data),
  myProfile:    ()          => api.get('/sellers/me'),
  updateShop:   (data)      => api.put('/sellers/me/shop', data),
  publicShop:   (slug)      => api.get(`/sellers/shops/${slug}`),
  shopTypes:    ()          => api.get('/sellers/shop-types'),
  byType:       (shopType)  => api.get(`/sellers/by-type/${shopType}`),
}

export const reviewsAPI = {
  getProductReviews: (productId)       => api.get(`/reviews/products/${productId}`),
  canReview:         (productId)       => api.get(`/reviews/products/${productId}/can-review`),
  submitReview:      (productId, data) => api.post(`/reviews/products/${productId}`, data),
  deleteReview:      (reviewId)        => api.delete(`/reviews/${reviewId}`),
}
