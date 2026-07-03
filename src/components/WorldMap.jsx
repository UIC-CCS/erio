import { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Line } from 'react-simple-maps'
import { X, MapPin, Globe, Users, Calendar, Plus, Minus } from 'lucide-react'
import PartnerDetails from './PartnerDetails'
import { partnersAPI } from '../services/api'

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

// Actual partner universities data - CONFIDENTIAL
const partnerUniversities = [
  { id: 1, name: 'Universiti Teknologi Brunei', country: 'Brunei', city: 'Bandar Seri Begawan', coordinates: [114.9398, 4.9031], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 2, name: 'Royal University of Phnom Penh', country: 'Cambodia', city: 'Phnom Penh', coordinates: [104.9282, 11.5564], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 3, name: "St. Mary's University of Calgary", country: 'Canada', city: 'Calgary', coordinates: [-114.0719, 51.0447], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 4, name: 'UMAP International Secretariat', country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 5, name: 'Karelia University of Applied Sciences', country: 'Finland', city: 'Joensuu', coordinates: [29.7636, 62.6010], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 6, name: 'Sulkhan-Saba Orbeliani University', country: 'Georgia', city: 'Tbilisi', coordinates: [44.8271, 41.7151], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 7, name: 'United Board for Higher Education in Asia', country: 'Hong Kong', city: 'Hong Kong', coordinates: [114.1694, 22.3193], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 8, name: 'Karpagam Academy of Higher Education', country: 'India', city: 'Coimbatore', coordinates: [76.9558, 11.0168], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 9, name: 'Sri Krishna Arts and Science College', country: 'India', city: 'Coimbatore', coordinates: [76.9558, 11.0168], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 10, name: 'Atma Jaya Catholic University of Indonesia', country: 'Indonesia', city: 'Jakarta', coordinates: [106.8456, -6.2088], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 11, name: 'Sekolah Menengah Kejuruan Muhammadiyah 3 Banjarmasin', country: 'Indonesia', city: 'Banjarmasin', coordinates: [114.5911, -3.3194], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 12, name: 'Universitas Ahmad Dalan', country: 'Indonesia', city: 'Yogyakarta', coordinates: [110.3695, -7.7956], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 13, name: 'Universitas Bengkulu', country: 'Indonesia', city: 'Bengkulu', coordinates: [102.2608, -3.7928], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 14, name: 'Universitas Jambi', country: 'Indonesia', city: 'Jambi', coordinates: [103.6068, -1.6101], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 15, name: 'Universitas Katolik Santo Thomas', country: 'Indonesia', city: 'Medan', coordinates: [98.6722, 3.5952], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 16, name: 'Universitas Katolik Widya Mandala Surabaya', country: 'Indonesia', city: 'Surabaya', coordinates: [112.7521, -7.2575], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 17, name: 'Universitas Katolik Widya Mandira', country: 'Indonesia', city: 'Kupang', coordinates: [123.6070, -10.1772], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 18, name: 'Universitas Kristen Indonesia', country: 'Indonesia', city: 'Jakarta', coordinates: [106.8456, -6.2088], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 19, name: 'Universitas Lambung Mangkurat', country: 'Indonesia', city: 'Banjarmasin', coordinates: [114.5911, -3.3194], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 20, name: 'Universitas Negeri Jakarta', country: 'Indonesia', city: 'Jakarta', coordinates: [106.8456, -6.2088], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 21, name: 'Universitas Negeri Malang', country: 'Indonesia', city: 'Malang', coordinates: [112.6326, -7.9666], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 22, name: 'Universitas Negeri Semarang', country: 'Indonesia', city: 'Semarang', coordinates: [110.4167, -6.9667], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 23, name: 'Universitas Pendidikan Indonesia', country: 'Indonesia', city: 'Bandung', coordinates: [107.6191, -6.9175], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 24, name: 'Canvas Gate, Inc.', country: 'Japan', city: 'Tokyo', coordinates: [139.6503, 35.6762], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 25, name: 'Japan University of Economics', country: 'Japan', city: 'Fukuoka', coordinates: [130.4017, 33.5904], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 26, name: 'Josai International University', country: 'Japan', city: 'Togane', coordinates: [140.3678, 35.5494], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 27, name: 'Kansai University', country: 'Japan', city: 'Osaka', coordinates: [135.5023, 34.6937], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 28, name: 'Musashi University', country: 'Japan', city: 'Tokyo', coordinates: [139.6503, 35.6762], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 29, name: 'Osaka City University', country: 'Japan', city: 'Osaka', coordinates: [135.5023, 34.6937], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 30, name: 'University of Tsukuba', country: 'Japan', city: 'Tsukuba', coordinates: [140.1000, 36.1050], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 31, name: 'With The World', country: 'Japan', city: 'Tokyo', coordinates: [139.6503, 35.6762], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 32, name: 'Catholic University of Korea', country: 'Korea', city: 'Seoul', coordinates: [126.9780, 37.5665], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 33, name: 'National University of Laos', country: 'Lao PDR', city: 'Vientiane', coordinates: [102.6331, 17.9757], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 34, name: 'University of Saint Joseph', country: 'Macau', city: 'Macau', coordinates: [113.5439, 22.1987], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 35, name: 'International Islamic University of Malaysia', country: 'Malaysia', city: 'Kuala Lumpur', coordinates: [101.6869, 3.1390], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 36, name: 'Management & Science University', country: 'Malaysia', city: 'Shah Alam', coordinates: [101.5183, 3.0738], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 37, name: 'Universiti Kebangsaan Malaysia', country: 'Malaysia', city: 'Bangi', coordinates: [101.7770, 2.9300], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 38, name: 'Universiti Kuala Lumpur', country: 'Malaysia', city: 'Kuala Lumpur', coordinates: [101.6869, 3.1390], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 39, name: 'Universiti Malaya', country: 'Malaysia', city: 'Kuala Lumpur', coordinates: [101.6544, 3.1201], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 40, name: 'Universiti Malaysia Sabah', country: 'Malaysia', city: 'Kota Kinabalu', coordinates: [116.1180, 6.0329], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 41, name: 'Universiti Pendidikan Sultan Idris', country: 'Malaysia', city: 'Tanjung Malim', coordinates: [101.5200, 3.6850], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 42, name: 'Universiti Sains Malaysia', country: 'Malaysia', city: 'Penang', coordinates: [100.3019, 5.3533], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 43, name: 'Universiti Teknologi MARA', country: 'Malaysia', city: 'Shah Alam', coordinates: [101.5183, 3.0738], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 44, name: 'Universiti Utara Malaysia', country: 'Malaysia', city: 'Sintok', coordinates: [100.5060, 6.4697], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 45, name: 'University College of MAIWP International', country: 'Malaysia', city: 'Kuala Lumpur', coordinates: [101.6869, 3.1390], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 46, name: 'Kyaing Tong University', country: 'Myanmar', city: 'Kyaing Tong', coordinates: [99.6080, 21.3014], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 47, name: 'Nanyang Technological University', country: 'Singapore', city: 'Singapore', coordinates: [103.6831, 1.3483], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 48, name: 'Singapore University of Social Sciences', country: 'Singapore', city: 'Singapore', coordinates: [103.7764, 1.2966], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 49, name: 'Universidad Catolica San Antonio de Murcia', country: 'Spain', city: 'Murcia', coordinates: [-1.1307, 37.9922], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 50, name: 'Chang Gung University of Science and Technology', country: 'Taiwan', city: 'Taoyuan', coordinates: [121.5654, 25.0330], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 51, name: 'Fu Jen Catholic University', country: 'Taiwan', city: 'New Taipei', coordinates: [121.5654, 25.0330], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 52, name: 'Kaohsiung Medical University', country: 'Taiwan', city: 'Kaohsiung', coordinates: [120.3014, 22.6273], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 53, name: 'National Quemoy University', country: 'Taiwan', city: 'Kinmen', coordinates: [118.3667, 24.4333], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 54, name: 'Providence University', country: 'Taiwan', city: 'Taichung', coordinates: [120.6736, 24.1477], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 55, name: 'Southern Taiwan University of Science and Technology', country: 'Taiwan', city: 'Tainan', coordinates: [120.2269, 22.9999], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 56, name: 'ASEAN University Network - Culture and Arts', country: 'Thailand', city: 'Bangkok', coordinates: [100.5018, 13.7563], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 57, name: 'ASEAN University Network - Quality Assurance', country: 'Thailand', city: 'Bangkok', coordinates: [100.5018, 13.7563], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 58, name: 'Burapha University', country: 'Thailand', city: 'Chonburi', coordinates: [100.9847, 13.3611], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 59, name: 'Chiang Mai Rajabhat University', country: 'Thailand', city: 'Chiang Mai', coordinates: [98.9853, 18.7883], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 60, name: 'Chiang Rai Rajabhat University', country: 'Thailand', city: 'Chiang Rai', coordinates: [99.8406, 19.9105], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 61, name: 'Durajkit Pundit University', country: 'Thailand', city: 'Bangkok', coordinates: [100.5018, 13.7563], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 62, name: 'Huachiew Chalermprakiet University', country: 'Thailand', city: 'Samut Prakan', coordinates: [100.5967, 13.5993], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 63, name: "King Mongkut's University of Technology Thonburi", country: 'Thailand', city: 'Bangkok', coordinates: [100.4947, 13.6513], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 64, name: 'SEAMEO School Network', country: 'Thailand', city: 'Bangkok', coordinates: [100.5018, 13.7563], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 65, name: 'SEAMEO SEA Teacher', country: 'Thailand', city: 'Bangkok', coordinates: [100.5018, 13.7563], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 66, name: 'SEAMEO SEA TVET', country: 'Thailand', city: 'Bangkok', coordinates: [100.5018, 13.7563], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 67, name: 'Mahidol University', country: 'Thailand', city: 'Bangkok', coordinates: [100.3245, 13.7899], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 68, name: 'Pan-Asia International School', country: 'Thailand', city: 'Bangkok', coordinates: [100.5018, 13.7563], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 69, name: 'Valaya Alongkorn Rajabhat University', country: 'Thailand', city: 'Pathum Thani', coordinates: [100.5250, 14.0208], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 70, name: 'Global School Alliance', country: 'United Kingdom', city: 'London', coordinates: [-0.1278, 51.5074], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 71, name: 'University of Northampton', country: 'United Kingdom', city: 'Northampton', coordinates: [-0.9027, 52.2405], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 72, name: 'University of Central Missouri', country: 'USA', city: 'Warrensburg', coordinates: [-93.7365, 38.7631], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 73, name: 'University of Colorado Colorado Springs', country: 'USA', city: 'Colorado Springs', coordinates: [-104.8006, 38.8933], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 74, name: 'Dong Thap University', country: 'Vietnam', city: 'Cao Lanh', coordinates: [105.6330, 10.4602], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 75, name: 'VNU-Ho Chi Minh City University of Social Sciences and Humanities', country: 'Vietnam', city: 'Ho Chi Minh City', coordinates: [106.6297, 10.8231], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
  { id: 76, name: 'University of Economics and Finance', country: 'Vietnam', city: 'Ho Chi Minh City', coordinates: [106.6297, 10.8231], programs: ['Student Exchange'], students: 0, established: '', type: 'Comprehensive' },
]

const MIN_ZOOM = 0.5
const MAX_ZOOM = 20
const BASE_SCALE = 150

// Home university (University of the Immaculate Conception, Davao City)
// Updated exact location: 7°4′11″N 125°36′00″E -> [125.6, 7.069722]
const HOME_UNIVERSITY = {
  id: 'home-uic',
  name: 'University of the Immaculate Conception (Davao City)',
  coordinates: [125.6, 7.069722], // [lng, lat] (Decimal degrees)
}

export default function WorldMap() {
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [partners, setPartners] = useState(partnerUniversities)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState([0, 20])
  const rowsPerPage = 10

  // Hover states for interactive highlighting
  const [hoveredPartnerId, setHoveredPartnerId] = useState(null)
  const [hoveredConnectionId, setHoveredConnectionId] = useState(null)

  const handleZoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + 0.25))
  const handleZoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - 0.25))

  // Optional: allow mouse wheel zoom limits by handling wheel on container
  // ZoomableGroup already supports wheel zoom, but we keep programmatic controls.

  useEffect(() => {
    // Load partners from API
    const loadPartners = async () => {
      try {
        const apiPartners = await partnersAPI.getAll()
        if (apiPartners && apiPartners.length > 0) {
          // Convert admin format (lat/lng) to WorldMap format (coordinates)
          const converted = apiPartners.map(p => ({
            ...p,
            coordinates: [p.lng, p.lat],
            programs: p.programs || ['Student Exchange'],
            students: p.students || 0,
            established: p.established || '',
            type: p.type || 'Comprehensive'
          }))
          setPartners(converted)
          localStorage.setItem('publicPartners', JSON.stringify(apiPartners))
        }
      } catch (error) {
        console.error('Error loading partners from API:', error)
        // Fallback to localStorage if API fails
        const savedPartners = localStorage.getItem('publicPartners')
        if (savedPartners) {
          try {
            const parsed = JSON.parse(savedPartners)
            // Convert admin format (lat/lng) to WorldMap format (coordinates)
            const converted = parsed.map(p => ({
              ...p,
              coordinates: [p.lng, p.lat],
              programs: p.programs || ['Student Exchange'],
              students: p.students || 0,
              established: p.established || '',
              type: p.type || 'Comprehensive'
            }))
            setPartners(converted)
          } catch (e) {
            console.error('Error loading saved partners:', e)
          }
        }
      }
    }
    loadPartners()
  }, [])

  const filteredPartners = partners.filter((partner) => {
    const haystack = `${partner.name} ${partner.country}`.toLowerCase()
    return haystack.includes(searchTerm.toLowerCase())
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredPartners.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentPartners = filteredPartners.slice(startIndex, endIndex)

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    // Load saved partners from localStorage
    const savedPartners = localStorage.getItem('publicPartners')
    if (savedPartners) {
      try {
        const parsed = JSON.parse(savedPartners)
        // Convert admin format (lat/lng) to WorldMap format (coordinates)
        const converted = parsed.map(p => ({
          ...p,
          coordinates: [p.lng, p.lat],
          programs: p.programs || ['Student Exchange'],
          students: p.students || 0,
          established: p.established || '',
          type: p.type || 'Comprehensive'
        }))
        setPartners(converted)
      } catch (e) {
        console.error('Error loading saved partners:', e)
      }
    }
  }, [])

  const handleMoveEnd = (position) => {
    // position: { coordinates: [lng, lat], zoom }
    if (position && position.coordinates) setCenter(position.coordinates)
  }

  return (
    <div className="space-y-6">
      {/* Map Header */}
      <div className="glass-card rounded-3xl p-5 md:p-7 shadow-glass">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 tracking-tight">Partner Universities Map</h2>
            <p className="text-sm md:text-base text-gray-600">Explore our international partnerships across the globe</p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-3xl md:text-4xl font-bold text-pink-600">
              {partners.length.toString()}
            </div>
            <div className="text-xs md:text-sm text-gray-600 font-medium">Partner Universities</div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="glass-card rounded-3xl p-4 md:p-6 shadow-glass overflow-hidden">
        <div className="relative md:h-[600px]" style={{ height: '400px', minHeight: '400px' }}>
          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 shadow-glass rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="glass-card w-11 h-11 flex items-center justify-center hover:glass-strong transition-glass disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="glass-card w-11 h-11 flex items-center justify-center hover:glass-strong transition-glass disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>

          <ComposableMap
            projectionConfig={{
              scale: BASE_SCALE,
            }}
            style={{ width: '100%', height: '100%', cursor: 'grab' }}
          >
            <ZoomableGroup
              center={center}
              zoom={zoom}
              onMoveEnd={handleMoveEnd}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#d4a574"
                      stroke="#b89a7a"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', fill: '#c9b399' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>
              {/* Connections from home university to each partner (light pink lines) */}
              {partners && partners.map((p) => {
                const pid = p.id
                const isHovered = hoveredConnectionId === String(pid) || hoveredPartnerId === pid
                return (
                  <Line
                    key={`conn-${pid}`}
                    from={HOME_UNIVERSITY.coordinates}
                    to={p.coordinates}
                    stroke={isHovered ? '#ff7fbf' : '#F9A8D4'}
                    strokeWidth={isHovered ? Math.max(1.2, 2.2 / zoom) : Math.max(0.6, 1.4 / zoom)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={isHovered ? 1 : 0.85}
                    fill="none"
                    onMouseEnter={() => setHoveredConnectionId(String(pid))}
                    onMouseLeave={() => setHoveredConnectionId(null)}
                    style={{ transition: 'stroke-width 180ms ease, stroke 180ms ease, opacity 180ms ease' }}
                  />
                )
              })}

              {/* Home university marker */}
              <Marker key={HOME_UNIVERSITY.id} coordinates={HOME_UNIVERSITY.coordinates}>
                <g className="cursor-default" transform="translate(-14, -14)">
                  <circle r={14} fill="#fff1f6" stroke="#f472b6" strokeWidth={2} />
                  <circle r={7} fill="#f472b6" transform="translate(0,0)" />
                </g>
              </Marker>

              {/* Legend (top-left overlay) */}
              <foreignObject x="10" y="10" width="220" height="80">
                <div className="pointer-events-auto">
                  <div className="glass-card p-3 rounded-xl shadow-glass text-sm text-gray-700 w-[220px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: '#F9A8D4', boxShadow: '0 0 8px rgba(249,168,212,0.25)' }} />
                      <div className="font-semibold">Partnership connections</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: '#f472b6', boxShadow: '0 0 8px rgba(244,114,182,0.20)' }} />
                      <div>University of the Immaculate Conception (UIC)</div>
                    </div>
                  </div>
                </div>
              </foreignObject>

              {partners.map((partner) => (
                <Marker
                  key={partner.id}
                  coordinates={partner.coordinates}
                  onClick={() => setSelectedPartner(partner)}
                >
                  <g
                    className="cursor-pointer transform transition-transform"
                    onMouseEnter={() => { setHoveredPartnerId(partner.id); setHoveredConnectionId(String(partner.id)) }}
                    onMouseLeave={() => { setHoveredPartnerId(null); setHoveredConnectionId(null) }}
                    style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))', transition: 'transform 120ms ease' }}
                  >
                    {(() => {
                      const baseOuter = 8
                      const baseInner = 4
                      const outerR = Math.max(2, baseOuter / zoom)
                      const innerR = Math.max(1, baseInner / zoom)
                      const strokeW = Math.max(0.5, 2 / zoom)
                      const isHovered = hoveredPartnerId === partner.id
                      return (
                        <>
                          {/* halo */}
                          <circle
                            r={isHovered ? outerR * 2.2 : outerR * 1.6}
                            fill="rgba(244,114,182,0.12)"
                            style={{ transition: 'r 160ms ease, opacity 160ms ease' }}
                          />
                          <circle r={outerR} fill="#f472b6" stroke="#fff" strokeWidth={strokeW} />
                          <circle r={innerR} fill="#fff" />
                          {/* label on hover */}
                          {isHovered && (
                            <text
                              x={outerR + 6}
                              y={-outerR - 6}
                              fontSize={12}
                              fill="#3f3f46"
                              fontWeight={600}
                              style={{ textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}
                            >
                              {partner.name}
                            </text>
                          )}
                        </>
                      )
                    })()}
                  </g>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>

      {/* Partner List */}
      <div className="glass-card rounded-3xl p-6 md:p-7 shadow-glass">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">All Partners</h3>
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search partners..."
              className="w-full glass px-4 py-2.5 rounded-2xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-200/80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
              />
            </svg>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Partner Name</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Location</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Country</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Students</th>
              </tr>
            </thead>
            <tbody>
              {currentPartners.map((partner) => (
                <tr
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className="border-b border-white/10 hover:glass-strong transition-glass cursor-pointer"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg gradient-pink flex items-center justify-center flex-shrink-0 shadow-glass-sm">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-gray-800">{partner.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{partner.city}</td>
                  <td className="py-4 px-4 text-gray-600">{partner.country}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{partner.students || 0}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/20">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredPartners.length)} of {filteredPartners.length} partners
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="glass px-4 py-2 rounded-xl font-semibold text-gray-700 hover:glass-strong transition-glass disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl font-semibold transition-glass ${currentPage === page
                      ? 'glass-strong text-pink-600 shadow-glass-sm'
                      : 'glass text-gray-700 hover:glass-strong'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="glass px-4 py-2 rounded-xl font-semibold text-gray-700 hover:glass-strong transition-glass disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Partner Details Modal */}
      {selectedPartner && (
        <PartnerDetails
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}
    </div>
  )
}
