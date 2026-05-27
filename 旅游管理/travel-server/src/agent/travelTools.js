import { COMPANION_TYPES, TRAVEL_STYLES } from '../utils/validators.js'

const CITY_PROFILES = {
  广州: {
    foods: ['早茶', '肠粉', '烧鹅', '云吞面', '糖水'],
    spots: ['广州塔', '广东省博物馆', '永庆坊', '沙面', '长隆野生动物世界'],
    transport: '地铁覆盖核心景区，长隆片区建议单独预留半天到一天。'
  },
  成都: {
    foods: ['火锅', '串串', '担担面', '钟水饺', '兔头'],
    spots: ['熊猫基地', '人民公园', '宽窄巷子', '武侯祠', '锦里'],
    transport: '市区可地铁+打车组合，熊猫基地建议上午出发。'
  },
  北京: {
    foods: ['北京烤鸭', '炸酱面', '豆汁焦圈', '铜锅涮肉'],
    spots: ['故宫', '天安门', '国家博物馆', '颐和园', '长城'],
    transport: '景点距离较大，热门场馆需提前预约并预留安检时间。'
  },
  上海: {
    foods: ['生煎', '小笼包', '本帮菜', '葱油拌面'],
    spots: ['外滩', '南京路', '豫园', '武康路', '陆家嘴'],
    transport: '地铁便利，City Walk 路线适合按街区集中安排。'
  }
}

const formatCurrency = (amount) => `${Math.round(amount)}元`

export const buildBudgetTool = ({ budget, days, companion }) => {
  const total = Number(budget) || 1000
  const multiplier = companion === 'family' || companion === 'elders' ? 1.1 : 1
  const accommodationRate = companion === 'family' || companion === 'elders' ? 0.4 : 0.35
  const foodRate = 0.25
  const transportationRate = companion === 'elders' ? 0.22 : 0.18
  const ticketsRate = 0.15
  const otherRate = Math.max(0.05, 1 - accommodationRate - foodRate - transportationRate - ticketsRate)

  return {
    name: 'budget_planner',
    input: { budget: total, days, companion },
    output: {
      totalBudget: total,
      perDayBudget: Math.round(total / Math.max(Number(days) || 1, 1)),
      breakdown: {
        accommodation: Math.round(total * accommodationRate * multiplier),
        food: Math.round(total * foodRate),
        transportation: Math.round(total * transportationRate),
        tickets: Math.round(total * ticketsRate),
        other: Math.round(total * otherRate)
      },
      advice: `建议按住宿、餐饮、交通、门票和机动资金拆分；${COMPANION_TYPES[companion] || '同行人群'}应预留 10%-15% 机动费用。`
    }
  }
}

export const buildCityTool = ({ city, style, companion }) => {
  const profile = CITY_PROFILES[city] || {
    foods: [`${city}本地小吃`, '热门商圈餐厅', '地方特色菜'],
    spots: [`${city}城市地标`, `${city}博物馆/展馆`, `${city}特色街区`, `${city}夜景休闲区`],
    transport: '建议优先使用公共交通，跨区移动时预留 30-60 分钟缓冲。'
  }

  return {
    name: 'city_brief',
    input: { city, style, companion },
    output: {
      city,
      recommendedSpots: profile.spots,
      localFoods: profile.foods,
      transportAdvice: profile.transport,
      styleAdvice: `${TRAVEL_STYLES[style] || TRAVEL_STYLES.classic}路线建议每天聚焦 2-3 个重点，避免赶行程。`
    }
  }
}

export const buildSafetyTool = ({ city, companion, days }) => ({
  name: 'safety_checker',
  input: { city, companion, days },
  output: {
    warnings: [
      '热门景点、博物馆和夜游项目请提前确认预约与开放时间。',
      '出行前 24 小时确认天气、交通管制和景区临时公告。',
      companion === 'elders' ? '带长辈出行建议减少台阶多、排队长和换乘复杂的路线。' : '每天保留 1-2 小时弹性时间，避免行程过满。'
    ],
    packingList: ['身份证件', '充电宝', '舒适步行鞋', '雨具/防晒用品', '常用药']
  }
})

export const buildItineraryTool = ({ city, days, style, companion, cityBrief }) => {
  const spots = cityBrief.recommendedSpots
  const foods = cityBrief.localFoods
  const dayCount = Math.max(1, Number(days) || 1)
  const relaxed = companion === 'elders' || companion === 'family' || style === 'relaxed'

  return {
    name: 'itinerary_builder',
    input: { city, days, style, companion },
    output: Array.from({ length: dayCount }, (_, index) => ({
      day: index + 1,
      morning: {
        spot: spots[index % spots.length],
        duration: relaxed ? '2小时' : '2-3小时',
        ticket: '以官方信息为准',
        transportation: '地铁/公交优先',
        description: `上午安排${city}代表性体验，体力较好且拍照体验更稳定。`
      },
      afternoon: {
        spot: spots[(index + 1) % spots.length],
        duration: relaxed ? '2小时 + 休息' : '3小时',
        ticket: '按景点消费',
        transportation: '公共交通 + 步行',
        description: `结合${TRAVEL_STYLES[style] || TRAVEL_STYLES.classic}偏好，下午安排主题游览。`
      },
      evening: {
        spot: `${foods[index % foods.length]} + 夜间休闲`,
        duration: '1.5-2小时',
        ticket: '按消费',
        transportation: '步行/打车',
        description: '晚间以餐饮和轻松休闲为主，避免影响第二天体力。'
      }
    }))
  }
}

export const runTravelTools = (input) => {
  const cityTool = buildCityTool(input)
  const budgetTool = buildBudgetTool(input)
  const safetyTool = buildSafetyTool(input)
  const itineraryTool = buildItineraryTool({ ...input, cityBrief: cityTool.output })

  return [cityTool, budgetTool, safetyTool, itineraryTool]
}

export const summarizeToolOutputs = (tools) => tools
  .map((tool) => `${tool.name}: ${JSON.stringify(tool.output)}`)
  .join('\n')

export const toBudgetText = (breakdown = {}) => Object.entries(breakdown)
  .map(([key, value]) => `${key} ${formatCurrency(value)}`)
  .join('，')
