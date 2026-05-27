import { travelKnowledgeBase } from '../data/travelKnowledge.js'

const tokenize = (text = '') => {
  const normalized = String(text).toLowerCase()
  const latinTokens = normalized.match(/[a-z0-9]+/g) || []
  const chineseTokens = normalized.match(/[\u4e00-\u9fa5]{2,}/g) || []
  const chineseBigrams = chineseTokens.flatMap((token) => {
    const chars = [...token]
    return chars.slice(0, -1).map((char, index) => `${char}${chars[index + 1]}`)
  })
  return [...latinTokens, ...chineseTokens, ...chineseBigrams]
}

const unique = (items) => [...new Set(items.filter(Boolean))]

const scoreDocument = (doc, queryTokens) => {
  const text = `${doc.title} ${doc.city} ${doc.tags.join(' ')} ${doc.content}`
  const docTokens = unique(tokenize(text))
  const docTokenSet = new Set(docTokens)
  const tagSet = new Set(doc.tags.map((tag) => String(tag).toLowerCase()))

  return queryTokens.reduce((score, token) => {
    if (tagSet.has(token)) return score + 4
    if (String(doc.city).toLowerCase() === token) return score + 5
    if (docTokenSet.has(token)) return score + 1
    if (text.toLowerCase().includes(token)) return score + 0.5
    return score
  }, 0)
}

export class TravelRagStore {
  constructor(documents = travelKnowledgeBase) {
    this.documents = documents
  }

  search(query, options = {}) {
    const topK = options.topK || 4
    const queryTokens = unique(tokenize(query))
    if (!queryTokens.length) return []

    return this.documents
      .map((document) => ({ ...document, score: scoreDocument(document, queryTokens) }))
      .filter((document) => document.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, topK)
  }

  buildContext(query, options = {}) {
    const results = this.search(query, options)
    return {
      results,
      context: results.map((item, index) => `${index + 1}. ${item.title}：${item.content}`).join('\n')
    }
  }
}

export default new TravelRagStore()
