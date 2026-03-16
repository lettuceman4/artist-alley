import { useEffect, useState } from 'react'
import { utils as xlsxUtils, writeFile as xlsxWriteFile } from 'xlsx'
import { fetchProducts, createProduct, createBulkProducts, updateProduct, deleteProduct, fetchCategories, importProductsExcel } from '../api'
import './Inventory.css'

const emptyRow = () => ({ name: '', stock: '', price: '', productCode: '' })
const emptySingle = { name: '', category: '', stock: '', price: '', imageUrl: '', productCode: '', supplier: '', printingCost: '' }

// ── Category selector (shared between single + bulk) ──────────────────────────
function CategoryField({ value, onChange, categories }) {
  const [custom, setCustom] = useState(false)

  useEffect(() => {
    if (value && !categories.includes(value)) setCustom(true)
    else setCustom(false)
  }, [categories])

  if (custom) return (
    <div className="category-field-row">
      <input autoFocus value={value} onChange={e => onChange(e.target.value)} placeholder="New category name" />
      <button type="button" onClick={() => { setCustom(false); onChange('') }} title="Back to list">✕</button>
    </div>
  )

  return (
    <select value={value} onChange={e => {
      if (e.target.value === '__new__') { setCustom(true); onChange('') }
      else onChange(e.target.value)
    }}>
      <option value="">— None —</option>
      {categories.map(c => <option key={c} value={c}>{c}</option>)}
      <option value="__new__">+ Add new category…</option>
    </select>
  )
}

function downloadSample() {
  const ws = xlsxUtils.aoa_to_sheet([
    ['name', 'category', 'supplier', 'price', 'stock', 'printingCost', 'codePrefix'],
    ['Genshin Impact Sticker Pack', 'Stickers', 'Printify', 5.00, 30, 1.20, 'GI'],
    ['Anime Keychain Set', 'Keychains', 'Printify', 8.50, 20, 2.50, 'AK'],
    ['Art Print A4', 'Prints', 'Local Print', 12.00, 15, 3.00, 'AP'],
    ['Enamel Pin Badge', 'Pins', 'PinMart', 7.00, 25, 1.80, 'EP'],
    ['Washi Tape Roll', 'Stationery', 'Washi Co', 4.50, 40, 0.90, 'WT'],
  ])
  ws['!cols'] = [20, 16, 14, 8, 8, 14, 12].map(w => ({ wch: w }))
  const wb = xlsxUtils.book_new()
  xlsxUtils.book_append_sheet(wb, ws, 'Products')
  xlsxWriteFile(wb, 'sample_inventory.xlsx')
}

function ImportSection({ onImported }) {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setStatus('')
    try {
      const result = await importProductsExcel(file)
      setStatus(`✓ Imported ${result.length} product${result.length !== 1 ? 's' : ''} successfully.`)
      onImported()
    } catch (err) {
      setStatus(`✗ ${err.message}`)
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="card">
      <h2>Import from Excel</h2>
      <p className="inv-import-desc">
        Upload a <code>.xlsx</code> file with columns: <code>name, category, supplier, price, stock, printingCost, codePrefix</code>
      </p>
      <div className="inv-import-actions">
        <label className="btn-primary inv-import-file-label">
          {loading ? 'Importing…' : '📂 Choose .xlsx file'}
          <input type="file" accept=".xlsx" onChange={handleFile} style={{ display: 'none' }} disabled={loading} />
        </label>
        <button onClick={downloadSample} className="inv-import-sample-btn">
          ⬇ Download sample
        </button>
      </div>
      {status && <p className={`inv-import-status ${status.startsWith('✓') ? 'success' : 'error'}`}>{status}</p>}
    </div>
  )
}

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [bulkMode, setBulkMode] = useState(false)

  // single form
  const [form, setForm] = useState(emptySingle)

  // bulk form — shared fields + rows
  const [shared, setShared] = useState({ category: '', supplier: '', printingCost: '', productCode: '' })
  const [rows, setRows] = useState([emptyRow(), emptyRow()])

  const load = () => fetchProducts().then(setProducts).catch(console.error)
  const loadCategories = () => fetchCategories().then(setCategories).catch(console.error)
  useEffect(() => { load(); loadCategories() }, [])

  // ── Single submit ────────────────────────────────────────────────────────────
  const handleSingleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = { ...form, stock: Number(form.stock), price: Number(form.price), printingCost: form.printingCost !== '' ? Number(form.printingCost) : null }
      if (editId) await updateProduct(editId, data)
      else await createProduct(data)
      setForm(emptySingle)
      setEditId(null)
      load(); loadCategories()
    } catch (err) { setError(err.message) }
  }

  // ── Bulk submit ──────────────────────────────────────────────────────────────
  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const filled = rows.filter(r => r.name.trim())
    if (!filled.length) { setError('Add at least one product name.'); return }
    try {
      const payload = filled.map(r => ({
        name: r.name.trim(),
        stock: Number(r.stock) || 0,
        price: Number(r.price) || 0,
        productCode: (r.productCode || shared.productCode).toUpperCase() || null,
        category: shared.category || null,
        supplier: shared.supplier || null,
        printingCost: shared.printingCost !== '' ? Number(shared.printingCost) : null,
      }))
      await createBulkProducts(payload)
      setRows([emptyRow(), emptyRow()])
      setShared({ category: '', supplier: '', printingCost: '', productCode: '' })
      load(); loadCategories()
    } catch (err) { setError(err.message) }
  }

  const startEdit = (p) => {
    setBulkMode(false)
    setEditId(p.id)
    const cat = p.category || ''
    setForm({ name: p.name, category: cat, stock: p.stock, price: p.price, imageUrl: p.imageUrl || '', productCode: p.productCode || '', supplier: p.supplier || '', printingCost: p.printingCost ?? '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await deleteProduct(id)
    load(); loadCategories()
  }

  const updateRow = (i, field, val) => setRows(rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  const addRow = () => setRows([...rows, emptyRow()])
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i))

  return (
    <>
      <h1>Inventory</h1>
      <div className="card">
        <div className="inv-card-header">
          <h2>{editId ? 'Edit Product' : bulkMode ? 'Bulk Add Products' : 'Add Product'}</h2>
          {!editId && (
            <button type="button" onClick={() => { setBulkMode(!bulkMode); setError('') }} className="inv-toggle-btn">
              {bulkMode ? '← Single add' : '+ Bulk add'}
            </button>
          )}
        </div>

        {/* ── Single / Edit form ── */}
        {(!bulkMode || editId) && (
          <form onSubmit={handleSingleSubmit}>
            <div className="form-row">
              <div>
                <label>Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sticker Pack" />
              </div>
              <div>
                <label>Code Prefix {editId ? '' : '(e.g. GI)'}</label>
                <input value={form.productCode} onChange={e => setForm({ ...form, productCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. GI" maxLength={10} disabled={!!editId}
                  title={editId ? 'Product code cannot be changed after creation' : ''} />
                {!editId && form.productCode && (
                  <small className="inv-code-hint">e.g. {form.productCode}1, {form.productCode}2…</small>
                )}
              </div>
              <div>
                <label>Category</label>
                <CategoryField value={form.category} onChange={v => setForm({ ...form, category: v })} categories={categories} />
              </div>
              <div>
                <label>Stock *</label>
                <input required type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div>
                <label>Price ($) *</label>
                <input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label>Supplier</label>
                <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="e.g. Printify" />
              </div>
              <div>
                <label>Printing Cost ($)</label>
                <input type="number" min="0" step="0.01" value={form.printingCost} onChange={e => setForm({ ...form, printingCost: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="inv-form-actions">
              <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add Product'}</button>
              {editId && <button type="button" onClick={() => { setEditId(null); setForm(emptySingle) }}>Cancel</button>}
            </div>
          </form>
        )}

        {/* ── Bulk add form ── */}
        {bulkMode && !editId && (
          <form onSubmit={handleBulkSubmit}>
            {/* Shared fields */}
            <div className="form-row inv-bulk-shared">
              <div>
                <label>Category (shared)</label>
                <CategoryField value={shared.category} onChange={v => setShared({ ...shared, category: v })} categories={categories} />
              </div>
              <div>
                <label>Supplier (shared)</label>
                <input value={shared.supplier} onChange={e => setShared({ ...shared, supplier: e.target.value })} placeholder="e.g. Printify" />
              </div>
              <div>
                <label>Printing Cost $ (shared)</label>
                <input type="number" min="0" step="0.01" value={shared.printingCost} onChange={e => setShared({ ...shared, printingCost: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label>Code Prefix (shared)</label>
                <input value={shared.productCode} onChange={e => setShared({ ...shared, productCode: e.target.value.toUpperCase() })} placeholder="e.g. GI" maxLength={10} />
                {shared.productCode && <small className="inv-code-hint">e.g. {shared.productCode}1, {shared.productCode}2…</small>}
              </div>
            </div>

            {/* Per-product rows */}
            <table className="inv-bulk-table">
              <thead>
                <tr>
                  <th>Name *</th>
                  <th>Stock</th>
                  <th>Price ($)</th>
                  <th>Code Prefix override</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <input value={row.name} onChange={e => updateRow(i, 'name', e.target.value)} placeholder="Product name" />
                    </td>
                    <td>
                      <input type="number" min="0" value={row.stock} onChange={e => updateRow(i, 'stock', e.target.value)} className="input-stock" />
                    </td>
                    <td>
                      <input type="number" min="0" step="0.01" value={row.price} onChange={e => updateRow(i, 'price', e.target.value)} className="input-price" />
                    </td>
                    <td>
                      <input value={row.productCode} onChange={e => updateRow(i, 'productCode', e.target.value.toUpperCase())}
                        placeholder={shared.productCode || '—'} maxLength={10} className="input-code" />
                    </td>
                    <td>
                      {rows.length > 1 && (
                        <button type="button" onClick={() => removeRow(i)} className="btn-danger btn-sm">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button type="button" onClick={addRow} className="inv-add-row-btn">+ Add row</button>

            {error && <div className="error">{error}</div>}
            <div className="inv-bulk-submit">
              <button type="submit" className="btn-primary">Add {rows.filter(r => r.name.trim()).length || ''} Products</button>
            </div>
          </form>
        )}
      </div>

      <ImportSection onImported={() => { load(); loadCategories() }} />

      <div className="card">
        <h2>Products ({products.length})</h2>
        {products.length === 0 ? (
          <p className="inv-empty">No products yet. Add one above.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th>Category</th><th>Supplier</th><th>Print Cost</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td><code>{p.productCode || '—'}</code></td>
                  <td>{p.name}</td>
                  <td>{p.category || '—'}</td>
                  <td>{p.supplier || '—'}</td>
                  <td>{p.printingCost != null ? `$${Number(p.printingCost).toFixed(2)}` : '—'}</td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td><span className={`badge ${p.stock <= 3 ? 'badge-low' : 'badge-ok'}`}>{p.stock}</span></td>
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
