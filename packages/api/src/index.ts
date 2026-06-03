import express from 'express'
import { config } from 'dotenv'
import { errorHandler } from './middleware/errorHandler'
import gymRoutes from './routes/gyms'
import tripRoutes from './routes/trips'
import placeRoutes from './routes/places'
import weatherRoutes from './routes/weather'
import authRoutes from './routes/auth'
import profileRoutes from './routes/profile'
import visitsRoutes from './routes/visits'
import conciergeRoutes from './routes/concierge'
import bookingInterestRoutes from './routes/bookingInterest'

config()
const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())

// Serve the admin web UI (static HTML at /admin)
app.use("/admin", express.static("public"))
app.get("/admin", (_req, res) => res.sendFile(require("path").resolve("public/admin.html")))

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
app.use('/api/concierge', conciergeRoutes)
app.use('/api/booking-interest', bookingInterestRoutes)

// Error handler — must be last
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`FitRoam API running on port ${PORT}`)
})

export default app
