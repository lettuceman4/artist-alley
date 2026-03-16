import { createContext, useContext, useEffect, useState } from 'react'
import { fetchEvents } from './api'

const EventContext = createContext(null)

export function EventProvider({ children }) {
  const [events, setEvents] = useState([])
  const [activeEventId, setActiveEventId] = useState(null)

  const reload = () => fetchEvents().then(list => {
    setEvents(list)
    // auto-select first event if none selected
    setActiveEventId(prev => prev ?? (list[0]?.id ?? null))
  }).catch(console.error)

  useEffect(() => { reload() }, [])

  return (
    <EventContext.Provider value={{ events, activeEventId, setActiveEventId, reload }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEvent() {
  return useContext(EventContext)
}
