import { useState, useEffect } from 'react'
import { X, Globe, ChevronLeft, MapPin, Link2 } from 'lucide-react'
import { partnersAPI } from '../services/api'
import {
  REGIONS,
  SUB_REGIONS,
  filterPartnersBySubRegion
} from '../lib/regionMapping'

const REGION_ICONS = {
  [REGIONS.ASIA_PACIFIC]: Globe,
  [REGIONS.EUROPE]: Globe,
  [REGIONS.AMERICAS]: Globe
}

export default function PartnerUniversitiesModal({ mode = 'all', onClose }) {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState(mode === 'active' ? 'activeList' : 'regions') // 'regions' | 'subregions' | 'countries' | 'list' | 'activeList'
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [selectedSubRegion, setSelectedSubRegion] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)

  useEffect(() => {
    let cancelled = false
    partnersAPI
      .getAll()
      .then((data) => {
        if (!cancelled) setPartners(data)
      })
      .catch(() => {
        if (!cancelled) setPartners([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleClose = () => onClose?.()

  const handleRegionClick = (region) => {
    setSelectedRegion(region)
    setSelectedSubRegion(null)
    setView('subregions')
  }

  const handleSubRegionClick = (subRegionId) => {
    setSelectedSubRegion(subRegionId)
    setSelectedCountry(null)
    setView('countries')
  }

  const handleCountryClick = (country) => {
    setSelectedCountry(country)
    setView('list')
  }

  const backToCountries = () => {
    setView('countries')
    setSelectedCountry(null)
  }

  const backToSubRegions = () => {
    setView('subregions')
    setSelectedSubRegion(null)
    setSelectedCountry(null)
  }

  const backToRegions = () => {
    setView('regions')
    setSelectedRegion(null)
    setSelectedSubRegion(null)
    setSelectedCountry(null)
  }

  // Countries that have at least one partner in the selected sub-region (sorted by name)
  const partnersInSubRegion = selectedSubRegion
    ? filterPartnersBySubRegion(partners, selectedSubRegion)
    : []
  const countriesInSubRegion = [...new Set(partnersInSubRegion.map((p) => p.country).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b)
  )

  // Partners in the selected country
  const listPartners = selectedCountry
    ? partners.filter((p) => (p.country || '').trim() === selectedCountry.trim())
    : []

  // Active agreements: partners whose agreement is currently valid based on sign/expiry dates
  const todayISO = new Date().toISOString().split('T')[0]
  const activePartners = partners.filter((p) => {
    if (!p.signDate) return false
    const sign = p.signDate
    const expiry = p.expiryDate
    return sign <= todayISO && (!expiry || expiry >= todayISO)
  })

  const subRegionLabel = selectedRegion && SUB_REGIONS[selectedRegion]
    ? SUB_REGIONS[selectedRegion].find((s) => s.id === selectedSubRegion)?.label
    : ''

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
            {mode === 'active' ? (
              <Link2 className="w-10 h-10 text-white" />
            ) : (
              <Globe className="w-10 h-10 text-white" />
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {mode === 'active' ? 'Active Agreement Universities' : 'Partner Universities'}
          </h1>
          <p className="text-gray-600 text-sm">
            {mode === 'active' && view === 'activeList' && 'Universities with currently active agreements'}
            {mode === 'all' && view === 'regions' && 'Select a region to explore partners'}
            {mode === 'all' && view === 'subregions' && `Sub-regions in ${selectedRegion}`}
            {mode === 'all' && view === 'countries' && `${subRegionLabel} — Select a country`}
            {mode === 'all' && view === 'list' && `${selectedCountry} — Partner universities`}
          </p>
        </div>

        {/* Active agreements simple list view */}
        {mode === 'active' && view === 'activeList' && (
          <div className="overflow-y-auto flex-1 min-h-0 space-y-2 pr-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
              </div>
            ) : activePartners.length === 0 ? (
              <p className="text-gray-500 text-center py-6">
                No active agreement universities at this time.
              </p>
            ) : (
              activePartners.map((partner) => (
                <div
                  key={partner.id}
                  className="glass rounded-xl p-4 flex items-start gap-3 border border-white/30"
                >
                  <div className="w-10 h-10 rounded-lg gradient-pink flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">{partner.name}</p>
                    <p className="text-sm text-gray-600">
                      {[partner.city, partner.country].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {partner.signDate
                        ? `Signed: ${partner.signDate}${partner.expiryDate ? ` • Expires: ${partner.expiryDate}` : ' • No expiry (open-ended agreement)'}`
                        : 'Agreement dates not available'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Original hierarchical navigation for all partners */}
        {mode === 'all' && view === 'regions' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.values(REGIONS).map((region) => {
              const Icon = REGION_ICONS[region]
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => handleRegionClick(region)}
                  className="glass rounded-2xl p-6 flex flex-col items-center gap-3 hover:glass-strong transition-glass shadow-glass-sm border border-white/30 text-gray-800 text-center"
                >
                  <div className="w-14 h-14 rounded-xl gradient-pink flex items-center justify-center">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-semibold">{region}</span>
                </button>
              )
            })}
          </div>
        )}

        {mode === 'all' && view === 'subregions' && selectedRegion && (
          <>
            <button
              type="button"
              onClick={backToRegions}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to regions
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 min-h-0">
              {SUB_REGIONS[selectedRegion].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSubRegionClick(sub.id)}
                  className="glass rounded-2xl p-5 flex flex-col items-center gap-2 hover:glass-strong transition-glass shadow-glass-sm border border-white/30 text-gray-800 text-center"
                >
                  <span className="font-semibold">{sub.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'all' && view === 'countries' && selectedSubRegion && (
          <>
            <button
              type="button"
              onClick={backToSubRegions}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to sub-regions
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 min-h-0">
              {loading ? (
                <div className="flex justify-center py-8 col-span-full">
                  <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
                </div>
              ) : countriesInSubRegion.length === 0 ? (
                <p className="text-gray-500 text-center py-6 col-span-full">No countries with partners in this sub-region.</p>
              ) : (
                countriesInSubRegion.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleCountryClick(country)}
                    className="glass rounded-2xl p-5 flex flex-col items-center gap-2 hover:glass-strong transition-glass shadow-glass-sm border border-white/30 text-gray-800 text-center"
                  >
                    <span className="font-semibold">{country}</span>
                    <span className="text-xs text-gray-500">
                      {partnersInSubRegion.filter((p) => p.country === country).length} partner
                      {partnersInSubRegion.filter((p) => p.country === country).length !== 1 ? 's' : ''}
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {mode === 'all' && view === 'list' && (
          <>
            <button
              type="button"
              onClick={backToCountries}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to countries
            </button>
            <div className="overflow-y-auto flex-1 min-h-0 space-y-2 pr-1">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
                </div>
              ) : listPartners.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No partner universities in this country.</p>
              ) : (
                listPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="glass rounded-xl p-4 flex items-start gap-3 border border-white/30"
                  >
                    <div className="w-10 h-10 rounded-lg gradient-pink flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800">{partner.name}</p>
                      <p className="text-sm text-gray-600">
                        {[partner.city, partner.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
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
