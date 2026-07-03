import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Edit2, X, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { partnersAPI } from '../../services/api'

const ROWS_PER_PAGE = 10
const GEOCODE_DEBOUNCE_MS = 800

async function geocodeCityCountry(city, country) {
  const query = [city, country].filter(Boolean).join(', ')
  if (!query.trim()) return null
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
  })
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'ERIO-Dashboard/1.0 (University International Office)' },
    }
  )
  if (!res.ok) return null
  const data = await res.json()
  const first = data?.[0]
  if (!first || first.lat == null || first.lon == null) return null
  return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
}

export default function AdminPartners() {
  const [partners, setPartners] = useState([])
  const [editingPartner, setEditingPartner] = useState(null)
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [geocoding, setGeocoding] = useState(false)
  const geocodeTimerRef = useRef(null)

  const latestQueryRef = useRef({ city: '', country: '' })
  const lastGeocodedRef = useRef('')

  useEffect(() => {
    loadPartners()
  }, [])

  // Auto-fill lat/lng from city and country (geocoding)
  useEffect(() => {
    if (!showPartnerForm || !editingPartner) return
    const city = (editingPartner.city || '').trim()
    const country = (editingPartner.country || '').trim()
    latestQueryRef.current = { city, country }
    if (!country) return
    const queryKey = `${city}|${country}`
    if (queryKey === lastGeocodedRef.current) return
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    geocodeTimerRef.current = setTimeout(async () => {
      geocodeTimerRef.current = null
      const { city: c, country: co } = latestQueryRef.current
      if (!co) return
      const key = `${(c || '').trim()}|${(co || '').trim()}`
      if (key === lastGeocodedRef.current) return
      lastGeocodedRef.current = key
      setGeocoding(true)
      try {
        const result = await geocodeCityCountry(c, co)
        if (result) {
          setEditingPartner((prev) =>
            prev ? { ...prev, lat: result.lat, lng: result.lng } : prev
          )
        }
      } catch (e) {
        console.error('Geocoding error:', e)
        lastGeocodedRef.current = ''
      } finally {
        setGeocoding(false)
      }
    }, GEOCODE_DEBOUNCE_MS)
    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    }
  }, [showPartnerForm, editingPartner?.city, editingPartner?.country])

  const loadPartners = async () => {
    try {
      const data = await partnersAPI.getAll()
      setPartners(data)
    } catch (error) {
      console.error('Error loading partners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPartner = () => {
    lastGeocodedRef.current = ''
    setEditingPartner({
      name: '',
      country: '',
      city: '',
      lat: 0,
      lng: 0,
      students: 0,
      programs: ['Student Exchange'],
      established: '',
      type: 'Comprehensive',
      signDate: '',
      expiryDate: ''
    })
    setShowPartnerForm(true)
  }

  const handleEditPartner = (partner) => {
    lastGeocodedRef.current = ''
    setEditingPartner({ ...partner })
    setShowPartnerForm(true)
  }

  const handleDeletePartner = async (id) => {
    if (window.confirm('Are you sure you want to delete this partner?')) {
      try {
        await partnersAPI.delete(id)
        setPartners(partners.filter(p => p.id !== id))
      } catch (error) {
        console.error('Error deleting partner:', error)
        alert('Error deleting partner. Please try again.')
      }
    }
  }

  const handleSavePartner = async () => {
    if (!editingPartner.name || !editingPartner.country) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const partnerData = {
        name: editingPartner.name,
        country: editingPartner.country,
        city: editingPartner.city || '',
        lat: editingPartner.lat || 0,
        lng: editingPartner.lng || 0,
        students: editingPartner.students || 0,
        programs: editingPartner.programs || ['Student Exchange'],
        established: editingPartner.established || '',
        type: editingPartner.type || 'Comprehensive',
        signDate: editingPartner.signDate || null,
        expiryDate: editingPartner.expiryDate || null
      }

      if (editingPartner.id) {
        const updated = await partnersAPI.update(editingPartner.id, partnerData)
        setPartners(partners.map(p => p.id === editingPartner.id ? updated : p))
      } else {
        const newPartner = await partnersAPI.create(partnerData)
        setPartners([...partners, newPartner])
      }
      setShowPartnerForm(false)
      setEditingPartner(null)
    } catch (error) {
      console.error('Error saving partner:', error)
      alert('Error saving partner. Please try again.')
    }
  }

  const filteredPartners = partners.filter((p) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase().trim()
    const name = (p.name || '').toLowerCase()
    const country = (p.country || '').toLowerCase()
    const city = (p.city || '').toLowerCase()
    return name.includes(term) || country.includes(term) || city.includes(term)
  })

  const totalPages = Math.max(1, Math.ceil(filteredPartners.length / ROWS_PER_PAGE))
  const pageStart = (currentPage - 1) * ROWS_PER_PAGE
  const pageEnd = pageStart + ROWS_PER_PAGE
  const currentPartners = filteredPartners.slice(pageStart, pageEnd)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 shadow-glass-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
              Partner Universities
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-0.5">
              Manage partner university information ({partners.length} partners)
            </p>
          </div>
          <button
            onClick={handleAddPartner}
            className="glass-strong px-5 py-2.5 rounded-xl font-semibold text-white gradient-pink hover:shadow-glass-lg transition-glass flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        </div>
        {/* Search bar */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, city, or country..."
              className="w-full glass pl-12 pr-4 py-2.5 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-200/80"
            />
          </div>
        </div>
      </div>

      {/* Partner Form */}
      {showPartnerForm && editingPartner && (
        <div className="glass-card rounded-3xl p-6 shadow-glass">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">
              {editingPartner.id ? 'Edit Partner' : 'Add New Partner'}
            </h3>
            <button
              onClick={() => {
                setShowPartnerForm(false)
                setEditingPartner(null)
              }}
              className="w-8 h-8 rounded-full glass-card flex items-center justify-center hover:glass-strong"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={editingPartner.name}
                onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="University name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
              <input
                type="text"
                value={editingPartner.country}
                onChange={(e) => setEditingPartner({ ...editingPartner, country: e.target.value })}
                className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="Country"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={editingPartner.city || ''}
                onChange={(e) => setEditingPartner({ ...editingPartner, city: e.target.value })}
                className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Latitude
                {geocoding && (
                  <span className="flex items-center gap-1 text-xs font-normal text-pink-600">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Looking up…
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.0001"
                value={editingPartner.lat || 0}
                onChange={(e) => setEditingPartner({ ...editingPartner, lat: parseFloat(e.target.value) || 0 })}
                className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="Filled from city/country"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={editingPartner.lng || 0}
                onChange={(e) => setEditingPartner({ ...editingPartner, lng: parseFloat(e.target.value) || 0 })}
                className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="Filled from city/country"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Students</label>
              <input
                type="number"
                value={editingPartner.students || 0}
                onChange={(e) => setEditingPartner({ ...editingPartner, students: parseInt(e.target.value) || 0 })}
                className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="Number of students"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sign Date</label>
              <input
                type="date"
                value={editingPartner.signDate || ''}
                onChange={(e) => setEditingPartner({ ...editingPartner, signDate: e.target.value })}
                className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
              <input
                type="date"
                value={editingPartner.expiryDate || ''}
                onChange={(e) => setEditingPartner({ ...editingPartner, expiryDate: e.target.value })}
                className="w-full glass px-4 py-2.5 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-pink-200/80"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSavePartner}
              className="glass-strong px-6 py-2.5 rounded-xl font-semibold text-white gradient-pink hover:shadow-glass-lg transition-glass"
            >
              Save Partner
            </button>
            <button
              onClick={() => {
                setShowPartnerForm(false)
                setEditingPartner(null)
              }}
              className="glass px-6 py-2.5 rounded-xl font-semibold text-gray-700 hover:glass-strong transition-glass"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Partners Table */}
      <div className="glass-card rounded-3xl p-6 shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-4 px-4 text-sm font-semibold text-pink-500" style={{ fontSize: "18px" }}><b>University Name</b></th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-pink-500" style={{ fontSize: "18px" }}><b>City</b></th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-pink-500" style={{ fontSize: "18px" }}><b>Country</b></th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-pink-500" style={{ fontSize: "18px" }}><b>Students</b></th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-pink-500" style={{ fontSize: "18px" }}><b>Actions</b></th>
              </tr>
            </thead>
            <tbody>
              {currentPartners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    {filteredPartners.length === 0 && partners.length > 0
                      ? 'No partners match your search.'
                      : 'No partner universities yet. Click Add Partner to add one.'}
                  </td>
                </tr>
              ) : (
                currentPartners.map((partner) => (
                  <tr
                    key={partner.id}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium text-gray-800">{partner.name}</td>
                    <td className="py-4 px-4 text-gray-600">{partner.city || '—'}</td>
                    <td className="py-4 px-4 text-gray-600">{partner.country || '—'}</td>
                    <td className="py-4 px-4 text-gray-600">{partner.students ?? '—'}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditPartner(partner)}
                          className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:glass-strong transition-glass"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeletePartner(partner.id)}
                          className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:glass-strong transition-glass"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPartners.length > ROWS_PER_PAGE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-white/20">
            <p className="text-sm text-gray-600">
              Showing {pageStart + 1}–{Math.min(pageEnd, filteredPartners.length)} of {filteredPartners.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="glass px-4 py-2 rounded-xl font-semibold text-gray-700 hover:glass-strong transition-glass disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="glass px-4 py-2 rounded-xl font-semibold text-gray-700 hover:glass-strong transition-glass disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
