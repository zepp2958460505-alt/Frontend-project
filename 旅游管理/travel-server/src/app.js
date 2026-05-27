import express from 'express'
import travelRouter from './routes/travel.js'

const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Token')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '智能旅游规划服务端',
    version: '1.1.0',
    endpoints: {
      heartbeat: 'GET /api/heartbeat',
      meta: 'GET /api/travel/meta',
      recommend: 'POST /api/travel/recommend',
      recommendStream: 'POST /api/travel/recommend/stream',
      chat: 'POST /api/travel/chat',
      agent: 'POST /api/travel/agent'
    }
  })
})

app.get('/api/heartbeat', (req, res) => {
  res.json({
    success: true,
    message: '服务器正常运行',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/travel', travelRouter)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

app.use((error, req, res, next) => {
  console.error('服务端异常:', error)
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  })
})

export default app
