import express from 'express'
import { queryAll, queryOne, run, runWithLastId } from '../config/database.js'
import { authenticateAdmin } from '../middleware/auth.js'

const router = express.Router()

const mapPartner = (partner) => ({
  id: partner.id,
  name: partner.name,
  country: partner.country,
  city: partner.city || '',
  lat: parseFloat(partner.lat) || 0,
  lng: parseFloat(partner.lng) || 0,
  students: partner.students || 0,
  programs: JSON.parse(partner.programs || '["Student Exchange"]'),
  established: partner.established || '',
  type: partner.type || 'Comprehensive',
  signDate: partner.sign_date || null,
  expiryDate: partner.expiry_date || null
})

router.get('/', async (req, res) => {
  try {
    const rows = queryAll('SELECT * FROM partner_universities ORDER BY name ASC')
    res.json(rows.map(mapPartner))
  } catch (error) {
    console.error('Error fetching partners:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const partner = queryOne('SELECT * FROM partner_universities WHERE id = ?', [req.params.id])
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' })
    }
    res.json(mapPartner(partner))
  } catch (error) {
    console.error('Error fetching partner:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, country, city, lat, lng, students, programs, established, type, signDate, expiryDate } = req.body

    if (!name || !country) {
      return res.status(400).json({ error: 'Name and country are required' })
    }

    const id = runWithLastId(
      `INSERT INTO partner_universities
        (name, country, city, lat, lng, students, programs, established, type, sign_date, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, country, city || null, lat || null, lng || null,
        students || 0, JSON.stringify(programs || ['Student Exchange']),
        established || null, type || 'Comprehensive',
        signDate || null, expiryDate || null
      ]
    )

    const partner = queryOne('SELECT * FROM partner_universities WHERE id = ?', [id])
    res.status(201).json(mapPartner(partner))
  } catch (error) {
    console.error('Error creating partner:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, country, city, lat, lng, students, programs, established, type, signDate, expiryDate } = req.body

    if (!name || !country) {
      return res.status(400).json({ error: 'Name and country are required' })
    }

    run(
      `UPDATE partner_universities SET
        name = ?, country = ?, city = ?, lat = ?, lng = ?,
        students = ?, programs = ?, established = ?, type = ?,
        sign_date = ?, expiry_date = ?, updated_at = datetime('now')
      WHERE id = ?`,
      [
        name, country, city || null, lat || null, lng || null,
        students || 0, JSON.stringify(programs || ['Student Exchange']),
        established || null, type || 'Comprehensive',
        signDate || null, expiryDate || null, req.params.id
      ]
    )

    const partner = queryOne('SELECT * FROM partner_universities WHERE id = ?', [req.params.id])
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' })
    }
    res.json(mapPartner(partner))
  } catch (error) {
    console.error('Error updating partner:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const existing = queryOne('SELECT id FROM partner_universities WHERE id = ?', [req.params.id])
    if (!existing) {
      return res.status(404).json({ error: 'Partner not found' })
    }
    run('DELETE FROM partner_universities WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Partner deleted successfully' })
  } catch (error) {
    console.error('Error deleting partner:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
