import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const defaultMemoryDir = path.resolve(__dirname, '../../data/memory')

const safeSessionId = (sessionId = 'default') => {
  const normalized = String(sessionId || 'default').trim() || 'default'
  return normalized.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
}

export class FileMemoryStore {
  constructor(memoryDir = process.env.TRAVEL_AGENT_MEMORY_DIR || defaultMemoryDir) {
    this.memoryDir = memoryDir
  }

  async ensureDir() {
    await fs.mkdir(this.memoryDir, { recursive: true })
  }

  getFilePath(sessionId) {
    return path.join(this.memoryDir, `${safeSessionId(sessionId)}.json`)
  }

  async load(sessionId) {
    await this.ensureDir()
    const filePath = this.getFilePath(sessionId)

    try {
      const raw = await fs.readFile(filePath, 'utf8')
      const parsed = JSON.parse(raw)
      return {
        sessionId: safeSessionId(sessionId),
        preferences: parsed.preferences || {},
        history: Array.isArray(parsed.history) ? parsed.history : []
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('读取旅行 Agent 记忆失败，将使用空记忆:', error.message)
      }
      return { sessionId: safeSessionId(sessionId), preferences: {}, history: [] }
    }
  }

  async save(sessionId, memory) {
    await this.ensureDir()
    const normalized = {
      sessionId: safeSessionId(sessionId),
      preferences: memory.preferences || {},
      history: Array.isArray(memory.history) ? memory.history.slice(-20) : [],
      updatedAt: new Date().toISOString()
    }
    await fs.writeFile(this.getFilePath(sessionId), JSON.stringify(normalized, null, 2), 'utf8')
    return normalized
  }

  async appendTurn(sessionId, turn) {
    const memory = await this.load(sessionId)
    const nextMemory = {
      ...memory,
      preferences: { ...memory.preferences, ...(turn.preferences || {}) },
      history: [
        ...memory.history,
        {
          role: 'user',
          content: turn.userMessage,
          createdAt: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: turn.assistantReply,
          tools: turn.tools || [],
          createdAt: new Date().toISOString()
        }
      ].slice(-20)
    }
    return this.save(sessionId, nextMemory)
  }

  summarize(memory) {
    const preferences = memory.preferences || {}
    const preferenceText = Object.entries(preferences)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('；')
    const recentHistory = (memory.history || [])
      .slice(-6)
      .map((item) => `${item.role === 'user' ? '用户' : '助手'}：${item.content}`)
      .join('\n')

    return [
      preferenceText ? `已知偏好：${preferenceText}` : '已知偏好：暂无',
      recentHistory ? `近期对话：\n${recentHistory}` : '近期对话：暂无'
    ].join('\n')
  }
}

export default new FileMemoryStore()
