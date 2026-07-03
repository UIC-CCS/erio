import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { eventsAPI } from '../../services/api'

const emptyEvent = () => ({
  title: '',
  place: '',
  eventDate: '',
  shortDescription: ''
})

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyEvent())

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const data = await eventsAPI.getAll()
      setEvents(data)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingId('new')
    setForm(emptyEvent())
  }

  const handleEdit = (event) => {
    setEditingId(event.id)
    setForm({
      title: event.title,
      place: event.place,
      eventDate: event.eventDate,
      shortDescription: event.shortDescription
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(emptyEvent())
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('Please enter an event title.')
      return
    }
    try {
      if (editingId === 'new') {
        const created = await eventsAPI.create(form)
        setEvents([created, ...events])
      } else {
        const updated = await eventsAPI.update(editingId, form)
        setEvents(events.map((e) => (e.id === editingId ? updated : e)))
      }
      handleCancelEdit()
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Error saving. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return
    try {
      await eventsAPI.delete(id)
      setEvents(events.filter((e) => e.id !== id))
      if (editingId === id) handleCancelEdit()
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error deleting. Please try again.')
    }
  }

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex justify-center min-h-[400px] items-center">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-6 shadow-glass-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
              Events This Year
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-0.5">
              Manage events for this year. Data appears in the public Events This Year pop-up.
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="glass-strong px-5 py-2.5 rounded-xl font-semibold text-white gradient-pink hover:shadow-glass-lg transition-glass flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {(editingId === 'new' || editingId) && (
        <div className="glass-card rounded-2xl p-6 shadow-glass">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId === 'new' ? 'New event' : 'Edit event'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="e.g. International Conference 2025"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="text"
                  value={form.eventDate}
                  onChange={(e) => updateForm('eventDate', e.target.value)}
                  className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
                  placeholder="e.g. March 15, 2025 or 2025-03-15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                <input
                  type="text"
                  value={form.place}
                  onChange={(e) => updateForm('place', e.target.value)}
                  className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
                  placeholder="e.g. UIC Main Campus, Davao City"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
              <textarea
                value={form.shortDescription}
                onChange={(e) => updateForm('shortDescription', e.target.value)}
                className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80 resize-none"
                rows="3"
                placeholder="Brief description of the event..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              className="glass-strong px-4 py-2 rounded-xl font-semibold text-white gradient-pink hover:shadow-glass-lg"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="glass px-4 py-2 rounded-xl font-medium text-gray-700 hover:glass-strong"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {events.length === 0 && !editingId && (
          <p className="text-gray-500 text-center py-8">No events yet. Click "Add Event" to add one.</p>
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className={`glass-card rounded-2xl p-5 shadow-glass ${editingId === event.id ? 'ring-2 ring-pink-300' : ''}`}
          >
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-pink-600 flex-shrink-0" />
                  <span className="font-semibold text-gray-800 text-lg">{event.title}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {event.eventDate && <p>Date: {event.eventDate}</p>}
                  {event.place && <p>Place: {event.place}</p>}
                  {event.shortDescription && (
                    <p className="text-gray-700 mt-2">{event.shortDescription}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(event)}
                  className="px-3 py-2 rounded-lg glass hover:glass-strong text-sm font-medium text-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:glass-strong text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
