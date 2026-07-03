import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, BarChart3, Globe, Home, Settings, Calendar, Users, CalendarCheck, Shield } from 'lucide-react'
import { authAPI } from '../../services/api'
import OrganicShapes from '../OrganicShapes'
import uicErioLogo from '../../assets/uic-erio-logo (2).png'

export default function AdminLayout({ onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    authAPI.logout()
    onLogout()
    navigate('/')
  }

  const navItems = [
    { path: '/admin', icon: Home, label: 'Overview', exact: true },
    { path: '/admin/stats', icon: BarChart3, label: 'Dashboard Stats' },
    { path: '/admin/partners', icon: Globe, label: 'Partner Universities' },
    { path: '/admin/users', icon: Shield, label: 'Admin Users' },
  ]

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="h-screen relative overflow-hidden bg-beige-50">
      {/* Background shapes */}
      <OrganicShapes />

      <div className="relative z-10 flex h-full">
        {/* Sidebar Navigation - Fixed, Unscrollable */}
        <aside className="w-64 h-screen fixed left-0 top-0 glass-card border-r border-white/20 shadow-glass-lg overflow-hidden flex flex-col">
          <div className="p-6 flex-1 overflow-hidden flex flex-col">
            {/* Top badge */}
            <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 flex items-center justify-center shadow-md">
                <Settings className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Admin Panel</div>
                <div className="text-xs text-gray-500">ERIO Dashboard</div>
              </div>
            </div>

            {/* Navigation - pill style */}
            <nav className="space-y-4 flex-shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path, item.exact)
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${active
                      ? 'bg-white text-pink-600 shadow-lg'
                      : 'bg-white/80 text-gray-700 hover:shadow-md'
                      }`}
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${active ? 'bg-pink-50' : 'bg-white/5'}`}>
                      <Icon className={`w-5 h-5 ${active ? 'text-pink-600' : 'text-gray-400'}`} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Large centered UIC ERIO logo */}
            <div className="mt-6 flex justify-center">
              <img src={uicErioLogo} alt="UIC ERIO Logo" className="h-40 w-auto object-contain drop-shadow-md" />
            </div>

            {/* Logout Button at bottom */}
            <div className="mt-auto px-4 py-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 hover:bg-white text-gray-700 transition-all shadow-sm"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-white/80">
                  <LogOut className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content - Scrollable */}
        <main className="flex-1 h-screen ml-64 overflow-y-auto overflow-x-hidden">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
