import express from 'express'
import { config } from 'dotenv'
import gymRoutes from './routes/gyms'
import { errorHandler } from './middleware/errorHandler'
import gymRoutes from './routes/gyms'
import tripRoutes from './routes/trips'

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

// Error handler — must be last
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`FitRoam API running on port ${PORT}`)
})

export default app