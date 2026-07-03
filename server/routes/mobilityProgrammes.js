import express from 'express'
import { queryAll, queryOne, run, runWithLastId } from '../config/database.js'
import { authenticateAdmin } from '../middleware/auth.js'

const router = express.Router()

const mapProgramme = (row) => ({
  id: row.id,
  programmeName: row.programme_name,
  programmeDate: row.programme_date || '',
  place: row.place || '',
  numberOfStudents: row.number_of_students ?? 0,
  type: row.type,
  direction: row.direction
})

router.get('/count', async (req, res) => {
  try {
    const row = queryOne('SELECT COUNT(*) as count FROM mobility_programmes')
    res.json({ count: row.count })
  } catch (error) {
    console.error('Error counting mobility programmes:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/', async (req, res) => {
  try {
    const rows = queryAll('SELECT * FROM mobility_programmes ORDER BY programme_date DESC')
    res.json(rows.map(mapProgramme))
  } catch (error) {
    console.error('Error fetching mobility programmes:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { programmeName, programmeDate, place, numberOfStudents, type, direction } = req.body
    if (!programmeName || !type || !direction) {
      return res.status(400).json({ error: 'programmeName, type, and direction are required' })
    }

    const id = runWithLastId(
      `INSERT INTO mobility_programmes
        (programme_name, programme_date, place, number_of_students, type, direction)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [programmeName, programmeDate || null, place || null, numberOfStudents ?? 0, type, direction]
    )

    const row = queryOne('SELECT * FROM mobility_programmes WHERE id = ?', [id])
    res.status(201).json(mapProgramme(row))
  } catch (error) {
    console.error('Error creating mobility programme:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { programmeName, programmeDate, place, numberOfStudents, type, direction } = req.body

    run(
      `UPDATE mobility_programmes SET
        programme_name = ?, programme_date = ?, place = ?,
        number_of_students = ?, type = ?, direction = ?,
        updated_at = datetime('now')
      WHERE id = ?`,
      [programmeName, programmeDate || null, place || null, numberOfStudents ?? 0, type, direction, req.params.id]
    )

    const row = queryOne('SELECT * FROM mobility_programmes WHERE id = ?', [req.params.id])
    if (!row) {
      return res.status(404).json({ error: 'Mobility programme not found' })
    }
    res.json(mapProgramme(row))
  } catch (error) {
    console.error('Error updating mobility programme:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const existing = queryOne('SELECT id FROM mobility_programmes WHERE id = ?', [req.params.id])
    if (!existing) {
      return res.status(404).json({ error: 'Mobility programme not found' })
    }
    run('DELETE FROM mobility_programmes WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Mobility programme deleted successfully' })
  } catch (error) {
    console.error('Error deleting mobility programme:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
