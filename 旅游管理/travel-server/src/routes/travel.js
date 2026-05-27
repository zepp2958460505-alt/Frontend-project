import express from 'express'
import travelServices from '../services/travelServices.js'
import travelAgentService from '../services/travelAgentService.js'
import { createStreamResponse } from '../utils/streamUtils.js'
import { COMPANION_TYPES, TRAVEL_STYLES, validateAgentPayload, validateChatPayload, validateTripPayload } from '../utils/validators.js'

const router = express.Router()

router.get('/meta', (req, res) => {
  res.json({
    success: true,
    styles: Object.entries(TRAVEL_STYLES).map(([value, label]) => ({ value, label })),
    companions: Object.entries(COMPANION_TYPES).map(([value, label]) => ({ value, label }))
  })
})

router.post('/recommend', async (req, res) => {
  try {
    const input = validateTripPayload(req.body)
    const result = await travelServices.recommend(input)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

router.post('/recommend/stream', async (req, res) => {
  const stream = createStreamResponse(res)

  try {
    const input = validateTripPayload(req.body)
    const result = await travelServices.recommendStream(input, (chunk) => {
      stream.send({ type: 'chunk', content: chunk })
    })
    stream.send({ type: 'complete', data: result }, 'complete')
    stream.end()
  } catch (error) {
    stream.error(error.message)
  }
})


router.post('/agent', async (req, res) => {
  try {
    const input = validateAgentPayload(req.body)
    const result = await travelAgentService.run(input)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

router.post('/chat', async (req, res) => {
  const stream = createStreamResponse(res)

  try {
    const { message } = validateChatPayload(req.body)
    const result = await travelServices.chat(message, (chunk) => {
      stream.send({ type: 'chunk', content: chunk })
    })
    stream.send({ type: 'complete', data: result }, 'complete')
    stream.end()
  } catch (error) {
    stream.error(error.message)
  }
})

export default router
