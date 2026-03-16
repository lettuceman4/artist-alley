import { useEffect, useState } from 'react'
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchCategories } from '../api'

const empty = { name: '', category: '', stock: '', price: '', imageUrl: '', productCode: '' }

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [customCategory, setCustomCategory] = useState(false)

  const load = () => fetchProducts().then(setProducts).catch(console.error)
  const loadCategories = () => fetchCategories().then(setCategories).catch(console.error)

  useEffect(() => { load(); loadCategories() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = { ...form, stock: Number(form.stock), price: Number(form.price) }
      if (editId) {
        await updateProduct(editId, data)
      } else {
        await createProduct(data)
      }
      setForm(empty)
      setEditId(null)
      setCustomCategory(false)
      load()
      loadCategories()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (p) => {
    setEditId(p.id)
    const cat = p.category || ''
    setCustomCategory(cat !== '' && !categories.includes(cat))
    setForm({ name: p.name, category: cat, stock: p.stock, price: p.price, imageUrl: p.imageUrl || '', productCode: p.productCode || '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await deleteProduct(id)
    load()
    loadCategories()
  }

  const handleCategorySelect = (e) => {
    const val = e.target.value
    if (val === '__new__') {
      setCustomCategory(true)
      setForm({ ...form, category: '' })
    } else {
      setCustomCategory(false)
      setForm({ ...form, category: val })
    }
  }

  return (
    <>
      <h1>Inventory</h1>
      <div className="card">
        <h2>{editId ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label>Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sticker Pack" />
            </div>
            <div>
              <label>Code Prefix {editId ? '' : '(e.g. GI)'}</label>
              <input
                value={form.productCode}
                onChange={e => setForm({ ...form, productCode: e.target.value.toUpperCase() })}
                placeholder="e.g. GI"
                maxLength={10}
                disabled={!!editId}
                title={editId ? 'Product code cannot be changed after creation' : ''}
              />
              {!editId && form.productCode && (
                <small style={{ color: '#888' }}>Will be assigned e.g. {form.productCode.toUpperCase()}1, {form.productCode.toUpperCase()}2…</small>
              )}
            </div>
            <div>
              <label>Category</label>
              {customCategory ? (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <input
                    autoFocus
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="New category name"
                  />
                  <button type="button" onClick={() => { setCustomCategory(false); setForm({ ...form, category: '' }) }} title="Back to list">✕</button>
                </div>
              ) : (
                <select value={form.category} onChange={handleCategorySelect}>
                  <option value="">— None —</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__new__">+ Add new category…</option>
                </select>
              )}
            </div>
            <div>
              <label>Stock *</label>
              <input required type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div>
              <label>Price ($) *</label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add Product'}</button>
            {editId && <button type="button" onClick={() => { setEditId(null); setForm(empty); setCustomCategory(false) }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Products ({products.length})</h2>
        {products.length === 0 ? (
          <p style={{ color: '#888' }}>No products yet. Add one above.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td><code>{p.productCode || '—'}</code></td>
                  <td>{p.name}</td>
                  <td>{p.category || '—'}</td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${p.stock <= 3 ? 'badge-low' : 'badge-ok'}`}>{p.stock}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-primary btn-sm" onClick={() => startEdit(p)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
