import { useEffect, useState } from 'react'
import { fetchProducts, fetchSales, recordSale } from '../api'
import { useEvent } from '../EventContext'

export default function Sales() {
  const { activeEventId, events } = useEvent()
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')

  const load = () => {
    fetchProducts().then(setProducts).catch(console.error)
    fetchSales(activeEventId).then(setSales).catch(console.error)
  }

  useEffect(() => { load() }, [activeEventId])

  const handleSale = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await recordSale(Number(productId), Number(quantity), activeEventId)
      setProductId('')
      setQuantity(1)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const activeEvent = events.find(e => e.id === activeEventId)

  return (
    <>
      <h1>Sales</h1>
      {activeEvent && (
        <p style={{ color: '#888', marginTop: '-0.5rem', marginBottom: '1rem' }}>
          Recording sales for: <strong>{activeEvent.name}</strong>
        </p>
      )}
      {!activeEventId && (
        <p style={{ color: '#f0a500', marginTop: '-0.5rem', marginBottom: '1rem' }}>
          ⚠️ No event selected — sales will not be linked to any event.
        </p>
      )}
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
                    {p.productCode ? `[${p.productCode}] ` : ''}{p.name} — ${Number(p.price).toFixed(2)} ({p.stock} in stock)
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
        <h2>Sale History {activeEvent ? `— ${activeEvent.name}` : '(All Events)'}</h2>
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
