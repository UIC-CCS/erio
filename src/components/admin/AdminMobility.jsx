import { useState, useEffect } from 'react'
import { Plus, Trash2, Users, UserCircle } from 'lucide-react'
import { mobilityProgrammesAPI } from '../../services/api'

const TYPE_OPTIONS = [
  { value: 'student_exchange', label: 'Student Exchange' },
  { value: 'faculty_exchange', label: 'Faculty Exchange' }
]

const DIRECTION_OPTIONS = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' }
]

const emptyProgramme = () => ({
  programmeName: '',
  programmeDate: '',
  place: '',
  numberOfStudents: 0,
  type: 'student_exchange',
  direction: 'outbound'
})

export default function AdminMobility() {
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyProgramme())

  useEffect(() => {
    loadProgrammes()
  }, [])

  const loadProgrammes = async () => {
    try {
      const data = await mobilityProgrammesAPI.getAll()
      setProgrammes(data)
    } catch (error) {
      console.error('Error loading mobility programmes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingId('new')
    setForm(emptyProgramme())
  }

  const handleEdit = (prog) => {
    setEditingId(prog.id)
    setForm({
      programmeName: prog.programmeName,
      programmeDate: prog.programmeDate,
      place: prog.place,
      numberOfStudents: prog.numberOfStudents ?? 0,
      type: prog.type,
      direction: prog.direction
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(emptyProgramme())
  }

  const handleSave = async () => {
    if (!form.programmeName.trim()) {
      alert('Please enter a programme name.')
      return
    }
    try {
      if (editingId === 'new') {
        const created = await mobilityProgrammesAPI.create(form)
        setProgrammes([created, ...programmes])
      } else {
        const updated = await mobilityProgrammesAPI.update(editingId, form)
        setProgrammes(programmes.map((p) => (p.id === editingId ? updated : p)))
      }
      handleCancelEdit()
    } catch (error) {
      console.error('Error saving mobility programme:', error)
      alert('Error saving. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this mobility programme?')) return
    try {
      await mobilityProgrammesAPI.delete(id)
      setProgrammes(programmes.filter((p) => p.id !== id))
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
              Mobility Programme
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-0.5">
              Manage Faculty Exchange and Student Exchange (Inbound / Outbound). Data appears in the public Mobility Programme pop-up.
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="glass-strong px-5 py-2.5 rounded-xl font-semibold text-white gradient-pink hover:shadow-glass-lg transition-glass flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Programme
          </button>
        </div>
      </div>

      {(editingId === 'new' || editingId) && (
        <div className="glass-card rounded-2xl p-6 shadow-glass">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId === 'new' ? 'New mobility programme' : 'Edit programme'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Programme name</label>
              <input
                type="text"
                value={form.programmeName}
                onChange={(e) => updateForm('programmeName', e.target.value)}
                className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="e.g. Exchange with Universiti Malaya"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="text"
                value={form.programmeDate}
                onChange={(e) => updateForm('programmeDate', e.target.value)}
                className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="e.g. 2025-01-15 or January 2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
              <input
                type="text"
                value={form.place}
                onChange={(e) => updateForm('place', e.target.value)}
                className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="e.g. Kuala Lumpur, Malaysia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of participants</label>
              <input
                type="number"
                min="0"
                value={form.numberOfStudents}
                onChange={(e) => updateForm('numberOfStudents', parseInt(e.target.value, 10) || 0)}
                className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => updateForm('type', e.target.value)}
                className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
              <select
                value={form.direction}
                onChange={(e) => updateForm('direction', e.target.value)}
                className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
              >
                {DIRECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
        {programmes.length === 0 && !editingId && (
          <p className="text-gray-500 text-center py-8">No mobility programmes yet. Click “Add Programme” to add one.</p>
        )}
        {programmes.map((prog) => (
          <div
            key={prog.id}
            className={`glass-card rounded-2xl p-5 shadow-glass ${editingId === prog.id ? 'ring-2 ring-pink-300' : ''}`}
          >
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {prog.type === 'faculty_exchange' ? (
                    <UserCircle className="w-5 h-5 text-pink-600 flex-shrink-0" />
                  ) : (
                    <Users className="w-5 h-5 text-pink-600 flex-shrink-0" />
                  )}
                  <span className="font-semibold text-gray-800">{prog.programmeName}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-0.5">
                  {prog.programmeDate && <p>Date: {prog.programmeDate}</p>}
                  {prog.place && <p>Place: {prog.place}</p>}
                  <p>Participants: {prog.numberOfStudents}</p>
                  <p className="capitalize">
                    {prog.type.replace('_', ' ')} · {prog.direction}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(prog)}
                  className="px-3 py-2 rounded-lg glass hover:glass-strong text-sm font-medium text-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(prog.id)}
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
