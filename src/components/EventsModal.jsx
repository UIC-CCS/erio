import { useState, useEffect } from 'react'
import { X, Calendar, MapPin, FileText } from 'lucide-react'
import { eventsAPI } from '../services/api'

export default function EventsModal({ onClose }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    eventsAPI
      .getAll()
      .then((data) => {
        if (!cancelled) setEvents(data)
      })
      .catch(() => {
        if (!cancelled) setEvents([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleClose = () => onClose?.()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      <div className="glass-card rounded-3xl p-8 md:p-10 shadow-glass-lg max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col relative z-10">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 right-6 w-11 h-11 rounded-full glass-card flex items-center justify-center hover:glass-strong transition-glass shadow-glass-sm text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-pink flex items-center justify-center shadow-glass-sm">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Events This Year
          </h1>
          <p className="text-gray-600 text-sm">
            {events.length} event{events.length !== 1 ? 's' : ''} this year
          </p>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 space-y-3 pr-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No events scheduled yet.</p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="glass rounded-xl p-5 border border-white/30 space-y-3"
              >
                <h3 className="font-semibold text-lg text-gray-800">{event.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  {event.eventDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      {event.eventDate}
                    </span>
                  )}
                  {event.place && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {event.place}
                    </span>
                  )}
                </div>
                {event.shortDescription && (
                  <p className="text-sm text-gray-700 flex items-start gap-2">
                    <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{event.shortDescription}</span>
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
