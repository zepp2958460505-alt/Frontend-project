export const TRAVEL_STYLES = {
  classic: '经典打卡',
  relaxed: '轻松慢游',
  food: '美食探索',
  culture: '人文历史',
  family: '亲子友好',
  citywalk: 'City Walk'
}

export const COMPANION_TYPES = {
  solo: '独自出行',
  couple: '情侣出行',
  friends: '朋友结伴',
  family: '家庭亲子',
  elders: '带长辈出行'
}

const normalizeText = (value) => String(value ?? '').trim()

const toPositiveNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : NaN
}

export const validateTripPayload = (body = {}) => {
  const city = normalizeText(body.city)
  const budget = toPositiveNumber(body.budget)
  const days = Math.floor(toPositiveNumber(body.days))
  const style = TRAVEL_STYLES[body.style] ? body.style : 'classic'
  const companion = COMPANION_TYPES[body.companion] ? body.companion : 'friends'

  if (!city) {
    throw new Error('请选择目的城市')
  }

  if (city.length > 30) {
    throw new Error('城市名称不能超过30个字符')
  }

  if (!Number.isFinite(budget) || budget < 100) {
    throw new Error('预算不能低于100元')
  }

  if (!Number.isInteger(days) || days < 1 || days > 30) {
    throw new Error('行程天数必须在1-30天之间')
  }

  return { city, budget, days, style, companion }
}

export const validateChatPayload = (body = {}) => {
  const message = normalizeText(body.message)

  if (!message) {
    throw new Error('请输入聊天内容')
  }

  if (message.length > 1000) {
    throw new Error('聊天内容不能超过1000个字符')
  }

  return { message }
}

export const validateAgentPayload = (body = {}) => {
  const message = normalizeText(body.message)
  const sessionId = normalizeText(body.sessionId || 'default') || 'default'
  const trip = body.trip && typeof body.trip === 'object' ? body.trip : {}

  if (!message) {
    throw new Error('请输入 Agent 任务内容')
  }

  if (message.length > 1200) {
    throw new Error('Agent 任务内容不能超过1200个字符')
  }

  if (sessionId.length > 80) {
    throw new Error('会话 ID 不能超过80个字符')
  }

  return { message, sessionId, trip }
}
