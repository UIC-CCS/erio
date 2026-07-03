import { useState, useEffect } from 'react'
import { TrendingUp, Users, Globe, Link2, Calendar, Award, Eye } from 'lucide-react'
import StatsCard from './StatsCard'
import EngagementChart from './EngagementChart'
import RecentActivities from './RecentActivities'
import { dashboardAPI, viewCounterAPI, partnersAPI, engagementAPI, mobilityProgrammesAPI, eventsAPI, programOfferingsAPI } from '../services/api'

export default function Dashboard({ onPartnerUniversitiesClick, onActiveAgreementsClick, onMobilityProgrammeClick, onEventsClick }) {
  const [dashboardData, setDashboardData] = useState({
    partnerUniversities: 0,
    activeAgreements: 0,
    studentExchanges: 0,
    eventsThisYear: 0,
    mobilityProgrammeCount: 0,
    eventsCount: 0,
    regionalDistribution: { asiaPacific: 88, europe: 7, americas: 5 },
    programsOffered: { exchange: 68, research: 24, summer: 18 },
    engagementScore: 9.2
  })
  const [totalViews, setTotalViews] = useState(0)
  const [showProgramsModal, setShowProgramsModal] = useState(false)
  const [selectedProgramType, setSelectedProgramType] = useState('exchange')
  const [programItems, setProgramItems] = useState([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)

  useEffect(() => {
    // Track page view and load data from API
    const loadStats = async () => {
      try {
        // Increment view count
        await viewCounterAPI.incrementView()

        // Get total views
        const views = await viewCounterAPI.getTotalViews()
        setTotalViews(views)
      } catch (error) {
        console.error('Error tracking views:', error)
      }

      try {
        const stats = await dashboardAPI.getStats()

        // Fetch real partner count from database
        try {
          const partners = await partnersAPI.getAll()
          stats.partnerUniversities = partners.length
        } catch (error) {
          console.debug('Partner count fallback:', error?.message)
        }

        // Fetch real mobility programme count from database
        try {
          stats.mobilityProgrammeCount = await mobilityProgrammesAPI.getCount()
        } catch (error) {
          console.debug('Mobility count fallback:', error?.message)
          stats.mobilityProgrammeCount = 0
        }

        // Fetch real events count from database
        try {
          stats.eventsCount = await eventsAPI.getCount()
        } catch (error) {
          console.debug('Events count fallback:', error?.message)
          stats.eventsCount = 0
        }

        // Calculate engagement score automatically
        try {
          const engagementScore = await engagementAPI.calculateEngagementScore()
          stats.engagementScore = engagementScore
        } catch (error) {
          console.debug('Error calculating engagement score, using stored value')
        }

        setDashboardData(stats)
        // Also save to localStorage as backup
        localStorage.setItem('publicDashboardStats', JSON.stringify(stats))
      } catch (error) {
        console.error('Error loading stats from API:', error)
        // Fallback to localStorage if API fails
        const savedStats = localStorage.getItem('publicDashboardStats')
        if (savedStats) {
          try {
            setDashboardData(JSON.parse(savedStats))
          } catch (e) {
            console.error('Error loading saved stats:', e)
          }
        }
      }
    }
    loadStats()
  }, [])

  // Load programme list when modal/type changes
  useEffect(() => {
    if (!showProgramsModal) return
    const loadProgrammes = async () => {
      setLoadingPrograms(true)
      try {
        const items = await programOfferingsAPI.getByType(selectedProgramType)
        setProgramItems(items)
      } catch (error) {
        console.error('Error loading programme offerings:', error)
        setProgramItems([])
      } finally {
        setLoadingPrograms(false)
      }
    }
    loadProgrammes()
  }, [showProgramsModal, selectedProgramType])

  const stats = [
    {
      title: 'Partner Universities',
      value: dashboardData.partnerUniversities.toString(),
      change: null,
      trend: null,
      icon: Globe,
      color: 'pink',
      onClick: typeof onPartnerUniversitiesClick === 'function' ? onPartnerUniversitiesClick : undefined,
    },
    {
      title: 'Active Agreements',
      value: dashboardData.activeAgreements.toString(),
      change: null,
      trend: null,
      icon: Link2,
      color: 'pink',
      onClick: typeof onActiveAgreementsClick === 'function' ? onActiveAgreementsClick : undefined,
    },
    {
      title: 'Mobility Programme',
      value: String(dashboardData.mobilityProgrammeCount ?? 0),
      change: null,
      trend: null,
      icon: Users,
      color: 'pink',
      onClick: typeof onMobilityProgrammeClick === 'function' ? onMobilityProgrammeClick : undefined,
    },
    {
      title: 'Events This Year',
      value: String(dashboardData.eventsCount ?? 0),
      change: null,
      trend: null,
      icon: Calendar,
      color: 'pink',
      onClick: typeof onEventsClick === 'function' ? onEventsClick : undefined,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <EngagementChart />
        <RecentActivities />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          type="button"
          onClick={() => {
            setSelectedProgramType('exchange')
            setShowProgramsModal(true)
          }}
          className="glass-card rounded-3xl p-6 md:p-7 shadow-glass hover:shadow-glass-lg transition-glass text-left w-full"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">Programs Offered</h3>
            <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Exchange Programs</span>
              <span className="font-semibold text-gray-800">{dashboardData.programsOffered.exchange}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Research Collaborations</span>
              <span className="font-semibold text-gray-800">{dashboardData.programsOffered.research}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Summer Programs</span>
              <span className="font-semibold text-gray-800">{dashboardData.programsOffered.summer}</span>
            </div>
          </div>
        </button>

        <div className="glass-card rounded-3xl p-6 md:p-7 shadow-glass hover:shadow-glass-lg transition-glass">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">Regional Distribution</h3>
            <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Asia Pacific</span>
              <span className="font-semibold text-gray-800">{dashboardData.regionalDistribution.asiaPacific}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Europe</span>
              <span className="font-semibold text-gray-800">{dashboardData.regionalDistribution.europe}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Americas</span>
              <span className="font-semibold text-gray-800">{dashboardData.regionalDistribution.americas}%</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 md:p-7 shadow-glass hover:shadow-glass-lg transition-glass">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">Engagement Score</h3>
            <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-pink-600 mb-2">{dashboardData.engagementScore}/10</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="gradient-pink h-2 rounded-full"
                style={{ width: `${dashboardData.engagementScore * 10}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Excellent engagement rate</p>
          </div>
        </div>
      </div>

      {/* Programs Offered Modal */}
      {showProgramsModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowProgramsModal(false)}
            aria-hidden
          />
          <div className="relative z-10 glass-card rounded-3xl p-6 md:p-8 shadow-glass-lg max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Programs Offered</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Breakdown of programmes currently offered with partner universities.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProgramsModal(false)}
                className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-gray-700 hover:glass-strong"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedProgramType('exchange')}
                  className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold ${
                    selectedProgramType === 'exchange'
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/70 text-gray-700'
                  }`}
                >
                  Exchange ({dashboardData.programsOffered.exchange || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProgramType('research')}
                  className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold ${
                    selectedProgramType === 'research'
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/70 text-gray-700'
                  }`}
                >
                  Research ({dashboardData.programsOffered.research || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProgramType('summer')}
                  className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold ${
                    selectedProgramType === 'summer'
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/70 text-gray-700'
                  }`}
                >
                  Summer ({dashboardData.programsOffered.summer || 0})
                </button>
              </div>

              <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                {loadingPrograms ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
                  </div>
                ) : programItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No programmes added yet for this category.
                  </p>
                ) : (
                  programItems.map((item) => (
                    <div key={item.id} className="glass-card rounded-2xl px-4 py-3 flex flex-col gap-1">
                      <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                      <span className="text-xs text-gray-600">
                        {item.startDate
                          ? `${item.startDate} ${
                              item.endDate ? `– ${item.endDate}` : ''
                            }`
                          : 'Duration not specified'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Viewer Count Badge - Matching Design */}
      <div className="flex justify-center py-8">
        <div className="inline-flex items-center gap-0 overflow-hidden shadow-md">
          <div className="bg-gray-600 px-6 py-3 text-white font-semibold text-base">
            Website Viewers
          </div>
          <div className="bg-pink-500 px-6 py-3 text-white font-bold text-lg">
            {totalViews.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
