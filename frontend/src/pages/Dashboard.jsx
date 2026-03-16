import React, { useEffect, useState } from 'react'
import { fetchSummary, fetchProducts } from '../api'

export default function Dashboard() {
  const [summary, setSummary] = useState({ totalRevenue: 0, totalItemsSold: 0, totalTransactions: 0 })
  const [lowStock, setLowStock] = useState([])

  useEffect(() => {
    fetchSummary().then(setSummary).catch(console.error)
    fetchProducts().then(products => {
      setLowStock(products.filter(p => p.stock <= 3))
    }).catch(console.error)
  }, [])

  return (
    <>
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total Revenue</div>
          <div className="value">${Number(summary.totalRevenue).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Items Sold</div>
          <div className="value">{summary.totalItemsSold}</div>
        </div>
        <div className="stat-card">
          <div className="label">Transactions</div>
          <div className="value">{summary.totalTransactions}</div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card">
          <h2>⚠️ Low Stock Alert</h2>
          <table>
            <thead>
              <tr><th>Product</th><th>Category</th><th>Stock</th></tr>
            </thead>
            <tbody>
              {lowStock.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.category || '—'}</td>
                  <td><span className="badge badge-low">{p.stock} left</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
