import express from 'express'
import { queryAll, queryOne, run, runWithLastId } from '../config/database.js'
import { authenticateAdmin } from '../middleware/auth.js'

const router = express.Router()

const mapActivity = (activity) => ({
  id: activity.id,
  title: activity.title,
  description: activity.description || '',
  date: activity.date || new Date(activity.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
})

router.get('/', async (req, res) => {
  try {
    const rows = queryAll('SELECT * FROM recent_activities ORDER BY created_at DESC LIMIT 10')
    res.json(rows.map(mapActivity))
  } catch (error) {
    console.error('Error fetching activities:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { title, description, date } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const id = runWithLastId(
      'INSERT INTO recent_activities (title, description, date) VALUES (?, ?, ?)',
      [title, description || null, date || null]
    )

    const activity = queryOne('SELECT * FROM recent_activities WHERE id = ?', [id])
    res.status(201).json(mapActivity(activity))
  } catch (error) {
    console.error('Error creating activity:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { title, description, date } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    run(
      'UPDATE recent_activities SET title = ?, description = ?, date = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [title, description || null, date || null, req.params.id]
    )

    const activity = queryOne('SELECT * FROM recent_activities WHERE id = ?', [req.params.id])
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' })
    }
    res.json(mapActivity(activity))
  } catch (error) {
    console.error('Error updating activity:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const existing = queryOne('SELECT id FROM recent_activities WHERE id = ?', [req.params.id])
    if (!existing) {
      return res.status(404).json({ error: 'Activity not found' })
    }
    run('DELETE FROM recent_activities WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Error deleting activity:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
