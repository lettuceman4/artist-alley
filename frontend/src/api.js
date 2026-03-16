const BASE = '/api'

export async function fetchProducts() {
  const res = await fetch(`${BASE}/products`)
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

export async function createProduct(data) {
  const res = await fetch(`${BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create product')
  return res.json()
}

export async function updateProduct(id, data) {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update product')
  return res.json()
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE}/products/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete product')
}

export async function fetchSales() {
  const res = await fetch(`${BASE}/sales`)
  if (!res.ok) throw new Error('Failed to fetch sales')
  return res.json()
}

export async function recordSale(productId, quantity) {
  const res = await fetch(`${BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity })
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || 'Failed to record sale')
  }
  return res.json()
}

export async function fetchSummary() {
  const res = await fetch(`${BASE}/sales/summary`)
  if (!res.ok) throw new Error('Failed to fetch summary')
  return res.json()
}
