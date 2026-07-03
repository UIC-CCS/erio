import { useState, useEffect } from 'react'
import { Save, Plus, Trash2 } from 'lucide-react'
import { dashboardAPI, partnersAPI, activitiesAPI, engagementAPI, programOfferingsAPI } from '../../services/api'

export default function AdminStats() {
  const [stats, setStats] = useState({
    partnerUniversities: 76,
    activeAgreements: 65,
    studentExchanges: 892,
    eventsThisYear: 32,
    regionalDistribution: { asiaPacific: 88, europe: 7, americas: 5 },
    programsOffered: { exchange: 68, research: 24, summer: 18 },
    engagementScore: 9.2
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [selectedProgrammeType, setSelectedProgrammeType] = useState('exchange')
  const [programmeItems, setProgrammeItems] = useState([])
  const [programmeLoading, setProgrammeLoading] = useState(false)
  const [programmeForm, setProgrammeForm] = useState({
    title: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await dashboardAPI.getStats()

        // Fetch real partner count from database
        try {
          const partners = await partnersAPI.getAll()
          statsData.partnerUniversities = partners.length
        } catch (error) {
          console.debug('Using stats partner count from database')
        }

        // Calculate engagement score automatically
        try {
          const engagementScore = await engagementAPI.calculateEngagementScore()
          statsData.engagementScore = engagementScore
        } catch (error) {
          console.debug('Error calculating engagement score, using stored value')
        }

        setStats(statsData)
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }
    loadStats()
  }, [])

  // Load programme offerings for selected type
  useEffect(() => {
    const loadProgrammes = async () => {
      setProgrammeLoading(true)
      try {
        const items = await programOfferingsAPI.getByType(selectedProgrammeType)
        setProgrammeItems(items)
      } catch (error) {
        console.error('Error loading programme offerings:', error)
        setProgrammeItems([])
      } finally {
        setProgrammeLoading(false)
      }
    }
    loadProgrammes()
  }, [selectedProgrammeType])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      await dashboardAPI.updateStats(stats)
      setIsSaving(false)
      setSaveMessage('Changes saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving data:', error)
      setIsSaving(false)
      setSaveMessage('Error saving changes. Please try again.')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleAddProgramme = async () => {
    if (!programmeForm.title.trim()) {
      alert('Please enter a programme title.')
      return
    }
    try {
      const created = await programOfferingsAPI.create({
        programType: selectedProgrammeType,
        title: programmeForm.title.trim(),
        startDate: programmeForm.startDate || null,
        endDate: programmeForm.endDate || null
      })
      setProgrammeItems((prev) => [...prev, created])
      setProgrammeForm({ title: '', startDate: '', endDate: '' })
    } catch (error) {
      console.error('Error adding programme offering:', error)
      alert('Error adding programme. Please try again.')
    }
  }

  const handleDeleteProgramme = async (id) => {
    if (!window.confirm('Delete this programme?')) return
    try {
      await programOfferingsAPI.delete(id)
      setProgrammeItems((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Error deleting programme offering:', error)
      alert('Error deleting programme. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 shadow-glass-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
              Dashboard Statistics
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-0.5">
              Edit dashboard statistics and metrics
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="glass-strong px-6 py-3 rounded-2xl font-semibold text-white gradient-pink hover:shadow-glass-lg transition-glass disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        {saveMessage && (
          <div className={`mt-4 glass-card rounded-xl p-3 ${saveMessage.includes('Error')
            ? 'bg-red-50/50 border border-red-200/50'
            : 'bg-green-50/50 border border-green-200/50'
            }`}>
            <p className={`text-sm text-center ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'
              }`}>{saveMessage}</p>
          </div>
        )}
      </div>

      {/* Key Statistics */}
      <div className="glass-card rounded-3xl p-6 shadow-glass">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Key Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Partner Universities
              <span className="text-xs text-gray-500 font-normal"> (Auto-calculated)</span>
            </label>
            <input
              type="number"
              value={stats.partnerUniversities}
              disabled
              className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none bg-gray-100/50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-600 mt-1">This is automatically counted from your Partner Universities list. Add or remove partners to update this value.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Agreements
            </label>
            <input
              type="number"
              value={stats.activeAgreements}
              onChange={(e) => setStats({ ...stats, activeAgreements: parseInt(e.target.value) || 0 })}
              className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Exchanges
            </label>
            <input
              type="number"
              value={stats.studentExchanges}
              onChange={(e) => setStats({ ...stats, studentExchanges: parseInt(e.target.value) || 0 })}
              className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Events This Year
            </label>
            <input
              type="number"
              value={stats.eventsThisYear}
              onChange={(e) => setStats({ ...stats, eventsThisYear: parseInt(e.target.value) || 0 })}
              className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
        </div>
      </div>

      {/* Regional Distribution */}
      <div className="glass-card rounded-3xl p-6 shadow-glass">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Regional Distribution (%)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asia Pacific
            </label>
            <input
              type="number"
              value={stats.regionalDistribution.asiaPacific}
              onChange={(e) => setStats({
                ...stats,
                regionalDistribution: {
                  ...stats.regionalDistribution,
                  asiaPacific: parseFloat(e.target.value) || 0
                }
              })}
              className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Europe
            </label>
            <input
              type="number"
              value={stats.regionalDistribution.europe}
              onChange={(e) => setStats({
                ...stats,
                regionalDistribution: {
                  ...stats.regionalDistribution,
                  europe: parseFloat(e.target.value) || 0
                }
              })}
              className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Americas
            </label>
            <input
              type="number"
              value={stats.regionalDistribution.americas}
              onChange={(e) => setStats({
                ...stats,
                regionalDistribution: {
                  ...stats.regionalDistribution,
                  americas: parseFloat(e.target.value) || 0
                }
              })}
              className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
        </div>
      </div>

      {/* Programs Offered */}
      <div className="glass-card rounded-3xl p-6 shadow-glass">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Programs Offered</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exchange Programs
            </label>
            <input
              type="number"
              value={stats.programsOffered.exchange}
              onChange={(e) => setStats({
                ...stats,
                programsOffered: {
                  ...stats.programsOffered,
                  exchange: parseInt(e.target.value) || 0
                }
              })}
              className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Programs
            </label>
            <input
              type="number"
              value={stats.programsOffered.research}
              onChange={(e) => setStats({
                ...stats,
                programsOffered: {
                  ...stats.programsOffered,
                  research: parseInt(e.target.value) || 0
                }
              })}
              className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summer Programs
            </label>
            <input
              type="number"
              value={stats.programsOffered.summer}
              onChange={(e) => setStats({
                ...stats,
                programsOffered: {
                  ...stats.programsOffered,
                  summer: parseInt(e.target.value) || 0
                }
              })}
              className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
        </div>
      </div>

      {/* Programme Details (titles and durations) */}
      <div className="glass-card rounded-3xl p-6 shadow-glass">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Programme Details</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedProgrammeType('exchange')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                selectedProgrammeType === 'exchange'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/60 text-gray-700'
              }`}
            >
              Exchange
            </button>
            <button
              type="button"
              onClick={() => setSelectedProgrammeType('research')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                selectedProgrammeType === 'research'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/60 text-gray-700'
              }`}
            >
              Research
            </button>
            <button
              type="button"
              onClick={() => setSelectedProgrammeType('summer')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                selectedProgrammeType === 'summer'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/60 text-gray-700'
              }`}
            >
              Summer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1.2fr_auto] gap-3 items-end mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Programme Title
            </label>
            <input
              type="text"
              value={programmeForm.title}
              onChange={(e) => setProgrammeForm({ ...programmeForm, title: e.target.value })}
              className="w-full glass px-4 py-2 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
              placeholder="e.g. Summer School in Tokyo"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={programmeForm.startDate}
              onChange={(e) => setProgrammeForm({ ...programmeForm, startDate: e.target.value })}
              className="w-full glass px-3 py-2 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={programmeForm.endDate}
              onChange={(e) => setProgrammeForm({ ...programmeForm, endDate: e.target.value })}
              className="w-full glass px-3 py-2 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddProgramme}
              className="glass-strong px-4 py-2 rounded-xl font-semibold text-white gradient-pink hover:shadow-glass-lg transition-glass flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-white/20 pt-4">
          {programmeLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
            </div>
          ) : programmeItems.length === 0 ? (
            <p className="text-sm text-gray-500">
              No programmes added yet for this category.
            </p>
          ) : (
            <div className="space-y-2">
              {programmeItems.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-600">
                      {item.startDate
                        ? `${item.startDate}${item.endDate ? ` – ${item.endDate}` : ''}`
                        : 'Duration not specified'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteProgramme(item.id)}
                    className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:glass-strong"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Engagement Score */}
      <div className="glass-card rounded-3xl p-6 shadow-glass">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Engagement Score</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Score (out of 10)
            <span className="text-xs text-gray-500 font-normal"> (Auto-calculated)</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={stats.engagementScore}
            disabled
            className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none bg-gray-100/50 cursor-not-allowed"
          />
          <p className="text-xs text-gray-600 mt-2">
            <strong>Calculation formula:</strong> (Partners ÷ 100 × 2) + (Agreements ÷ 80 × 2.5) + (Exchanges ÷ 1000 × 3) + (Events ÷ 40 × 1.5) + (Activities ÷ 15 × 1)
          </p>
          <p className="text-xs text-gray-600 mt-1">
            This score automatically updates based on your actual engagement metrics. The score increases as you add more partners, agreements, student exchanges, events, and activities.
          </p>
        </div>
      </div>
    </div>
  )
}
