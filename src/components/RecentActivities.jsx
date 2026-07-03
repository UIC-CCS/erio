import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users } from 'lucide-react'
import { activitiesAPI } from '../services/api'

const defaultActivities = [
  {
    id: 1,
    title: 'New Partnership Agreement',
    description: 'Signed MOU with Nanyang Technological University',
    date: 'January 20, 2026',
    type: 'partnership',
  },
  {
    id: 2,
    title: 'Student Exchange Program',
    description: '32 students arrived from partner universities in Malaysia',
    date: 'January 18, 2026',
    type: 'exchange',
  },
  {
    id: 3,
    title: 'International Conference',
    description: 'ASEAN University Network Quality Assurance Meeting',
    date: 'January 15, 2026',
    type: 'event',
  },
  {
    id: 4,
    title: 'Research Collaboration',
    description: 'Joint research project with Universiti Malaya',
    date: 'January 12, 2026',
    type: 'research',
  },
]

export default function RecentActivities() {
  const [activities, setActivities] = useState(defaultActivities)

  useEffect(() => {
    // Load activities from API
    const loadActivities = async () => {
      try {
        const apiActivities = await activitiesAPI.getAll()
        if (apiActivities && apiActivities.length > 0) {
          // Map API activities to include type for icon display
          const mapped = apiActivities.map(activity => ({
            ...activity,
            type: activity.type || 'event'
          }))
          setActivities(mapped)
          localStorage.setItem('publicActivities', JSON.stringify(mapped))
        }
      } catch (error) {
        console.error('Error loading activities from API:', error)
        // Fallback to localStorage if API fails
        const savedActivities = localStorage.getItem('publicActivities')
        if (savedActivities) {
          try {
            setActivities(JSON.parse(savedActivities))
          } catch (e) {
            console.error('Error loading saved activities:', e)
          }
        }
      }
    }
    loadActivities()
  }, [])
  return (
    <div className="glass-card rounded-3xl p-6 md:p-7 shadow-glass">
      <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 tracking-tight">Recent Activities</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="glass-card rounded-2xl p-5 hover:glass-strong transition-glass group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-pink flex items-center justify-center flex-shrink-0 shadow-glass-sm group-hover:scale-110 transition-transform duration-300">
                {activity.type === 'partnership' && <Users className="w-6 h-6 text-white" />}
                {activity.type === 'exchange' && <Users className="w-6 h-6 text-white" />}
                {activity.type === 'event' && <Calendar className="w-6 h-6 text-white" />}
                {activity.type === 'research' && <MapPin className="w-6 h-6 text-white" />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1.5 text-base">{activity.title}</h4>
                <p className="text-sm text-gray-600 mb-2.5 leading-relaxed">{activity.description}</p>
                <p className="text-xs text-gray-500 font-medium">{activity.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
