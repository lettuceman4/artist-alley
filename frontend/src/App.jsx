import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import BoothVisualiser from './pages/BoothVisualiser'

export default function App() {
  return (
    <>
      <nav>
        <NavLink to="/" className="brand">🎨 Artist Alley Booth</NavLink>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/inventory">Inventory</NavLink>
        <NavLink to="/sales">Sales</NavLink>
        <NavLink to="/booth">Booth</NavLink>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/booth" element={<BoothVisualiser />} />
        </Routes>
      </main>
    </>
  )
}
