import React, { useEffect, useState } from 'react'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../api'

const empty = { name: '', category: '', stock: '', price: '', imageUrl: '' }

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')

  const load = () => fetchProducts().then(setProducts).catch(console.error)
  useEffect(() => { load() }, [])

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
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (p) => {
    setEditId(p.id)
    setForm({ name: p.name, category: p.category || '', stock: p.stock, price: p.price, imageUrl: p.imageUrl || '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await deleteProduct(id)
    load()
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
              <label>Category</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Stickers" />
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
            {editId && <button type="button" onClick={() => { setEditId(null); setForm(empty) }}>Cancel</button>}
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
              <tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
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
