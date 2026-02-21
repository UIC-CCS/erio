import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import WorldMap from './components/WorldMap'
import Header from './components/Header'
import OrganicShapes from './components/OrganicShapes'
import AdminLogin from './components/AdminLogin'
import PartnerUniversitiesModal from './components/PartnerUniversitiesModal'
import MobilityProgrammeModal from './components/MobilityProgrammeModal'
import EventsModal from './components/EventsModal'
import AdminLayout from './components/admin/AdminLayout'
import AdminOverview from './components/admin/AdminOverview'
import AdminStats from './components/admin/AdminStats'
import AdminPartners from './components/admin/AdminPartners'
import AdminActivities from './components/admin/AdminActivities'
import AdminMobility from './components/admin/AdminMobility'
import AdminEvents from './components/admin/AdminEvents'

function PublicDashboard({ onAdminLoginSuccess }) {
  const [activeView, setActiveView] = useState('dashboard')
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false)
  const [showPartnerUniversitiesModal, setShowPartnerUniversitiesModal] = useState(false)
  const [partnerModalMode, setPartnerModalMode] = useState('all') // 'all' | 'active'
  const [showMobilityProgrammeModal, setShowMobilityProgrammeModal] = useState(false)
  const [showEventsModal, setShowEventsModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Open modal when navigating from /admin/login (e.g. bookmark)
  useEffect(() => {
    if (location.state?.openAdminLogin) {
      setShowAdminLoginModal(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state?.openAdminLogin, location.pathname, navigate])

  const handleAdminLoginSuccess = () => {
    setShowAdminLoginModal(false)
    onAdminLoginSuccess?.()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with organic shapes */}
      <OrganicShapes />

      {/* Main content – stays visible behind modal */}
      <div className="relative z-10">
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          onAdminClick={() => setShowAdminLoginModal(true)}
        />

        <main className="container mx-auto px-4 py-8">
          {activeView === 'dashboard' && (
            <Dashboard
              onPartnerUniversitiesClick={() => {
                setPartnerModalMode('all')
                setShowPartnerUniversitiesModal(true)
              }}
              onActiveAgreementsClick={() => {
                setPartnerModalMode('active')
                setShowPartnerUniversitiesModal(true)
              }}
              onMobilityProgrammeClick={() => setShowMobilityProgrammeModal(true)}
              onEventsClick={() => setShowEventsModal(true)}
            />
          )}
          {activeView === 'map' && <WorldMap />}
        </main>
      </div>

      {/* Admin login modal overlay – preview style: pops up on current page */}
      {showAdminLoginModal && (
        <AdminLogin
          onClose={() => setShowAdminLoginModal(false)}
          onLogin={handleAdminLoginSuccess}
        />
      )}

      {/* Partner Universities modal – region → sub-region → list */}
      {showPartnerUniversitiesModal && (
        <PartnerUniversitiesModal
          mode={partnerModalMode}
          onClose={() => setShowPartnerUniversitiesModal(false)}
        />
      )}

      {showMobilityProgrammeModal && (
        <MobilityProgrammeModal onClose={() => setShowMobilityProgrammeModal(false)} />
      )}

      {showEventsModal && (
        <EventsModal onClose={() => setShowEventsModal(false)} />
      )}
    </div>
  )
}

function ProtectedAdminRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuthenticated')
    const loginTime = localStorage.getItem('adminLoginTime')
    
    // Check if authenticated and session is valid (24 hours)
    if (authStatus === 'true' && loginTime) {
      const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60)
      if (hoursSinceLogin < 24) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('adminAuthenticated')
        localStorage.removeItem('adminLoginTime')
      }
    }
    setIsChecking(false)
  }, [])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" replace />
}

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuthenticated')
    const loginTime = localStorage.getItem('adminLoginTime')
    
    if (authStatus === 'true' && loginTime) {
      const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60)
      if (hoursSinceLogin < 24) {
        setIsAdminAuthenticated(true)
      }
    }
  }, [])

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true)
  }

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false)
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<PublicDashboard onAdminLoginSuccess={handleAdminLogin} />} />
        <Route
          path="/admin/login"
          element={
            isAdminAuthenticated ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/" state={{ openAdminLogin: true }} replace />
            )
          }
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <AdminLayout onLogout={handleAdminLogout} />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="stats" element={<AdminStats />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="activities" element={<AdminActivities />} />
          <Route path="mobility" element={<AdminMobility />} />
          <Route path="events" element={<AdminEvents />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
