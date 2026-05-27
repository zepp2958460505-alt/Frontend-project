# Travel Agent v1 说明

## 目标

第一版 Travel Agent 在现有旅游服务端基础上补齐三类 Agent 能力：

1. **工具调用**：将城市信息、预算拆分、安全提醒、行程生成拆成可观测工具。
2. **记忆**：按 `sessionId` 保存用户偏好和最近对话，下一轮自动复用城市、预算、天数、偏好和同行人群。
3. **RAG**：内置轻量旅游知识库，按用户问题检索相关城市、预算、安全和人群建议。
4. **评测脚本**：提供离线评测用例，检查关键词、工具调用、RAG 命中和记忆写入。

## 新增接口

### `POST /api/travel/agent`

请求示例：

```json
{
  "sessionId": "demo-user-001",
  "message": "我想带孩子去广州玩3天，预算2000元，想轻松一点，帮我规划。"
}
```

也可以显式传入结构化旅行参数：

```json
{
  "sessionId": "demo-user-001",
  "message": "继续帮我细化每天路线",
  "trip": {
    "city": "广州",
    "days": 3,
    "budget": 2000,
    "style": "family",
    "companion": "family"
  }
}
```

响应字段：

| 字段 | 说明 |
| --- | --- |
| `reply` | Agent 给用户的中文旅行建议 |
| `normalizedTrip` | 从消息、显式参数和记忆中归一化出的旅行参数 |
| `tools` | 本轮调用的工具及输入输出 |
| `rag` | 本轮命中的知识库片段 |
| `memory` | 当前会话记忆摘要 |
| `generatedBy` | `llm-agent` 或 `fallback-agent` |

## 工具清单

| 工具 | 作用 |
| --- | --- |
| `city_brief` | 根据城市、偏好和同行人群返回景点、美食和交通建议 |
| `budget_planner` | 根据预算、天数和同行人群拆分预算 |
| `safety_checker` | 输出预约、天气、交通和特殊人群安全提醒 |
| `itinerary_builder` | 生成每天上午、下午、晚上的路线骨架 |

## 记忆说明

- 默认记忆目录：`data/memory/`
- 文件名由 `sessionId` 安全归一化后生成。
- 保存内容包括：用户偏好、最近 20 条对话、更新时间。
- `.gitignore` 默认忽略实际记忆 JSON，避免提交用户数据。

## RAG 说明

- 内置知识库位置：`src/data/travelKnowledge.js`
- 检索实现位置：`src/agent/ragStore.js`
- 当前使用轻量关键词/中文 bigram 检索，不依赖向量数据库，适合第一版演示。
- 后续可替换为 Embedding + 向量库，接口层无需大改。

## 本地验证

```bash
npm run check
npm run eval:agent
```

直接调用接口：

```bash
curl -X POST http://localhost:3101/api/travel/agent \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo","message":"广州3天亲子游，预算2000，轻松一点"}'
```

## 评测标准

`scripts/eval-agent.js` 会检查：

1. 回复是否覆盖核心关键词。
2. 是否调用至少 4 个工具。
3. 是否命中足够 RAG 片段。
4. 是否写入会话记忆。

评测结果会输出到 `data/eval-results/`，实际 JSON 结果默认不提交到 Git。
