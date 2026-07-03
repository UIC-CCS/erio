import express from 'express'
import { queryAll, queryOne, run, runWithLastId } from '../config/database.js'
import { authenticateAdmin } from '../middleware/auth.js'

const router = express.Router()

const mapEvent = (row) => ({
  id: row.id,
  title: row.title,
  place: row.place || '',
  eventDate: row.event_date || '',
  shortDescription: row.short_description || ''
})

router.get('/count', async (req, res) => {
  try {
    const row = queryOne('SELECT COUNT(*) as count FROM events')
    res.json({ count: row.count })
  } catch (error) {
    console.error('Error counting events:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/', async (req, res) => {
  try {
    const rows = queryAll('SELECT * FROM events ORDER BY event_date DESC')
    res.json(rows.map(mapEvent))
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { title, place, eventDate, shortDescription } = req.body
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const id = runWithLastId(
      'INSERT INTO events (title, place, event_date, short_description) VALUES (?, ?, ?, ?)',
      [title, place || null, eventDate || null, shortDescription || null]
    )

    const row = queryOne('SELECT * FROM events WHERE id = ?', [id])
    res.status(201).json(mapEvent(row))
  } catch (error) {
    console.error('Error creating event:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { title, place, eventDate, shortDescription } = req.body

    run(
      `UPDATE events SET
        title = ?, place = ?, event_date = ?, short_description = ?,
        updated_at = datetime('now')
      WHERE id = ?`,
      [title, place || null, eventDate || null, shortDescription || null, req.params.id]
    )

    const row = queryOne('SELECT * FROM events WHERE id = ?', [req.params.id])
    if (!row) {
      return res.status(404).json({ error: 'Event not found' })
    }
    res.json(mapEvent(row))
  } catch (error) {
    console.error('Error updating event:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const existing = queryOne('SELECT id FROM events WHERE id = ?', [req.params.id])
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' })
    }
    run('DELETE FROM events WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
