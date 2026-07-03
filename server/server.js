import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from './config/database.js'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import partnersRoutes from './routes/partners.js'
import activitiesRoutes from './routes/activities.js'
import programOfferingsRoutes from './routes/programOfferings.js'
import mobilityProgrammesRoutes from './routes/mobilityProgrammes.js'
import eventsRoutes from './routes/events.js'
import websiteViewsRoutes from './routes/websiteViews.js'
import facebookRoutes from './routes/facebook.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ERIO Dashboard API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/partners', partnersRoutes)
app.use('/api/activities', activitiesRoutes)
app.use('/api/program-offerings', programOfferingsRoutes)
app.use('/api/mobility-programmes', mobilityProgrammesRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/website-views', websiteViewsRoutes)
app.use('/api/facebook', facebookRoutes)

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

async function start() {
  try {
    await initDatabase()
    app.listen(PORT, () => {
      console.log(`ERIO Dashboard API server running on port ${PORT}`)
      console.log(`Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  }
}

start()
