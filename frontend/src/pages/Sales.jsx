import React, { useEffect, useState } from 'react'
import { fetchProducts, fetchSales, recordSale } from '../api'

export default function Sales() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')

  const load = () => {
    fetchProducts().then(setProducts).catch(console.error)
    fetchSales().then(setSales).catch(console.error)
  }

  useEffect(() => { load() }, [])

  const handleSale = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await recordSale(Number(productId), Number(quantity))
      setProductId('')
      setQuantity(1)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <h1>Sales</h1>
      <div className="card">
        <h2>Record a Sale</h2>
        <form onSubmit={handleSale}>
          <div className="form-row">
            <div>
              <label>Product *</label>
              <select required value={productId} onChange={e => setProductId(e.target.value)}>
                <option value="">Select product...</option>
                {products.filter(p => p.stock > 0).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${Number(p.price).toFixed(2)} ({p.stock} in stock)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Quantity *</label>
              <input type="number" min="1" required value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn-success">Record Sale</button>
        </form>
      </div>

      <div className="card">
        <h2>Sale History</h2>
        {sales.length === 0 ? (
          <p style={{ color: '#888' }}>No sales recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Total</th><th>Date</th></tr>
            </thead>
            <tbody>
              {[...sales].reverse().map(s => (
                <tr key={s.id}>
                  <td>{s.product?.name}</td>
                  <td>{s.quantity}</td>
                  <td>${Number(s.totalPrice).toFixed(2)}</td>
                  <td>{new Date(s.soldAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
