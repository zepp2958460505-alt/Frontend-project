const HISTORY_KEY = 'travel_plan_history'
const MAX_HISTORY = 20

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    return fallback
  }
}

export const getTripHistory = () => safeParse(localStorage.getItem(HISTORY_KEY), [])

export const saveTripPlan = ({ query, plan }) => {
  if (!plan?.city) return null

  const history = getTripHistory()
  const record = {
    id: `${Date.now()}_${plan.city}`,
    city: plan.city,
    days: plan.days,
    budget: plan.totalBudget || query?.budget,
    style: plan.style || query?.style,
    companion: plan.companion || query?.companion,
    createdAt: new Date().toISOString(),
    query,
    plan
  }

  const nextHistory = [record, ...history].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory))
  return record
}

export const getTripRecord = (id) => getTripHistory().find((item) => item.id === id)

export const removeTripRecord = (id) => {
  const nextHistory = getTripHistory().filter((item) => item.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory))
}

export const clearTripHistory = () => {
  localStorage.removeItem(HISTORY_KEY)
}
