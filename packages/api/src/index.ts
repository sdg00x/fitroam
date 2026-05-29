import express from 'express'
import { config } from 'dotenv'
import gymRoutes from './routes/gyms'
import { errorHandler } from './middleware/errorHandler'
import gymRoutes from './routes/gyms'
import tripRoutes from './routes/trips'
import placeRoutes from './routes/places'
import weatherRoutes from './routes/weather'
import authRoutes from './routes/auth'
import profileRoutes from './routes/profile'
import visitsRoutes from './routes/visits'
import placeRoutes from './routes/places'

config()

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())

// Routes
app.get('/health', (_req, res) => {
  res.json({
    status:      'ok',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  })
})

app.use('/api/gyms', gymRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/places', placeRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/visits', visitsRoutes)

// Error handler — must be last
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`FitRoam API running on port ${PORT}`)
})

export default app