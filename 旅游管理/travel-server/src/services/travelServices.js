import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import 'dotenv/config'
import { COMPANION_TYPES, TRAVEL_STYLES } from '../utils/validators.js'
import travelAgentService from './travelAgentService.js'

const toText = (content) => {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map((item) => item?.text || item?.content || '').join('')
  }
  return String(content || '')
}

const toNumber = (value, fallback = 0) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

class TravelServices {
  constructor() {
    this.llm = null
    this.initLLM()
    travelAgentService.setLLM(this.llm)
  }

  initLLM() {
    const provider = process.env.MODEL_PROVIDER || 'SILICONFLOW'
    const apiKey = process.env.SILICONFLOW_API_KEY || process.env.OPENAI_API_KEY
    const baseURL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1'
    const model = process.env.SILICONFLOW_BASE_MODEL || 'Qwen/Qwen3.6-35B-A3B'

    if (!apiKey) {
      console.warn('未配置大模型 API Key，将启用本地兜底规划。')
      return
    }

    this.llm = new ChatOpenAI({
      configuration: {
        apiKey,
        baseURL
      },
      model,
      temperature: provider === 'SILICONFLOW' ? 0.7 : 0.6,
      streaming: true
    })
  }

  buildPrompt({ city, budget, days, style, companion }) {
    return `你是一个专业中文旅游规划师，请根据用户信息生成可直接 JSON.parse 的旅游行程 JSON。

目的地城市：${city}
预算：${budget} 元
旅行天数：${days} 天
旅行偏好：${TRAVEL_STYLES[style] || TRAVEL_STYLES.classic}
出行人群：${COMPANION_TYPES[companion] || COMPANION_TYPES.friends}

要求：
1. 每天包含上午、下午、晚上安排。
2. 每个安排包含 spot、duration、ticket、transportation、description。
3. 预算明细必须包含 accommodation、food、transportation、tickets、other，合计尽量接近总预算。
4. 增加 localFoods、packingList、tips、warnings 四个数组，每个 3-6 条。
5. 内容适合移动端展示，描述简洁具体。
6. 只输出 JSON，不要输出 Markdown、解释或代码块。

返回结构示例：
{
  "success": true,
  "city": "城市名",
  "days": 3,
  "style": "classic",
  "companion": "friends",
  "totalBudget": 1000,
  "dailyItinerary": [
    {
      "day": 1,
      "date": "第1天",
      "morning": { "spot": "景点名称", "duration": "2小时", "ticket": "约50元", "transportation": "地铁/步行", "description": "简短介绍" },
      "afternoon": { "spot": "景点名称", "duration": "3小时", "ticket": "约80元", "transportation": "公交/打车", "description": "简短介绍" },
      "evening": { "spot": "夜游/美食街", "duration": "2小时", "ticket": "按消费", "transportation": "步行", "description": "简短介绍" }
    }
  ],
  "budgetBreakdown": { "accommodation": 300, "food": 200, "transportation": 200, "tickets": 200, "other": 100 },
  "localFoods": ["特色美食"],
  "packingList": ["证件"],
  "tips": ["提示"],
  "warnings": ["注意事项"]
}`
  }

  parseTravelResult(content, fallbackInput) {
    const cleaned = toText(content).replace(/```json|```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('模型返回内容不是有效 JSON')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return this.normalizeTravelPlan(parsed, fallbackInput)
  }

  normalizeTravelPlan(plan = {}, input) {
    const days = toNumber(plan.days, input.days)
    const totalBudget = toNumber(plan.totalBudget, input.budget)
    const dailyItinerary = Array.isArray(plan.dailyItinerary) ? plan.dailyItinerary : []

    return {
      success: plan.success !== false,
      city: plan.city || input.city,
      days,
      style: plan.style || input.style,
      companion: plan.companion || input.companion,
      totalBudget,
      dailyItinerary: dailyItinerary.slice(0, days).map((day, index) => ({
        day: toNumber(day.day, index + 1),
        date: day.date || `第${index + 1}天`,
        morning: day.morning || {},
        afternoon: day.afternoon || {},
        evening: day.evening || {}
      })),
      budgetBreakdown: {
        accommodation: toNumber(plan.budgetBreakdown?.accommodation, Math.round(totalBudget * 0.35)),
        food: toNumber(plan.budgetBreakdown?.food, Math.round(totalBudget * 0.25)),
        transportation: toNumber(plan.budgetBreakdown?.transportation, Math.round(totalBudget * 0.18)),
        tickets: toNumber(plan.budgetBreakdown?.tickets, Math.round(totalBudget * 0.15)),
        other: toNumber(plan.budgetBreakdown?.other, Math.round(totalBudget * 0.07))
      },
      localFoods: Array.isArray(plan.localFoods) ? plan.localFoods : [],
      packingList: Array.isArray(plan.packingList) ? plan.packingList : [],
      tips: Array.isArray(plan.tips) ? plan.tips : [],
      warnings: Array.isArray(plan.warnings) ? plan.warnings : []
    }
  }

  buildFallbackPlan(input, reason = '') {
    const dailyItinerary = Array.from({ length: input.days }, (_, index) => ({
      day: index + 1,
      date: `第${index + 1}天`,
      morning: {
        spot: `${input.city}城市地标游`,
        duration: '2-3小时',
        ticket: '以现场为准',
        transportation: '地铁/公交优先',
        description: `围绕${input.city}核心地标安排轻量游览，适合快速建立城市印象。`
      },
      afternoon: {
        spot: `${TRAVEL_STYLES[input.style]}主题路线`,
        duration: '3小时',
        ticket: '按景点消费',
        transportation: '公共交通 + 步行',
        description: `结合${TRAVEL_STYLES[input.style]}偏好，安排博物馆、街区或特色景点。`
      },
      evening: {
        spot: `${input.city}夜间美食/休闲区`,
        duration: '2小时',
        ticket: '按消费',
        transportation: '打车或步行',
        description: `晚间以美食、夜景和休息为主，避免行程过满。`
      }
    }))

    const totalBudget = input.budget

    return {
      success: true,
      city: input.city,
      days: input.days,
      style: input.style,
      companion: input.companion,
      totalBudget,
      generatedBy: 'fallback',
      dailyItinerary,
      budgetBreakdown: {
        accommodation: Math.round(totalBudget * 0.35),
        food: Math.round(totalBudget * 0.25),
        transportation: Math.round(totalBudget * 0.18),
        tickets: Math.round(totalBudget * 0.15),
        other: Math.round(totalBudget * 0.07)
      },
      localFoods: [`${input.city}本地小吃`, '特色面食/米粉', '热门商圈餐厅'],
      packingList: ['身份证件', '充电宝', '舒适步行鞋', '雨具/防晒用品'],
      tips: [
        `当前为${COMPANION_TYPES[input.companion]}，建议每天预留1-2小时弹性时间。`,
        '热门景点建议提前预约，门票和开放时间以官方信息为准。',
        '预算估算仅供参考，建议预留10%-15%机动费用。'
      ],
      warnings: [
        reason || 'AI 服务暂不可用，已生成本地兜底行程。',
        '出行前请再次确认天气、交通管制与景区开放状态。'
      ]
    }
  }

  async recommend(input) {
    if (!this.llm) {
      return this.buildFallbackPlan(input)
    }

    const message = this.buildPrompt(input)

    try {
      const response = await this.llm.invoke([
        new SystemMessage('你是专业旅游规划师，只输出 JSON。'),
        new HumanMessage(message)
      ])
      return this.parseTravelResult(response.content || '', input)
    } catch (error) {
      return this.buildFallbackPlan(input, `AI 规划失败：${error.message}`)
    }
  }

  async recommendStream(input, onChunk) {
    if (!this.llm) {
      onChunk?.('AI 服务未配置，正在生成本地兜底行程...')
      return this.buildFallbackPlan(input)
    }

    const message = this.buildPrompt(input)

    try {
      const stream = await this.llm.stream([
        new SystemMessage('你是专业旅游规划师，只输出 JSON。'),
        new HumanMessage(message)
      ])
      let fullResponse = ''

      for await (const chunk of stream) {
        const content = toText(chunk.content)
        if (!content.trim()) continue
        fullResponse += content
        onChunk?.(content)
      }

      return this.parseTravelResult(fullResponse, input)
    } catch (error) {
      return this.buildFallbackPlan(input, `AI 流式规划失败：${error.message}`)
    }
  }

  async chat(message, streamCallback) {
    if (!this.llm) {
      const fallbackReply = `我可以帮你做城市景点、预算、路线和注意事项建议。你刚才问的是：“${message}”。如果要生成完整行程，请回到首页填写城市、预算和天数。`
      streamCallback?.(fallbackReply)
      return { success: true, reply: fallbackReply, generatedBy: 'fallback' }
    }

    const messages = [
      new SystemMessage('你是友好的中文旅游助手，回答要具体、简洁、可执行。涉及安全、天气、票务时提醒用户以官方信息为准。'),
      new HumanMessage(message)
    ]

    try {
      const stream = await this.llm.stream(messages)
      let fullResponse = ''

      for await (const chunk of stream) {
        const content = toText(chunk.content)
        if (!content.trim()) continue
        fullResponse += content
        streamCallback?.(content)
      }

      return { success: true, reply: fullResponse }
    } catch (error) {
      const fallbackReply = `AI 回复暂时失败：${error.message}。你可以尝试缩短问题，或先生成行程规划后再继续咨询。`
      streamCallback?.(fallbackReply)
      return { success: true, reply: fallbackReply, generatedBy: 'fallback' }
    }
  }
}

export default new TravelServices()
