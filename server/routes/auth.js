import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { queryOne, run } from '../config/database.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const admin = queryOne('SELECT id, email, password_hash FROM admin_users WHERE email = ?', [email])

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValidPassword = bcrypt.compareSync(password, admin.password_hash)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    run('UPDATE admin_users SET last_login = datetime(\'now\') WHERE id = ?', [admin.id])

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      token,
      admin: { id: admin.id, email: admin.email }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production'
    )

    res.json({ valid: true, admin: decoded })
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
