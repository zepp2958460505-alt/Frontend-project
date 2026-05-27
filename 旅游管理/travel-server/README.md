# AI 智能旅游规划服务端

基于 `Node.js + Express + LangChain` 的旅游规划服务端，提供结构化行程生成、SSE 流式输出和旅游问答能力。

## 功能

- `GET /api/heartbeat`：健康检查。
- `GET /api/travel/meta`：旅行偏好和同行人群枚举。
- `POST /api/travel/recommend`：生成结构化旅游行程。
- `POST /api/travel/recommend/stream`：流式生成旅游行程。
- `POST /api/travel/chat`：流式旅游问答。
- `POST /api/travel/agent`：第一版 Travel Agent，支持工具调用、记忆和 RAG。

## 环境变量

```bash
PORT=3101
CORS_ORIGIN=*
MODEL_PROVIDER=SILICONFLOW
SILICONFLOW_API_KEY=你的 API Key
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_BASE_MODEL=Qwen/Qwen3.6-35B-A3B
TRAVEL_AGENT_MEMORY_DIR=data/memory
```

未配置 API Key 或模型调用失败时，服务端会返回本地兜底行程/兜底 Agent 回复，便于演示与开发调试。

## 快速开始

```bash
npm install
npm run dev
```

## 可用脚本

```bash
npm start      # 启动服务
npm run dev    # nodemon 开发模式
npm run check       # JS 语法检查
npm run eval:agent  # Travel Agent 离线评测
```

## Travel Agent v1

第一版 Travel Agent 已补齐：

- 工具调用：城市信息、预算拆分、安全提醒、行程骨架生成。
- 记忆：按 `sessionId` 保存用户偏好和最近对话，默认目录为 `data/memory/`。
- RAG：内置轻量知识库，检索城市、预算、安全和同行人群建议。
- 评测：`npm run eval:agent` 会检查关键词覆盖、工具调用、RAG 命中和记忆写入。

接口示例：

```bash
curl -X POST http://localhost:3101/api/travel/agent \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo","message":"广州3天亲子游，预算2000，轻松一点"}'
```

详细说明见：`docs/travel-agent-v1.md`。
