import { REGIONS, getRegionForCountry } from '../lib/regionMapping'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const getAuthToken = () => {
  return localStorage.getItem('adminToken')
}

const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      if (response.token) {
        localStorage.setItem('adminToken', response.token)
        localStorage.setItem('adminEmail', response.admin.email)
        localStorage.setItem('adminId', response.admin.id)
        localStorage.setItem('adminAuthenticated', 'true')
        localStorage.setItem('adminLoginTime', Date.now().toString())
      }

      return response
    } catch (error) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Invalid email or password')
    }
  },

  verify: async () => {
    return apiRequest('/auth/verify')
  },

  logout: () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminEmail')
    localStorage.removeItem('adminId')
    localStorage.removeItem('adminAuthenticated')
    localStorage.removeItem('adminLoginTime')
  }
}

export const dashboardAPI = {
  getStats: async () => {
    return apiRequest('/dashboard/stats')
  },

  updateStats: async (stats) => {
    return apiRequest('/dashboard/stats', {
      method: 'PUT',
      body: JSON.stringify(stats)
    })
  }
}

export const programOfferingsAPI = {
  getAll: async () => {
    return apiRequest('/program-offerings')
  },

  getByType: async (programType) => {
    return apiRequest(`/program-offerings/type/${programType}`)
  },

  create: async (program) => {
    return apiRequest('/program-offerings', {
      method: 'POST',
      body: JSON.stringify(program)
    })
  },

  delete: async (id) => {
    return apiRequest(`/program-offerings/${id}`, {
      method: 'DELETE'
    })
  }
}

export const partnersAPI = {
  getAll: async () => {
    return apiRequest('/partners')
  },

  getById: async (id) => {
    return apiRequest(`/partners/${id}`)
  },

  create: async (partner) => {
    return apiRequest('/partners', {
      method: 'POST',
      body: JSON.stringify(partner)
    })
  },

  update: async (id, partner) => {
    return apiRequest(`/partners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partner)
    })
  },

  delete: async (id) => {
    return apiRequest(`/partners/${id}`, {
      method: 'DELETE'
    })
  }
}

export const activitiesAPI = {
  getAll: async () => {
    return apiRequest('/activities')
  },

  create: async (activity) => {
    return apiRequest('/activities', {
      method: 'POST',
      body: JSON.stringify(activity)
    })
  },

  update: async (id, activity) => {
    return apiRequest(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(activity)
    })
  },

  delete: async (id) => {
    return apiRequest(`/activities/${id}`, {
      method: 'DELETE'
    })
  }
}

export const mobilityProgrammesAPI = {
  getCount: async () => {
    try {
      const data = await apiRequest('/mobility-programmes/count')
      return data.count
    } catch (error) {
      console.debug('Mobility programmes count:', error?.message)
      return 0
    }
  },

  getAll: async () => {
    return apiRequest('/mobility-programmes')
  },

  create: async (programme) => {
    return apiRequest('/mobility-programmes', {
      method: 'POST',
      body: JSON.stringify(programme)
    })
  },

  update: async (id, programme) => {
    return apiRequest(`/mobility-programmes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(programme)
    })
  },

  delete: async (id) => {
    return apiRequest(`/mobility-programmes/${id}`, {
      method: 'DELETE'
    })
  }
}

export const eventsAPI = {
  getCount: async () => {
    try {
      const data = await apiRequest('/events/count')
      return data.count
    } catch (error) {
      console.debug('Events count:', error?.message)
      return 0
    }
  },

  getAll: async () => {
    return apiRequest('/events')
  },

  create: async (event) => {
    return apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify(event)
    })
  },

  update: async (id, event) => {
    return apiRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event)
    })
  },

  delete: async (id) => {
    return apiRequest(`/events/${id}`, {
      method: 'DELETE'
    })
  }
}

export const viewCounterAPI = {
  incrementView: async () => {
    try {
      let sessionId = localStorage.getItem('viewerSessionId')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('viewerSessionId', sessionId)
      }

      const today = new Date().toISOString().split('T')[0]
      const lastViewKey = `lastViewDate_${sessionId}`
      const lastViewDate = localStorage.getItem(lastViewKey)

      if (lastViewDate !== today) {
        const data = await apiRequest('/website-views/increment', {
          method: 'POST',
          body: JSON.stringify({
            session_id: sessionId,
            view_date: today,
            timestamp: new Date().toISOString()
          })
        })

        if (data) {
          localStorage.setItem(lastViewKey, today)
          return data
        }
      }

      return null
    } catch (error) {
      console.error('Error in incrementView:', error)
      return null
    }
  },

  getTotalViews: async () => {
    try {
      const data = await apiRequest('/website-views/total')
      return data.total || 0
    } catch (error) {
      console.error('Error in getTotalViews:', error)
      return 0
    }
  }
}

export const engagementAPI = {
  calculateEngagementScore: async () => {
    try {
      const [partners, stats, activities] = await Promise.all([
        partnersAPI.getAll(),
        dashboardAPI.getStats(),
        activitiesAPI.getAll()
      ])

      const partnersCount = partners.length
      const agreementsCount = stats.activeAgreements
      const exchangesCount = stats.studentExchanges
      const eventsCount = stats.eventsThisYear
      const activitiesCount = activities.length

      const engagementScore = Math.min(
        (partnersCount / 100) * 2 +
        (agreementsCount / 80) * 2.5 +
        (exchangesCount / 1000) * 3 +
        (eventsCount / 40) * 1.5 +
        (activitiesCount / 15) * 1,
        10
      )

      return Math.round(engagementScore * 10) / 10
    } catch (error) {
      console.error('Error calculating engagement score:', error)
      return 0
    }
  }
}

export const facebookAPI = {
  getPosts: async () => {
    try {
      const data = await apiRequest('/facebook/posts')
      return data?.posts ?? []
    } catch (err) {
      console.debug('Facebook posts error:', err?.message)
      return []
    }
  }
}

export const adminAPI = {
  verify: async () => {
    const adminId = localStorage.getItem('adminId')
    if (!adminId) {
      throw new Error('Not authenticated')
    }

    const response = await apiRequest('/auth/verify')
    return { ...response, admin: { id: adminId, email: localStorage.getItem('adminEmail') } }
  }
}
