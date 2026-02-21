// Supabase API Service for ERIO Dashboard
import { supabase } from '../lib/supabase'
import { REGIONS, getRegionForCountry } from '../lib/regionMapping'

// Read admin env vars once and expose presence for debugging
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD
// Do not log the actual values; only log whether they're set
console.debug('ENV_DEBUG: VITE_ADMIN_EMAIL set?', !!ADMIN_EMAIL, 'VITE_ADMIN_PASSWORD set?', !!ADMIN_PASSWORD)

// Auth API using Supabase
export const authAPI = {
  login: async (email, password) => {
    try {
      // Try server-side RPC auth first (safer: password check happens in DB)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('admin_auth', {
          p_email: email,
          p_password: password
        })
        console.debug('AUTH_DEBUG: rpc admin_auth returned?', !!rpcData, 'error?', !!rpcError)
        if (!rpcError && rpcData && (Array.isArray(rpcData) ? rpcData.length > 0 : true)) {
          const rpcAdmin = Array.isArray(rpcData) ? rpcData[0] : rpcData

          // Update last login
          try {
            await supabase
              .from('admin_users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', rpcAdmin.id)
          } catch (e) {
            console.debug('AUTH_DEBUG: failed to update last_login (non-fatal)')
          }

          // Store admin session
          localStorage.setItem('adminToken', 'authenticated')
          localStorage.setItem('adminEmail', rpcAdmin.email)
          localStorage.setItem('adminId', rpcAdmin.id)
          localStorage.setItem('adminAuthenticated', 'true')
          localStorage.setItem('adminLoginTime', Date.now().toString())

          return {
            success: true,
            admin: {
              id: rpcAdmin.id,
              email: rpcAdmin.email
            }
          }
        }
      } catch (rpcErr) {
        // If RPC fails or doesn't exist, continue to existing fallback flow
        console.debug('AUTH_DEBUG: rpc call failed or not available, continuing to fallback flow')
      }

      // Check if the user exists in admin_users table
      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single()

      // Debug: report whether DB query returned a user (no secrets logged)
      console.debug('AUTH_DEBUG: admin query returned user?', !!admin, 'error?', !!adminError, 'queriedEmail:', email)

      // If Supabase query fails (database not set up), fallback to environment variables
      if (adminError || !admin) {
        console.debug('AUTH_DEBUG: using env fallback (no DB admin found)')
        // Fallback: Check admin credentials from environment variables
        const adminEmail = ADMIN_EMAIL
        const adminPassword = ADMIN_PASSWORD

        if (!adminEmail || !adminPassword) {
          throw new Error('Admin credentials not configured. Please set VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD in your .env file.')
        }

        if ((email === adminEmail || email === 'admin') && password === adminPassword) {
          // Store admin session (fallback mode)
          localStorage.setItem('adminToken', 'authenticated')
          localStorage.setItem('adminEmail', email)
          localStorage.setItem('adminId', 'fallback')
          localStorage.setItem('adminAuthenticated', 'true')
          localStorage.setItem('adminLoginTime', Date.now().toString())

          return {
            success: true,
            admin: {
              id: 'fallback',
              email: email
            }
          }
        }

        throw new Error('Invalid email or password')
      }

      // Verify password (currently stored as plain text - in production, use proper hashing)
      // For now, compare directly - in production, use bcrypt or Supabase Auth
      console.debug('AUTH_DEBUG: DB admin found, has password hash?', !!admin.password_hash)
      if (admin.password_hash !== password) {
        console.debug('AUTH_DEBUG: DB password mismatch for admin id', admin && admin.id)

        // If DB password mismatches, allow login if provided credentials match
        // the local environment fallback. This helps recover access when the
        // DB-stored password differs from your intended local admin password.
        // Do NOT log secret values.
        const envEmail = ADMIN_EMAIL
        const envPassword = ADMIN_PASSWORD
        const matchesEnvFallback = envEmail && envPassword && ((email === envEmail) || email === 'admin') && password === envPassword

        if (matchesEnvFallback) {
          console.debug('AUTH_DEBUG: credentials match env fallback — granting access and syncing DB')
          // Attempt to upsert the admin row so future logins use the DB value.
          try {
            const targetEmail = (email === 'admin') ? envEmail : email
            // Use upsert: if admin exists update its password_hash, else insert new
            await supabase
              .from('admin_users')
              .upsert({ email: targetEmail, password_hash: envPassword }, { onConflict: 'email' })
          } catch (syncErr) {
            console.debug('AUTH_DEBUG: failed to sync admin row to DB (non-fatal)')
          }

          // Store admin session (fallback mode)
          localStorage.setItem('adminToken', 'authenticated')
          localStorage.setItem('adminEmail', email)
          localStorage.setItem('adminId', admin.id || 'fallback')
          localStorage.setItem('adminAuthenticated', 'true')
          localStorage.setItem('adminLoginTime', Date.now().toString())

          return {
            success: true,
            admin: {
              id: admin.id || 'fallback',
              email: email
            }
          }
        }

        throw new Error('Invalid email or password')
      }

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id)

      // Store admin session
      localStorage.setItem('adminToken', 'authenticated')
      localStorage.setItem('adminEmail', admin.email)
      localStorage.setItem('adminId', admin.id)
      localStorage.setItem('adminAuthenticated', 'true')
      localStorage.setItem('adminLoginTime', Date.now().toString())

      return {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Invalid email or password')
    }
  },

  verify: async () => {
    const adminId = localStorage.getItem('adminId')
    if (!adminId) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('id', adminId)
      .single()

    if (error || !data) {
      throw new Error('Invalid session')
    }

    return { valid: true, admin: data }
  },

  logout: () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminEmail')
    localStorage.removeItem('adminId')
    localStorage.removeItem('adminAuthenticated')
    localStorage.removeItem('adminLoginTime')
  }
}

// Dashboard Stats API
export const dashboardAPI = {
  getStats: async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (!data) {
        // Return default stats if none exist
        return {
          partnerUniversities: 76,
          activeAgreements: 65,
          studentExchanges: 892,
          eventsThisYear: 32,
          regionalDistribution: { asiaPacific: 88, europe: 7, americas: 5 },
          programsOffered: { exchange: 68, research: 24, summer: 18 },
          engagementScore: 9.2
        }
      }

      // Base numeric stats from DB
      const baseStats = {
        partnerUniversities: data.partner_universities,
        activeAgreements: data.active_agreements,
        studentExchanges: data.student_exchanges,
        eventsThisYear: data.events_this_year,
        engagementScore: parseFloat(data.engagement_score)
      }

      // Derive Programs Offered counts from program_offerings table (fallback to stored JSON)
      let programsOffered = { exchange: 0, research: 0, summer: 0 }
      try {
        const allPrograms = await programOfferingsAPI.getAll()
        const counts = { exchange: 0, research: 0, summer: 0 }
        allPrograms.forEach((p) => {
          if (p.programType === 'exchange') counts.exchange += 1
          if (p.programType === 'research') counts.research += 1
          if (p.programType === 'summer') counts.summer += 1
        })
        programsOffered = counts
      } catch (err) {
        console.debug('PROGRAMS_DEBUG: falling back to stored programs_offered JSON:', err?.message)
        programsOffered = typeof data.programs_offered === 'string'
          ? JSON.parse(data.programs_offered)
          : data.programs_offered
      }

      // Auto-calculate regional distribution from current partner list (Asia Pacific / Europe / Americas)
      let regionalDistribution = { asiaPacific: 88, europe: 7, americas: 5 }
      try {
        const partners = await partnersAPI.getAll()
        const regionCounts = {
          [REGIONS.ASIA_PACIFIC]: 0,
          [REGIONS.EUROPE]: 0,
          [REGIONS.AMERICAS]: 0
        }

        partners.forEach((p) => {
          const region = getRegionForCountry(p.country)
          if (region && regionCounts[region] !== undefined) {
            regionCounts[region] += 1
          }
        })

        const mappedTotal = Object.values(regionCounts).reduce((sum, n) => sum + n, 0) || 1
        regionalDistribution = {
          asiaPacific: Math.round((regionCounts[REGIONS.ASIA_PACIFIC] / mappedTotal) * 100),
          europe: Math.round((regionCounts[REGIONS.EUROPE] / mappedTotal) * 100),
          americas: Math.round((regionCounts[REGIONS.AMERICAS] / mappedTotal) * 100)
        }
      } catch (err) {
        console.debug('REGION_DEBUG: falling back to stored regional_distribution:', err?.message)
        regionalDistribution = typeof data.regional_distribution === 'string'
          ? JSON.parse(data.regional_distribution)
          : data.regional_distribution
      }

      return {
        ...baseStats,
        programsOffered,
        regionalDistribution
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      throw error
    }
  },

  updateStats: async (stats) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) {
        throw new Error('Not authenticated')
      }

      // Check if stats exist
      const { data: existing } = await supabase
        .from('dashboard_stats')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      // Recalculate active agreements based on current partner agreement dates
      let activeAgreements = stats.activeAgreements
      try {
        const partners = await partnersAPI.getAll()
        const today = new Date().toISOString().split('T')[0]
        activeAgreements = partners.filter((p) => {
          if (!p.signDate) return false
          const sign = p.signDate
          const expiry = p.expiryDate
          return sign <= today && (!expiry || expiry >= today)
        }).length
      } catch (err) {
        console.debug('Falling back to provided activeAgreements when updating stats:', err?.message)
      }

      const statsData = {
        partner_universities: stats.partnerUniversities,
        active_agreements: activeAgreements,
        student_exchanges: stats.studentExchanges,
        events_this_year: stats.eventsThisYear,
        regional_distribution: stats.regionalDistribution,
        programs_offered: stats.programsOffered,
        engagement_score: stats.engagementScore,
        updated_at: new Date().toISOString()
      }

      let result
      if (existing) {
        // Update existing
        result = await supabase
          .from('dashboard_stats')
          .update(statsData)
          .eq('id', existing.id)
          .select()
          .single()
      } else {
        // Insert new
        result = await supabase
          .from('dashboard_stats')
          .insert(statsData)
          .select()
          .single()
      }

      if (result.error) {
        throw result.error
      }

      return { success: true, message: 'Stats updated successfully' }
    } catch (error) {
      console.error('Error updating stats:', error)
      throw error
    }
  }
}

// Programs Offered (programme offerings) API
export const programOfferingsAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('program_offerings')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      return (data || []).map((row) => ({
        id: row.id,
        programType: row.program_type, // 'exchange' | 'research' | 'summer'
        title: row.title,
        startDate: row.start_date || null,
        endDate: row.end_date || null
      }))
    } catch (error) {
      console.error('Error fetching program offerings:', error)
      throw error
    }
  },

  getByType: async (programType) => {
    try {
      const { data, error } = await supabase
        .from('program_offerings')
        .select('*')
        .eq('program_type', programType)
        .order('start_date', { ascending: true })

      if (error) throw error

      return (data || []).map((row) => ({
        id: row.id,
        programType: row.program_type,
        title: row.title,
        startDate: row.start_date || null,
        endDate: row.end_date || null
      }))
    } catch (error) {
      console.error('Error fetching program offerings by type:', error)
      throw error
    }
  },

  create: async (program) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('program_offerings')
        .insert({
          program_type: program.programType,
          title: program.title,
          start_date: program.startDate || null,
          end_date: program.endDate || null
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        programType: data.program_type,
        title: data.title,
        startDate: data.start_date || null,
        endDate: data.end_date || null
      }
    } catch (error) {
      console.error('Error creating program offering:', error)
      throw error
    }
  },

  delete: async (id) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('program_offerings')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting program offering:', error)
      throw error
    }
  }
}

// Partners API
export const partnersAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('partner_universities')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        throw error
      }

      return data.map(partner => ({
        id: partner.id,
        name: partner.name,
        country: partner.country,
        city: partner.city || '',
        lat: parseFloat(partner.lat) || 0,
        lng: parseFloat(partner.lng) || 0,
        students: partner.students || 0,
        programs: partner.programs || ['Student Exchange'],
        established: partner.established || '',
        type: partner.type || 'Comprehensive',
        signDate: partner.sign_date || null,
        expiryDate: partner.expiry_date || null
      }))
    } catch (error) {
      console.error('Error fetching partners:', error)
      throw error
    }
  },

  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('partner_universities')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return {
        id: data.id,
        name: data.name,
        country: data.country,
        city: data.city || '',
        lat: parseFloat(data.lat) || 0,
        lng: parseFloat(data.lng) || 0,
        students: data.students || 0,
        programs: data.programs || ['Student Exchange'],
        established: data.established || '',
        type: data.type || 'Comprehensive',
        signDate: data.sign_date || null,
        expiryDate: data.expiry_date || null
      }
    } catch (error) {
      console.error('Error fetching partner:', error)
      throw error
    }
  },

  create: async (partner) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('partner_universities')
        .insert({
          name: partner.name,
          country: partner.country,
          city: partner.city || null,
          lat: partner.lat || null,
          lng: partner.lng || null,
          students: partner.students || 0,
          programs: partner.programs || ['Student Exchange'],
          established: partner.established || null,
          type: partner.type || 'Comprehensive',
          sign_date: partner.signDate || null,
          expiry_date: partner.expiryDate || null
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        id: data.id,
        name: data.name,
        country: data.country,
        city: data.city || '',
        lat: parseFloat(data.lat) || 0,
        lng: parseFloat(data.lng) || 0,
        students: data.students || 0,
        programs: data.programs || ['Student Exchange'],
        established: data.established || '',
        type: data.type || 'Comprehensive',
        signDate: data.sign_date || null,
        expiryDate: data.expiry_date || null
      }
    } catch (error) {
      console.error('Error creating partner:', error)
      throw error
    }
  },

  update: async (id, partner) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('partner_universities')
        .update({
          name: partner.name,
          country: partner.country,
          city: partner.city || null,
          lat: partner.lat || null,
          lng: partner.lng || null,
          students: partner.students || 0,
          programs: partner.programs || ['Student Exchange'],
          established: partner.established || null,
          type: partner.type || 'Comprehensive',
          sign_date: partner.signDate || null,
          expiry_date: partner.expiryDate || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        id: data.id,
        name: data.name,
        country: data.country,
        city: data.city || '',
        lat: parseFloat(data.lat) || 0,
        lng: parseFloat(data.lng) || 0,
        students: data.students || 0,
        programs: data.programs || ['Student Exchange'],
        established: data.established || '',
        type: data.type || 'Comprehensive'
      }
    } catch (error) {
      console.error('Error updating partner:', error)
      throw error
    }
  },

  delete: async (id) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('partner_universities')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      return { success: true, message: 'Partner deleted successfully' }
    } catch (error) {
      console.error('Error deleting partner:', error)
      throw error
    }
  }
}

// Activities API
export const activitiesAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('recent_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        throw error
      }

      return data.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description || '',
        date: activity.date || new Date(activity.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }))
    } catch (error) {
      console.error('Error fetching activities:', error)
      throw error
    }
  },

  create: async (activity) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('recent_activities')
        .insert({
          title: activity.title,
          description: activity.description || null,
          date: activity.date || null
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        date: data.date || new Date(data.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    } catch (error) {
      console.error('Error creating activity:', error)
      throw error
    }
  },

  update: async (id, activity) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('recent_activities')
        .update({
          title: activity.title,
          description: activity.description || null,
          date: activity.date || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        date: data.date || new Date(data.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    } catch (error) {
      console.error('Error updating activity:', error)
      throw error
    }
  },

  delete: async (id) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('recent_activities')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      return { success: true, message: 'Activity deleted successfully' }
    } catch (error) {
      console.error('Error deleting activity:', error)
      throw error
    }
  }
}

// Mobility Programmes API (Faculty / Student Exchange, Inbound / Outbound)
export const mobilityProgrammesAPI = {
  getCount: async () => {
    try {
      const { count, error } = await supabase
        .from('mobility_programmes')
        .select('*', { count: 'exact', head: true })

      if (error) throw error
      return typeof count === 'number' ? count : 0
    } catch (error) {
      console.debug('Mobility programmes count:', error?.message)
      return 0
    }
  },

  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('mobility_programmes')
        .select('*')
        .order('programme_date', { ascending: false })

      if (error) throw error

      return (data || []).map((row) => ({
        id: row.id,
        programmeName: row.programme_name,
        programmeDate: row.programme_date || '',
        place: row.place || '',
        numberOfStudents: row.number_of_students ?? 0,
        type: row.type,
        direction: row.direction
      }))
    } catch (error) {
      console.error('Error fetching mobility programmes:', error)
      throw error
    }
  },

  create: async (programme) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('mobility_programmes')
        .insert({
          programme_name: programme.programmeName,
          programme_date: programme.programmeDate || null,
          place: programme.place || null,
          number_of_students: programme.numberOfStudents ?? 0,
          type: programme.type,
          direction: programme.direction
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        programmeName: data.programme_name,
        programmeDate: data.programme_date || '',
        place: data.place || '',
        numberOfStudents: data.number_of_students ?? 0,
        type: data.type,
        direction: data.direction
      }
    } catch (error) {
      console.error('Error creating mobility programme:', error)
      throw error
    }
  },

  update: async (id, programme) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('mobility_programmes')
        .update({
          programme_name: programme.programmeName,
          programme_date: programme.programmeDate || null,
          place: programme.place || null,
          number_of_students: programme.numberOfStudents ?? 0,
          type: programme.type,
          direction: programme.direction,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        programmeName: data.programme_name,
        programmeDate: data.programme_date || '',
        place: data.place || '',
        numberOfStudents: data.number_of_students ?? 0,
        type: data.type,
        direction: data.direction
      }
    } catch (error) {
      console.error('Error updating mobility programme:', error)
      throw error
    }
  },

  delete: async (id) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('mobility_programmes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true, message: 'Mobility programme deleted successfully' }
    } catch (error) {
      console.error('Error deleting mobility programme:', error)
      throw error
    }
  }
}

// Events API (Events This Year)
export const eventsAPI = {
  getCount: async () => {
    try {
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

      if (error) throw error
      return typeof count === 'number' ? count : 0
    } catch (error) {
      console.debug('Events count:', error?.message)
      return 0
    }
  },

  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })

      if (error) throw error

      return (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        place: row.place || '',
        eventDate: row.event_date || '',
        shortDescription: row.short_description || ''
      }))
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  },

  create: async (event) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: event.title,
          place: event.place || null,
          event_date: event.eventDate || null,
          short_description: event.shortDescription || null
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        title: data.title,
        place: data.place || '',
        eventDate: data.event_date || '',
        shortDescription: data.short_description || ''
      }
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  },

  update: async (id, event) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('events')
        .update({
          title: event.title,
          place: event.place || null,
          event_date: event.eventDate || null,
          short_description: event.shortDescription || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        title: data.title,
        place: data.place || '',
        eventDate: data.event_date || '',
        shortDescription: data.short_description || ''
      }
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  },

  delete: async (id) => {
    try {
      const adminId = localStorage.getItem('adminId')
      if (!adminId) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true, message: 'Event deleted successfully' }
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  }
}

// Website View Counter API
export const viewCounterAPI = {
  incrementView: async () => {
    try {
      // Generate a unique session ID stored in localStorage
      let sessionId = localStorage.getItem('viewerSessionId')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('viewerSessionId', sessionId)
      }

      // Check if this session already recorded a view today
      const today = new Date().toISOString().split('T')[0]
      const lastViewKey = `lastViewDate_${sessionId}`
      const lastViewDate = localStorage.getItem(lastViewKey)

      // Only increment if this is a new day or first visit
      if (lastViewDate !== today) {
        const { data, error } = await supabase
          .from('website_views')
          .insert({
            session_id: sessionId,
            view_date: today,
            timestamp: new Date().toISOString()
          })
          .select()
          .single()

        if (!error && data) {
          // Record that we viewed today
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
      // Use distinct count to get unique session_ids
      const { data, error, count } = await supabase
        .from('website_views')
        .select('session_id', { count: 'exact' })

      if (error) {
        console.error('Error fetching total views:', error)
        return 0
      }

      if (!data || data.length === 0) {
        console.debug('No view records found')
        return 0
      }

      // Count unique session IDs
      const uniqueSessions = new Set(data.map(row => row.session_id))
      const totalViews = uniqueSessions.size
      console.debug('Total unique views:', totalViews, 'from', data.length, 'records')
      return totalViews
    } catch (error) {
      console.error('Error in getTotalViews:', error)
      return 0
    }
  }
}
// Engagement Score Calculation API
export const engagementAPI = {
  calculateEngagementScore: async () => {
    try {
      // Fetch all required metrics
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

      // Calculate engagement score using Option 1 formula
      // Weights: Partners (0.2), Agreements (0.25), Exchanges (0.3), Events (0.15), Activities (0.1)
      // Normalized against reasonable targets
      const engagementScore = Math.min(
        (partnersCount / 100) * 2 +         // Partners: target 100, weight 0.2 → max 2
        (agreementsCount / 80) * 2.5 +      // Agreements: target 80, weight 0.25 → max 2.5
        (exchangesCount / 1000) * 3 +       // Exchanges: target 1000, weight 0.3 → max 3
        (eventsCount / 40) * 1.5 +          // Events: target 40, weight 0.15 → max 1.5
        (activitiesCount / 15) * 1,         // Activities: target 15, weight 0.1 → max 1
        10                                  // Cap at 10
      )

      return Math.round(engagementScore * 10) / 10 // Round to 1 decimal place
    } catch (error) {
      console.error('Error calculating engagement score:', error)
      return 0
    }
  }
}

// Facebook page posts (via Edge Function; no embed = no console errors)
export const facebookAPI = {
  getPosts: async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-facebook-posts')
      if (error) {
        console.debug('Facebook posts fetch failed:', error?.message)
        return []
      }
      return data?.posts ?? []
    } catch (err) {
      console.debug('Facebook posts error:', err?.message)
      return []
    }
  }
}