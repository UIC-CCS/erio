import express from 'express'
import bcrypt from 'bcryptjs'
import { authenticateAdmin } from '../middleware/auth.js'
import { queryAll, queryOne, run, runWithLastId } from '../config/database.js'

const router = express.Router()

router.use(authenticateAdmin)

router.get('/users', (req, res) => {
  try {
    const users = queryAll('SELECT id, email, created_at, last_login FROM admin_users ORDER BY created_at DESC')
    res.json(users)
  } catch (error) {
    console.error('Error listing users:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/users', (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const existing = queryOne('SELECT id FROM admin_users WHERE email = ?', [email])
    if (existing) {
      return res.status(409).json({ error: 'An admin with this email already exists' })
    }

    const passwordHash = bcrypt.hashSync(password, 10)
    const newId = runWithLastId(
      'INSERT INTO admin_users (email, password_hash, created_at) VALUES (?, ?, datetime(\'now\'))',
      [email, passwordHash]
    )

    const user = queryOne(
      'SELECT id, email, created_at FROM admin_users WHERE id = ?',
      [newId]
    )

    res.status(201).json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/users/password', (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' })
    }

    const admin = queryOne('SELECT id, password_hash FROM admin_users WHERE id = ?', [req.adminId])
    if (!admin) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    const newHash = bcrypt.hashSync(newPassword, 10)
    run('UPDATE admin_users SET password_hash = ? WHERE id = ?', [newHash, req.adminId])

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params

    if (Number(id) === req.adminId) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    const user = queryOne('SELECT id, email FROM admin_users WHERE id = ?', [id])
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.email === 'mis@uic.edu.ph') {
      return res.status(403).json({ error: 'Cannot delete the primary admin account' })
    }

    run('DELETE FROM admin_users WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
