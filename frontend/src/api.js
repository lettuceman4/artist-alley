const BASE = '/api'

// Booth Layouts
export async function fetchBoothLayouts(eventId) {
  const url = eventId ? `${BASE}/booth-layouts?eventId=${eventId}` : `${BASE}/booth-layouts`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch layouts')
  return res.json()
}

export async function saveBoothLayout(name, layoutJson, eventId) {
  const res = await fetch(`${BASE}/booth-layouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, layoutJson, eventId: eventId || null })
  })
  if (!res.ok) throw new Error('Failed to save layout')
  return res.json()
}

export async function deleteBoothLayout(id) {
  const res = await fetch(`${BASE}/booth-layouts/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete layout')
}

// Events
export async function fetchEvents() {
  const res = await fetch(`${BASE}/events`)
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

export async function createEvent(data) {
  const res = await fetch(`${BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create event')
  return res.json()
}

export async function updateEvent(id, data) {
  const res = await fetch(`${BASE}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update event')
  return res.json()
}

export async function deleteEvent(id) {
  const res = await fetch(`${BASE}/events/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete event')
}

// Products
export async function fetchCategories() {
  const res = await fetch(`${BASE}/products/categories`)
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

export async function fetchProducts() {
  const res = await fetch(`${BASE}/products`)
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

export async function importProductsExcel(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/products/import`, { method: 'POST', body: form })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || 'Failed to import file')
  }
  return res.json()
}

export async function createBulkProducts(data) {
  const res = await fetch(`${BASE}/products/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create products')
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

// Sales
export async function fetchSales(eventId) {
  const url = eventId ? `${BASE}/sales?eventId=${eventId}` : `${BASE}/sales`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch sales')
  return res.json()
}

export async function recordSale(productId, quantity, eventId) {
  const res = await fetch(`${BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity, eventId: eventId || null })
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || 'Failed to record sale')
  }
  return res.json()
}

export async function fetchSummary(eventId) {
  const url = eventId ? `${BASE}/sales/summary?eventId=${eventId}` : `${BASE}/sales/summary`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch summary')
  return res.json()
}
