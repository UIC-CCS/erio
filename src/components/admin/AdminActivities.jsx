import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { activitiesAPI } from '../../services/api'

export default function AdminActivities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const data = await activitiesAPI.getAll()
      setActivities(data)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = async () => {
    const newActivity = {
      title: '',
      description: '',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    try {
      const created = await activitiesAPI.create(newActivity)
      setActivities([created, ...activities])
    } catch (error) {
      console.error('Error creating activity:', error)
      alert('Error creating activity. Please try again.')
    }
  }

  const handleDeleteActivity = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await activitiesAPI.delete(id)
        setActivities(activities.filter(a => a.id !== id))
      } catch (error) {
        console.error('Error deleting activity:', error)
        alert('Error deleting activity. Please try again.')
      }
    }
  }

  const handleUpdateActivity = async (id, field, value) => {
    const activity = activities.find(a => a.id === id)
    if (!activity) return

    const updated = { ...activity, [field]: value }
    
    try {
      const result = await activitiesAPI.update(id, {
        title: updated.title,
        description: updated.description,
        date: updated.date
      })
      setActivities(activities.map(a => a.id === id ? result : a))
    } catch (error) {
      console.error('Error updating activity:', error)
    }
  }

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
              Recent Activities
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-0.5">
              Manage recent activities and news ({activities.length} activities)
            </p>
          </div>
          <button
            onClick={handleAddActivity}
            className="glass-strong px-5 py-2.5 rounded-xl font-semibold text-white gradient-pink hover:shadow-glass-lg transition-glass flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="glass-card rounded-2xl p-5 shadow-glass">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={activity.title}
                  onChange={(e) => {
                    const updated = activities.map(a => a.id === activity.id ? { ...a, title: e.target.value } : a)
                    setActivities(updated)
                    if (activity.title) {
                      handleUpdateActivity(activity.id, 'title', e.target.value)
                    }
                  }}
                  onBlur={() => handleUpdateActivity(activity.id, 'title', activity.title)}
                  className="w-full glass px-4 py-2 rounded-xl text-gray-800 font-semibold mb-2 outline-none focus:ring-2 focus:ring-pink-200/80"
                  placeholder="Activity title"
                />
                <textarea
                  value={activity.description}
                  onChange={(e) => {
                    const updated = activities.map(a => a.id === activity.id ? { ...a, description: e.target.value } : a)
                    setActivities(updated)
                  }}
                  onBlur={() => handleUpdateActivity(activity.id, 'description', activity.description)}
                  className="w-full glass px-4 py-2 rounded-xl text-gray-600 text-sm mb-2 outline-none focus:ring-2 focus:ring-pink-200/80 resize-none"
                  rows="2"
                  placeholder="Activity description"
                />
                <input
                  type="text"
                  value={activity.date}
                  onChange={(e) => {
                    const updated = activities.map(a => a.id === activity.id ? { ...a, date: e.target.value } : a)
                    setActivities(updated)
                  }}
                  onBlur={() => handleUpdateActivity(activity.id, 'date', activity.date)}
                  className="w-full glass px-4 py-2 rounded-xl text-gray-500 text-xs outline-none focus:ring-2 focus:ring-pink-200/80"
                  placeholder="Date"
                />
              </div>
              <button
                onClick={() => handleDeleteActivity(activity.id)}
                className="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:glass-strong transition-glass self-start"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
