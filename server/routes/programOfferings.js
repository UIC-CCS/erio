import express from 'express'
import { queryAll, queryOne, run, runWithLastId } from '../config/database.js'
import { authenticateAdmin } from '../middleware/auth.js'

const router = express.Router()

const mapProgram = (row) => ({
  id: row.id,
  programType: row.program_type,
  title: row.title,
  startDate: row.start_date || null,
  endDate: row.end_date || null
})

router.get('/', async (req, res) => {
  try {
    const rows = queryAll('SELECT * FROM program_offerings ORDER BY created_at ASC')
    res.json(rows.map(mapProgram))
  } catch (error) {
    console.error('Error fetching program offerings:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/type/:programType', async (req, res) => {
  try {
    const rows = queryAll(
      'SELECT * FROM program_offerings WHERE program_type = ? ORDER BY start_date ASC',
      [req.params.programType]
    )
    res.json(rows.map(mapProgram))
  } catch (error) {
    console.error('Error fetching program offerings by type:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { programType, title, startDate, endDate } = req.body
    if (!programType || !title) {
      return res.status(400).json({ error: 'programType and title are required' })
    }

    const id = runWithLastId(
      `INSERT INTO program_offerings (program_type, title, start_date, end_date) VALUES (?, ?, ?, ?)`,
      [programType, title, startDate || null, endDate || null]
    )

    const row = queryOne('SELECT * FROM program_offerings WHERE id = ?', [id])
    res.status(201).json(mapProgram(row))
  } catch (error) {
    console.error('Error creating program offering:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const existing = queryOne('SELECT id FROM program_offerings WHERE id = ?', [req.params.id])
    if (!existing) {
      return res.status(404).json({ error: 'Program offering not found' })
    }
    run('DELETE FROM program_offerings WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting program offering:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
