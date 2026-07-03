import express from 'express'
import { queryAll, queryOne, run } from '../config/database.js'
import { authenticateAdmin } from '../middleware/auth.js'

const router = express.Router()

router.get('/stats', async (req, res) => {
  try {
    const stats = queryOne('SELECT * FROM dashboard_stats ORDER BY updated_at DESC LIMIT 1')

    if (!stats) {
      return res.json({
        partnerUniversities: 76,
        activeAgreements: 65,
        studentExchanges: 892,
        eventsThisYear: 32,
        regionalDistribution: { asiaPacific: 88, europe: 7, americas: 5 },
        programsOffered: { exchange: 68, research: 24, summer: 18 },
        engagementScore: 9.2
      })
    }

    let activeAgreements = stats.active_agreements
    try {
      const partnersResult = queryAll('SELECT sign_date, expiry_date FROM partner_universities')
      const todayISO = new Date().toISOString().split('T')[0]
      activeAgreements = partnersResult.filter((p) => {
        if (!p.sign_date) return false
        const sign = p.sign_date
        const expiry = p.expiry_date || null
        return sign <= todayISO && (!expiry || expiry >= todayISO)
      }).length
    } catch (err) {
      console.debug('Falling back to stored active_agreements:', err?.message)
    }

    res.json({
      partnerUniversities: stats.partner_universities,
      activeAgreements,
      studentExchanges: stats.student_exchanges,
      eventsThisYear: stats.events_this_year,
      regionalDistribution: JSON.parse(stats.regional_distribution),
      programsOffered: JSON.parse(stats.programs_offered),
      engagementScore: parseFloat(stats.engagement_score)
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/stats', authenticateAdmin, async (req, res) => {
  try {
    const {
      partnerUniversities,
      activeAgreements,
      studentExchanges,
      eventsThisYear,
      regionalDistribution,
      programsOffered,
      engagementScore
    } = req.body

    const existing = queryOne('SELECT id FROM dashboard_stats ORDER BY updated_at DESC LIMIT 1')

    if (existing) {
      run(
        `UPDATE dashboard_stats SET
          partner_universities = ?, active_agreements = ?, student_exchanges = ?,
          events_this_year = ?, regional_distribution = ?, programs_offered = ?,
          engagement_score = ?, updated_at = datetime('now')
        WHERE id = ?`,
        [
          partnerUniversities, activeAgreements, studentExchanges,
          eventsThisYear, JSON.stringify(regionalDistribution),
          JSON.stringify(programsOffered), engagementScore, existing.id
        ]
      )
    } else {
      run(
        `INSERT INTO dashboard_stats
          (partner_universities, active_agreements, student_exchanges, events_this_year,
           regional_distribution, programs_offered, engagement_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          partnerUniversities, activeAgreements, studentExchanges,
          eventsThisYear, JSON.stringify(regionalDistribution),
          JSON.stringify(programsOffered), engagementScore
        ]
      )
    }

    res.json({ success: true, message: 'Stats updated successfully' })
  } catch (error) {
    console.error('Error updating stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
