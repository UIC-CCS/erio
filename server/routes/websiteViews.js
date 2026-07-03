import express from 'express'
import { queryAll, queryOne, run, runWithLastId } from '../config/database.js'

const router = express.Router()

router.post('/increment', async (req, res) => {
  try {
    const { session_id, view_date, timestamp } = req.body

    if (!session_id || !view_date) {
      return res.status(400).json({ error: 'session_id and view_date are required' })
    }

    const id = runWithLastId(
      'INSERT INTO website_views (session_id, view_date, timestamp) VALUES (?, ?, ?)',
      [session_id, view_date, timestamp || new Date().toISOString()]
    )

    const row = queryOne('SELECT * FROM website_views WHERE id = ?', [id])
    res.status(201).json(row)
  } catch (error) {
    console.error('Error incrementing view:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/total', async (req, res) => {
  try {
    const rows = queryAll('SELECT DISTINCT session_id FROM website_views')
    res.json({ total: rows.length })
  } catch (error) {
    console.error('Error getting total views:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
