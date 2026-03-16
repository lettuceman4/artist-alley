import React, { useEffect, useState, useRef } from 'react'
import { fetchProducts } from '../api'

const COLS = 8
const ROWS = 5
const CELL = 80

const COLORS = ['#6c3fc5','#27ae60','#e67e22','#2980b9','#e74c3c','#8e44ad','#16a085','#d35400']

function makeGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

export default function BoothVisualiser() {
  const [products, setProducts] = useState([])
  const [grid, setGrid] = useState(makeGrid)
  const [dragging, setDragging] = useState(null) // { productId, fromCell: [r,c] | null }
  const [colorMap, setColorMap] = useState({})

  useEffect(() => {
    fetchProducts().then(ps => {
      setProducts(ps)
      const map = {}
      ps.forEach((p, i) => { map[p.id] = COLORS[i % COLORS.length] })
      setColorMap(map)
    }).catch(console.error)
  }, [])

  const handleDragStart = (productId, fromCell = null) => {
    setDragging({ productId, fromCell })
  }

  const handleDrop = (r, c) => {
    if (!dragging) return
    const newGrid = grid.map(row => [...row])
    // remove from old cell if dragged from grid
    if (dragging.fromCell) {
      const [fr, fc] = dragging.fromCell
      newGrid[fr][fc] = null
    }
    newGrid[r][c] = dragging.productId
    setGrid(newGrid)
    setDragging(null)
  }

  const handleRemove = (r, c) => {
    const newGrid = grid.map(row => [...row])
    newGrid[r][c] = null
    setGrid(newGrid)
  }

  const clearGrid = () => setGrid(makeGrid())

  const productById = Object.fromEntries(products.map(p => [p.id, p]))

  const placedIds = new Set(grid.flat().filter(Boolean))

  return (
    <>
      <h1>Booth Visualiser</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Drag products onto the table grid to plan your booth layout.
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Product palette */}
        <div className="card" style={{ minWidth: 180, flex: '0 0 180px' }}>
          <h2>Products</h2>
          {products.length === 0 && <p style={{ color: '#888', fontSize: '0.85rem' }}>No products yet.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {products.map(p => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(p.id)}
                style={{
                  background: colorMap[p.id],
                  color: '#fff',
                  borderRadius: 8,
                  padding: '0.5rem 0.75rem',
                  cursor: 'grab',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  opacity: placedIds.has(p.id) ? 0.45 : 1,
                  userSelect: 'none',
                }}
                title={`Stock: ${p.stock}`}
              >
                {p.name}
                <span style={{ display: 'block', fontWeight: 400, fontSize: '0.75rem', opacity: 0.85 }}>
                  ${Number(p.price).toFixed(2)} · {p.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Table Layout</h2>
            <button onClick={clearGrid} style={{ background: '#eee', color: '#555', border: 'none', borderRadius: 6, padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              Clear
            </button>
          </div>

          {/* Table label */}
          <div style={{ textAlign: 'center', background: '#6c3fc5', color: '#fff', borderRadius: '8px 8px 0 0', padding: '0.4rem', fontSize: '0.8rem', fontWeight: 600, width: COLS * CELL }}>
            🎨 Your Table
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`, border: '2px solid #6c3fc5', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden', width: COLS * CELL }}
            onDragOver={e => e.preventDefault()}
          >
            {grid.map((row, r) =>
              row.map((cellId, c) => {
                const product = cellId ? productById[cellId] : null
                return (
                  <div
                    key={`${r}-${c}`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop(r, c)}
                    style={{
                      width: CELL,
                      height: CELL,
                      border: '1px solid #e8e0f5',
                      background: product ? colorMap[cellId] : (r % 2 === 0 ? '#faf8ff' : '#f5f0ff'),
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      transition: 'background 0.15s',
                    }}
                  >
                    {product ? (
                      <>
                        <div
                          draggable
                          onDragStart={() => handleDragStart(cellId, [r, c])}
                          style={{ cursor: 'grab', textAlign: 'center', padding: '0.25rem', userSelect: 'none' }}
                        >
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                            {product.name.length > 10 ? product.name.slice(0, 9) + '…' : product.name}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)' }}>
                            ${Number(product.price).toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(r, c)}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.25)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#fff', fontSize: 10, cursor: 'pointer', lineHeight: '16px', padding: 0 }}
                        >×</button>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.65rem', color: '#ccc' }}>{r + 1},{c + 1}</span>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '0.75rem' }}>
            {COLS} × {ROWS} grid · drag to move · × to remove
          </p>
        </div>
      </div>
    </>
  )
}
