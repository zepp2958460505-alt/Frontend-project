import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import travelAgentService from '../src/services/travelAgentService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const outputDir = path.resolve(__dirname, '../data/eval-results')

const cases = [
  {
    id: 'guangzhou-family-budget',
    sessionId: 'eval-guangzhou-family',
    message: '我想带孩子去广州玩3天，预算2000元，想轻松一点，帮我规划。',
    expects: ['广州', '亲子', '预算', '第1天'],
    minTools: 4,
    minRag: 2
  },
  {
    id: 'chengdu-food-memory',
    sessionId: 'eval-chengdu-food',
    message: '成都2天美食慢游，预算1200，少走路，多安排吃的。',
    expects: ['成都', '美食', '预算'],
    minTools: 4,
    minRag: 1
  },
  {
    id: 'beijing-elders-safety',
    sessionId: 'eval-beijing-elders',
    message: '带父母去北京4天，想看历史文化景点，提醒我预约和安全注意事项。',
    expects: ['北京', '长辈', '预约', '安全'],
    minTools: 4,
    minRag: 1
  }
]

const scoreCase = (testCase, result) => {
  const reply = result.reply || ''
  const matched = testCase.expects.filter((keyword) => reply.includes(keyword))
  const toolPass = (result.tools || []).length >= testCase.minTools
  const ragPass = (result.rag || []).length >= testCase.minRag
  const memoryPass = result.memory && result.memory.turns >= 2
  const passed = matched.length === testCase.expects.length && toolPass && ragPass && memoryPass

  return {
    id: testCase.id,
    passed,
    score: [matched.length / testCase.expects.length, toolPass ? 1 : 0, ragPass ? 1 : 0, memoryPass ? 1 : 0]
      .reduce((sum, item) => sum + item, 0) / 4,
    checks: {
      expectedKeywords: testCase.expects,
      matchedKeywords: matched,
      toolCount: (result.tools || []).length,
      ragCount: (result.rag || []).length,
      memoryTurns: result.memory?.turns || 0,
      generatedBy: result.generatedBy
    }
  }
}

const main = async () => {
  await fs.mkdir(outputDir, { recursive: true })
  const results = []

  for (const testCase of cases) {
    const result = await travelAgentService.run({
      sessionId: testCase.sessionId,
      message: testCase.message
    })
    results.push({ testCase, result, evaluation: scoreCase(testCase, result) })
  }

  const summary = {
    success: results.every((item) => item.evaluation.passed),
    total: results.length,
    passed: results.filter((item) => item.evaluation.passed).length,
    averageScore: Number((results.reduce((sum, item) => sum + item.evaluation.score, 0) / results.length).toFixed(3)),
    generatedAt: new Date().toISOString(),
    results: results.map((item) => item.evaluation)
  }

  const outputPath = path.join(outputDir, `agent-eval-${Date.now()}.json`)
  await fs.writeFile(outputPath, JSON.stringify({ summary, details: results }, null, 2), 'utf8')

  console.log(JSON.stringify(summary, null, 2))
  console.log(`评测明细已写入: ${outputPath}`)

  if (!summary.success) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Travel Agent 评测失败:', error)
  process.exit(1)
})
