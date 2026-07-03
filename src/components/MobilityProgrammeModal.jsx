import { useState, useEffect } from 'react'
import { X, Users, ChevronLeft, Calendar, MapPin, UserCircle } from 'lucide-react'
import { mobilityProgrammesAPI } from '../services/api'

const PROGRAMME_TYPES = [
  { id: 'faculty_exchange', label: 'Faculty Exchange', icon: UserCircle },
  { id: 'student_exchange', label: 'Student Exchange', icon: Users }
]

const DIRECTIONS = [
  { id: 'inbound', label: 'Inbound' },
  { id: 'outbound', label: 'Outbound' }
]

export default function MobilityProgrammeModal({ onClose }) {
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('type') // 'type' | 'direction' | 'list'
  const [selectedType, setSelectedType] = useState(null)
  const [selectedDirection, setSelectedDirection] = useState(null)

  useEffect(() => {
    let cancelled = false
    mobilityProgrammesAPI
      .getAll()
      .then((data) => {
        if (!cancelled) setProgrammes(data)
      })
      .catch(() => {
        if (!cancelled) setProgrammes([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleClose = () => onClose?.()

  const handleTypeClick = (typeId) => {
    setSelectedType(typeId)
    setSelectedDirection(null)
    setView('direction')
  }

  const handleDirectionClick = (directionId) => {
    setSelectedDirection(directionId)
    setView('list')
  }

  const backToDirection = () => {
    setView('direction')
    setSelectedDirection(null)
  }

  const backToType = () => {
    setView('type')
    setSelectedType(null)
    setSelectedDirection(null)
  }

  const typeLabel = PROGRAMME_TYPES.find((t) => t.id === selectedType)?.label ?? ''
  const directionLabel = DIRECTIONS.find((d) => d.id === selectedDirection)?.label ?? ''

  const countByType = (typeId) => programmes.filter((p) => p.type === typeId).length
  const countByDirection = (directionId) =>
    programmes.filter((p) => p.type === selectedType && p.direction === directionId).length
  const totalCount = programmes.length

  const listProgrammes =
    selectedType && selectedDirection
      ? programmes.filter(
          (p) => p.type === selectedType && p.direction === selectedDirection
        )
      : []

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
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Mobility Programme
          </h1>
          <p className="text-gray-600 text-sm">
            {view === 'type' && `Select programme type (${totalCount} total)`}
            {view === 'direction' && `${typeLabel} — Select direction`}
            {view === 'list' && `${typeLabel} · ${directionLabel}`}
          </p>
        </div>

        {view === 'type' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROGRAMME_TYPES.map((item) => {
              const Icon = item.icon
              const count = countByType(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTypeClick(item.id)}
                  className="glass rounded-2xl p-6 flex flex-col items-center gap-3 hover:glass-strong transition-glass shadow-glass-sm border border-white/30 text-gray-800 text-center"
                >
                  <div className="w-14 h-14 rounded-xl gradient-pink flex items-center justify-center">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-sm font-medium text-pink-600">{count} programme{count !== 1 ? 's' : ''}</span>
                </button>
              )
            })}
          </div>
        )}

        {view === 'direction' && selectedType && (
          <>
            <button
              type="button"
              onClick={backToType}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to programme type
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DIRECTIONS.map((dir) => {
                const count = countByDirection(dir.id)
                return (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => handleDirectionClick(dir.id)}
                    className="glass rounded-2xl p-6 flex flex-col items-center gap-2 hover:glass-strong transition-glass shadow-glass-sm border border-white/30 text-gray-800 text-center"
                  >
                    <span className="font-semibold">{dir.label}</span>
                    <span className="text-sm font-medium text-pink-600">{count} programme{count !== 1 ? 's' : ''}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {view === 'list' && (
          <>
            <button
              type="button"
              onClick={backToDirection}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to direction
            </button>
            <div className="overflow-y-auto flex-1 min-h-0 space-y-3 pr-1">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
                </div>
              ) : listProgrammes.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  No programmes in this category yet.
                </p>
              ) : (
                listProgrammes.map((prog) => (
                  <div
                    key={prog.id}
                    className="glass rounded-xl p-4 border border-white/30 space-y-2"
                  >
                    <p className="font-semibold text-gray-800">{prog.programmeName}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      {prog.programmeDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          {prog.programmeDate}
                        </span>
                      )}
                      {prog.place && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          {prog.place}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Number of participants:</span>{' '}
                      {prog.numberOfStudents}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
