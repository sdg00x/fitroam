import express from 'express'
import { config } from 'dotenv'

config()

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())

// Health check — first endpoint, confirms server is alive
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  })
})

app.listen(PORT, () => {
  console.log(`FitRoam API running on port ${PORT}`)
})

export default app