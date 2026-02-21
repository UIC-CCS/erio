import { useState, useEffect } from 'react'
import { Globe, Calendar, Users, Link2, CalendarCheck, Plane } from 'lucide-react'
import { dashboardAPI, partnersAPI, activitiesAPI, mobilityProgrammesAPI, eventsAPI } from '../../services/supabaseApi'
import { useNavigate } from 'react-router-dom'

export default function AdminOverview() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [partnersCount, setPartnersCount] = useState(0)
  const [activitiesCount, setActivitiesCount] = useState(0)
  const [mobilityCount, setMobilityCount] = useState(0)
  const [eventsCount, setEventsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, partnersData, activitiesData, mobilityCountRes, eventsCountRes] = await Promise.all([
          dashboardAPI.getStats(),
          partnersAPI.getAll(),
          activitiesAPI.getAll(),
          mobilityProgrammesAPI.getCount(),
          eventsAPI.getCount()
        ])

        setStats(statsData)
        setPartnersCount(partnersData?.length || 0)
        setActivitiesCount(activitiesData?.length || 0)
        setMobilityCount(typeof mobilityCountRes === 'number' ? mobilityCountRes : 0)
        setEventsCount(typeof eventsCountRes === 'number' ? eventsCountRes : 0)
      } catch (error) {
        console.error('Error loading overview data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  const quickStats = [
    {
      label: 'Partner Universities',
      value: partnersCount || 0,
      icon: Globe,
      path: '/admin/partners'
    },
    {
      label: 'Active Agreements',
      value: stats?.activeAgreements || 0,
      icon: Link2,
      path: '/admin/stats'
    },
    {
      label: 'Student Exchanges',
      value: stats?.studentExchanges || 0,
      icon: Users,
      path: '/admin/stats'
    },
    {
      label: 'Recent Activities',
      value: activitiesCount || 0,
      icon: Calendar,
      path: '/admin/activities'
    },
    {
      label: 'Mobility Programme',
      value: mobilityCount || 0,
      icon: Plane,
      path: '/admin/mobility'
    },
    {
      label: 'Events This Year',
      value: eventsCount ?? stats?.eventsThisYear ?? 0,
      icon: CalendarCheck,
      path: '/admin/events'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 shadow-glass-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Overview</h1>
        <p className="text-gray-600">Manage and monitor your dashboard content</p>
      </div>

      {/* Quick Stats - includes Recent Activities, Mobility Programme, Events This Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickStats.map((stat) => {
          const Icon = stat.icon
          return (
            <button
              key={stat.label}
              onClick={() => navigate(stat.path)}
              className="glass-card rounded-3xl p-6 shadow-glass hover:shadow-glass-lg transition-glass group relative overflow-hidden text-left"
            >
              <div className="absolute inset-0 gradient-pink-radial opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl gradient-pink flex items-center justify-center shadow-glass-sm group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2 tracking-wide">{stat.label}</h3>
                <p className="text-4xl font-bold text-gray-800 tracking-tight">{stat.value}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
