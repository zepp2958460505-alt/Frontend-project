import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import memoryStore from './memoryStore.js'
import ragStore from './ragStore.js'
import { runTravelTools, summarizeToolOutputs, toBudgetText } from './travelTools.js'
import { COMPANION_TYPES, TRAVEL_STYLES } from '../utils/validators.js'

const toText = (content) => {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map((item) => item?.text || item?.content || '').join('')
  return String(content || '')
}

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== '')

const inferPreferences = (message, input = {}) => {
  const text = String(message || '')
  const preferences = {}
  const knownCities = ['广州', '成都', '北京', '上海', '杭州', '西安', '重庆', '深圳', '南京', '苏州']
  const city = input.city || knownCities.find((item) => text.includes(item))
  if (city) preferences.city = city

  const daysMatch = text.match(/(\d+)\s*(天|日)/)
  const budgetMatch = text.match(/(\d{3,6})\s*(元|块|预算)?/)
  if (daysMatch) preferences.days = Number(daysMatch[1])
  if (budgetMatch) preferences.budget = Number(budgetMatch[1])

  const styleMap = {
    美食: 'food',
    吃: 'food',
    亲子: 'family',
    小孩: 'family',
    文化: 'culture',
    历史: 'culture',
    慢游: 'relaxed',
    轻松: 'relaxed',
    citywalk: 'citywalk',
    CityWalk: 'citywalk',
    打卡: 'classic'
  }
  const styleKeyword = Object.keys(styleMap).find((keyword) => text.includes(keyword))
  if (styleKeyword) preferences.style = styleMap[styleKeyword]

  if (text.includes('长辈') || text.includes('老人') || text.includes('父母')) preferences.companion = 'elders'
  if (text.includes('亲子') || text.includes('孩子') || text.includes('小孩')) preferences.companion = 'family'
  if (text.includes('情侣')) preferences.companion = 'couple'
  if (text.includes('朋友')) preferences.companion = 'friends'
  if (text.includes('一个人') || text.includes('独自')) preferences.companion = 'solo'

  return { ...preferences, ...input }
}

const normalizeAgentInput = ({ message, trip = {}, memory = {} }) => {
  const inferred = inferPreferences(message, trip)
  const preferences = memory.preferences || {}
  return {
    city: pickFirst(inferred.city, preferences.city, '广州'),
    budget: Number(pickFirst(inferred.budget, preferences.budget, 1500)),
    days: Number(pickFirst(inferred.days, preferences.days, 3)),
    style: TRAVEL_STYLES[pickFirst(inferred.style, preferences.style)] ? pickFirst(inferred.style, preferences.style) : 'classic',
    companion: COMPANION_TYPES[pickFirst(inferred.companion, preferences.companion)] ? pickFirst(inferred.companion, preferences.companion) : 'friends'
  }
}

const buildFallbackAnswer = ({ input, message, tools, ragResults, memorySummary }) => {
  const cityBrief = tools.find((tool) => tool.name === 'city_brief')?.output || {}
  const budgetPlan = tools.find((tool) => tool.name === 'budget_planner')?.output || {}
  const safety = tools.find((tool) => tool.name === 'safety_checker')?.output || {}
  const itinerary = tools.find((tool) => tool.name === 'itinerary_builder')?.output || []
  const ragText = ragResults.slice(0, 3).map((item) => `- ${item.title}`).join('\n')
  const routeText = itinerary.slice(0, 3).map((day) => `第${day.day}天：上午 ${day.morning.spot}，下午 ${day.afternoon.spot}，晚上 ${day.evening.spot}`).join('\n')

  return [
    `我按“${input.city} / ${input.days}天 / ${input.budget}元 / ${TRAVEL_STYLES[input.style]} / ${COMPANION_TYPES[input.companion]}”为你规划。`,
    '',
    '建议路线：',
    routeText,
    '',
    `预算建议：人均/总预算按 ${budgetPlan.perDayBudget || Math.round(input.budget / input.days)} 元/天控制，拆分为 ${toBudgetText(budgetPlan.breakdown)}。`,
    `当地重点：${(cityBrief.recommendedSpots || []).slice(0, 4).join('、')}；美食可选 ${(cityBrief.localFoods || []).slice(0, 4).join('、')}。`,
    '',
    '注意事项：',
    ...(safety.warnings || []).slice(0, 3).map((warning) => `- ${warning}`),
    ragText ? `\n参考知识：\n${ragText}` : '',
    memorySummary.includes('暂无') ? '' : `\n我已结合你的历史偏好继续规划。`,
    `\n你这次的问题是：“${message}”。如果要更精细，我可以继续拆成每天的交通、餐厅和预约清单。`
  ].filter(Boolean).join('\n')
}

class TravelAgent {
  constructor({ llm = null } = {}) {
    this.llm = llm
  }

  setLLM(llm) {
    this.llm = llm
  }

  async run(payload = {}) {
    const message = String(payload.message || '').trim()
    if (!message) throw new Error('请输入 Agent 任务内容')
    if (message.length > 1200) throw new Error('Agent 任务内容不能超过1200个字符')

    const sessionId = payload.sessionId || 'default'
    const memory = await memoryStore.load(sessionId)
    const input = normalizeAgentInput({ message, trip: payload.trip || {}, memory })
    const memorySummary = memoryStore.summarize(memory)
    const ragQuery = [message, input.city, TRAVEL_STYLES[input.style], COMPANION_TYPES[input.companion]].join(' ')
    const { results: ragResults, context: ragContext } = ragStore.buildContext(ragQuery, { topK: 4 })
    const tools = runTravelTools(input)

    let reply = ''
    let generatedBy = 'fallback-agent'

    if (this.llm) {
      const prompt = `用户任务：${message}

归一化旅行参数：${JSON.stringify(input)}

长期/短期记忆：
${memorySummary}

RAG 检索知识：
${ragContext || '暂无'}

工具调用结果：
${summarizeToolOutputs(tools)}

请基于记忆、RAG 和工具结果，用中文输出可执行旅行建议。要求：
1. 先给出核心结论，再给路线/预算/提醒。
2. 明确说明使用了哪些依据，但不要编造实时票价、天气和开放时间。
3. 如果信息不确定，提醒以官方信息为准。
4. 控制在 500 字以内。`

      try {
        const response = await this.llm.invoke([
          new SystemMessage('你是 Travel Agent，擅长结合工具、用户记忆和知识库做中文旅行规划。'),
          new HumanMessage(prompt)
        ])
        reply = toText(response.content).trim()
        generatedBy = 'llm-agent'
      } catch (error) {
        reply = buildFallbackAnswer({ input, message, tools, ragResults, memorySummary })
        generatedBy = `fallback-agent: ${error.message}`
      }
    } else {
      reply = buildFallbackAnswer({ input, message, tools, ragResults, memorySummary })
    }

    const updatedMemory = await memoryStore.appendTurn(sessionId, {
      userMessage: message,
      assistantReply: reply,
      tools: tools.map((tool) => tool.name),
      preferences: input
    })

    return {
      success: true,
      sessionId: updatedMemory.sessionId,
      reply,
      generatedBy,
      normalizedTrip: input,
      tools: tools.map((tool) => ({ name: tool.name, input: tool.input, output: tool.output })),
      rag: ragResults.map((item) => ({ id: item.id, title: item.title, score: item.score, city: item.city, tags: item.tags })),
      memory: {
        preferences: updatedMemory.preferences,
        turns: updatedMemory.history.length
      }
    }
  }
}

export default TravelAgent
