import { Routes, Route, NavLink } from 'react-router-dom'
import { EventProvider, useEvent } from './EventContext'
import './App.css'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import BoothVisualiser from './pages/BoothVisualiser'
import Events from './pages/Events'

function EventSelector() {
  const { events, activeEventId, setActiveEventId } = useEvent()
  return (
    <div className="event-selector">
      <label>Event:</label>
      <select
        value={activeEventId ?? ''}
        onChange={e => setActiveEventId(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">All Events</option>
        {events.map(ev => (
          <option key={ev.id} value={ev.id}>{ev.name}</option>
        ))}
      </select>
    </div>
  )
}

function AppInner() {
  return (
    <>
      <nav>
        <NavLink to="/" className="brand">🎨 Artist Alley Booth</NavLink>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/inventory">Inventory</NavLink>
        <NavLink to="/sales">Sales</NavLink>
        <NavLink to="/booth">Booth</NavLink>
        <NavLink to="/events">Events</NavLink>
        <EventSelector />
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/booth" element={<BoothVisualiser />} />
          <Route path="/events" element={<Events />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <EventProvider>
      <AppInner />
    </EventProvider>
  )
}
