import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { productsAPI } from '../utils/api'

export default function AddProductPage() {
  const navigate    = useNavigate()
  const { id }      = useParams()          // Present when editing
  const isEdit      = !!id
  const [categories, setCategories] = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [imageFile, setImageFile] = useState(null)

  const [form, setForm] = useState({
    name: '', description: '', price: '', stock_quantity: '',
    category_id: '', available_sizes: '', available_colors: '', status: 'draft',
  })

  useEffect(() => {
    productsAPI.categories().then(r => setCategories(r.data))
    if (isEdit) {
      productsAPI.get(id).then(r => {
        const p = r.data
        setForm({
          name: p.name, description: p.description || '',
          price: p.price, stock_quantity: p.stock_quantity,
          category_id: p.category_id || '', available_sizes: p.available_sizes || '',
          available_colors: p.available_colors || '', status: p.status,
        })
      })
    }
  }, [id])

  const update = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      }

      let productId = id
      if (isEdit) {
        await productsAPI.update(id, payload)
      } else {
        const res = await productsAPI.create(payload)
        productId = res.data.id
      }

      // Upload image if selected
      if (imageFile && productId) {
        await productsAPI.uploadImage(productId, imageFile)
      }

      navigate('/seller/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input name="name" value={form.name} onChange={update}
            required className="input-field" placeholder="e.g. Classic Brown Leather Shoes" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={update}
            className="input-field" rows={3} placeholder="Describe your product..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (ETB) *</label>
            <input name="price" type="number" step="0.01" min="1" value={form.price} onChange={update}
              required className="input-field" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
            <input name="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={update}
              required className="input-field" placeholder="0" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category_id" value={form.category_id} onChange={update} className="input-field">
            <option value="">— Select category —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Available Sizes</label>
          <input name="available_sizes" value={form.available_sizes} onChange={update}
            className="input-field" placeholder="e.g. 40, 41, 42, 43" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Available Colors</label>
          <input name="available_colors" value={form.available_colors} onChange={update}
            className="input-field" placeholder="e.g. Black, Brown, White" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select name="status" value={form.status} onChange={update} className="input-field">
            <option value="draft">Draft (not visible)</option>
            <option value="active">Active (visible to customers)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Photo</label>
          <input type="file" accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
              file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600
              hover:file:bg-primary-100" />
          <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP. Max 5MB.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/seller/dashboard')}
            className="flex-1 btn-secondary py-2.5">Cancel</button>
          <button type="submit" disabled={loading}
            className="flex-1 btn-primary py-2.5">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
