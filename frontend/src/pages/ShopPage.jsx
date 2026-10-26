import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { sellersAPI, productsAPI } from '../utils/api'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function ShopPage() {
  const { slug }        = useParams()
  const [shop, setShop]         = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const shopRes = await sellersAPI.publicShop(slug)
        setShop(shopRes.data)
        // Load products for this specific shop
        const prodRes = await productsAPI.list({ shop_id: shopRes.data.id, page_size: 50 })
        setProducts(prodRes.data.products || [])
      } catch (e) {
        if (e.response?.status === 404) setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading)  return <LoadingSpinner />
  if (notFound) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">🏪</p>
      <h1 className="text-xl font-bold text-gray-700 mb-2">Shop not found</h1>
      <p className="text-gray-400 mb-6">This shop may have been removed or the link is incorrect.</p>
      <Link to="/products" className="btn-primary px-6 py-2.5">Browse All Products</Link>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Shop header */}
      <div className="card p-6 mb-8">
        <div className="flex items-start gap-5 flex-wrap">

          {/* Shop logo or placeholder */}
          <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center
                          text-4xl flex-shrink-0 border-2 border-primary-100">
            {shop.logo_url
              ? <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover rounded-2xl" />
              : '🏪'}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-800">{shop.name}</h1>

            {shop.location && (
              <p className="text-gray-500 text-sm mt-1">📍 {shop.location}</p>
            )}
            {shop.phone && (
              <p className="text-gray-500 text-sm mt-0.5">📞 {shop.phone}</p>
            )}
            {shop.description && (
              <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-xl">
                {shop.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="text-center bg-gray-50 rounded-xl px-6 py-3 flex-shrink-0">
            <p className="text-2xl font-bold text-primary-500">{products.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Products</p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">All Products</h2>
        <Link to="/products" className="text-sm text-primary-500 hover:text-primary-600">
          ← Back to marketplace
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No products yet"
          message="This shop hasn't listed any products yet"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
