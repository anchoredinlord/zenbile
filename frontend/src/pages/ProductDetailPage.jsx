import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productsAPI } from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty]         = useState(1)
  const [adding, setAdding]   = useState(false)
  const [added, setAdded]     = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const { addToCart } = useCart()
  const { isLoggedIn } = useAuth()

  useEffect(() => {
    productsAPI.get(id)
      .then(r => setProduct(r.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleAdd = async () => {
    if (!isLoggedIn) { window.location.href = '/login'; return }
    setAdding(true)
    try {
      await addToCart(product.id, qty)
      setAdded(true)
      setTimeout(() => setAdded(false), 3000)
    } catch (e) {
      alert(e.response?.data?.detail || 'Could not add to cart')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-3">😕</p>
      <p className="text-gray-500">Product not found</p>
      <Link to="/products" className="text-primary-500 mt-4 inline-block">← Back to products</Link>
    </div>
  )

  const images = product.images || []
  const mainImage = images[selectedImage]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-primary-500">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-primary-500">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3">
            {mainImage ? (
              <img
                src={`/uploads/products/${mainImage.filename}`}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-8xl">👟</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors
                    ${i === selectedImage ? 'border-primary-500' : 'border-transparent'}`}>
                  <img src={`/uploads/products/${img.filename}`} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>

          <div className="text-3xl font-bold text-primary-500 mb-4">
            {product.price?.toLocaleString()} ETB
          </div>

          {product.description && (
            <p className="text-gray-600 mb-4 leading-relaxed">{product.description}</p>
          )}

          {/* Variants */}
          {product.available_sizes && (
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">Available Sizes: </span>
              <span className="text-sm text-gray-500">{product.available_sizes}</span>
            </div>
          )}
          {product.available_colors && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">Colors: </span>
              <span className="text-sm text-gray-500">{product.available_colors}</span>
            </div>
          )}

          {/* Stock */}
          <div className="mb-6">
            {product.stock_quantity > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                ✓ In stock ({product.stock_quantity} available)
              </span>
            ) : (
              <span className="text-sm text-red-500 font-medium">Out of stock</span>
            )}
          </div>

          {/* Quantity + Add to cart */}
          {product.stock_quantity > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 font-bold">−</button>
                <span className="px-4 py-2 font-medium">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 font-bold">+</button>
              </div>

              <button
                onClick={handleAdd}
                disabled={adding}
                className={`flex-1 py-2.5 px-6 rounded-xl font-semibold transition-all text-white
                  ${added ? 'bg-green-500' : 'bg-primary-500 hover:bg-primary-600'}`}>
                {adding ? 'Adding...' : added ? '✓ Added to cart!' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* Subtotal */}
          {qty > 1 && (
            <p className="text-sm text-gray-400">
              Subtotal: <strong className="text-gray-700">{(product.price * qty).toLocaleString()} ETB</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
