import { useState } from 'react'
import { createEvent, updateEvent, deleteEvent } from '../api'
import { useEvent } from '../EventContext'
import './Events.css'

const empty = { name: '', eventDate: '', location: '' }

export default function Events() {
  const { events, reload } = useEvent()
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editId) {
        await updateEvent(editId, form)
      } else {
        await createEvent(form)
      }
      setForm(empty)
      setEditId(null)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (ev) => {
    setEditId(ev.id)
    setForm({ name: ev.name, eventDate: ev.eventDate || '', location: ev.location || '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event? Sales linked to it will lose their event association.')) return
    await deleteEvent(id)
    reload()
  }

  return (
    <>
      <h1>Events</h1>
      <div className="card">
        <h2>{editId ? 'Edit Event' : 'Add Event'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label>Event Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Anime Expo 2026" />
            </div>
            <div>
              <label>Date</label>
              <input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} />
            </div>
            <div>
              <label>Location</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Convention Center Hall B" />
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="events-form-actions">
            <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add Event'}</button>
            {editId && <button type="button" onClick={() => { setEditId(null); setForm(empty) }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Events ({events.length})</h2>
        {events.length === 0 ? (
          <p className="events-empty">No events yet. Add one above.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Date</th><th>Location</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td>{ev.name}</td>
                  <td>{ev.eventDate || '—'}</td>
                  <td>{ev.location || '—'}</td>
                  <td>
                    <div className="actions">
                      <button className="btn-primary btn-sm" onClick={() => startEdit(ev)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(ev.id)}>Delete</button>
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
