AI 智能旅游规划系统
一个面向移动端的 AI 旅游规划项目，采用前后端分离架构：前端提供 H5 行程规划、历史行程和 AI 咨询交互，后端提供结构化行程生成、SSE 流式问答以及第一版 Travel Agent 能力。

项目定位：用于展示 Vue3 移动端开发、Node.js 服务端接口设计、AI 应用接入、SSE 流式响应、Agent 工具调用、会话记忆、轻量 RAG 和评测脚本等完整工程能力。

项目亮点
移动端 H5 体验：基于 Vue 3 + Vite + Vant，支持城市、预算、天数、旅行偏好、同行人群等多维输入。
AI 行程生成：后端根据用户参数生成结构化行程，包含每日安排、预算拆分、本地美食、出行清单、提示事项和风险提醒。
SSE 流式问答：支持旅游咨询流式输出，提升 AI 回复的实时交互体验。
本地历史闭环：前端使用 LocalStorage 保存最近行程，支持回看、删除、清空和从历史继续咨询。
Travel Agent v1：服务端补齐工具调用、会话记忆、轻量 RAG 和离线评测脚本，便于演示 Agent 工程化能力。
可演示兜底方案：未配置大模型 API Key 或模型调用失败时，后端可返回本地兜底行程，保证项目可运行、可展示。
技术栈
模块	技术
前端	Vue 3、Vite、Vant、Vue Router、Axios、Server-Sent Events、LocalStorage
后端	Node.js、Express、LangChain、OpenAI-compatible API、CORS、dotenv
Agent	工具调用、Session 记忆、轻量关键词 RAG、离线评测脚本
工程化	环境变量配置、前后端分离、接口分层、语法检查脚本、兜底数据策略
目录结构
旅游管理/
├── travel-h5/                 # 移动端 H5 前端
│   ├── src/
│   │   ├── components/        # 行程卡片、预算表、聊天气泡等组件
│   │   ├── constants/         # 城市、偏好、同行人群配置
│   │   ├── router/            # 页面路由
│   │   ├── utils/             # 请求层、SSE 解析、本地历史存储
│   │   └── views/             # 首页、详情、聊天、历史、我的
│   └── README.md
├── travel-server/             # Node.js 服务端
│   ├── src/
│   │   ├── agent/             # Travel Agent、工具、记忆、RAG
│   │   ├── data/              # 旅游知识库
│   │   ├── routes/            # API 路由
│   │   ├── services/          # 行程生成与 Agent 服务
│   │   └── utils/             # 参数校验、SSE 工具
│   ├── scripts/eval-agent.js  # Travel Agent 离线评测脚本
│   └── docs/travel-agent-v1.md
└── 项目评估与优化说明.md       # 项目问题评估与优化记录
快速开始
1. 启动后端
cd travel-server
npm install
cp .env.example .env
npm run dev
后端默认端口：3101。

如需接入真实大模型，请在 .env 中配置：

PORT=3101
CORS_ORIGIN=*
MODEL_PROVIDER=SILICONFLOW
SILICONFLOW_API_KEY=你的 API Key
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_BASE_MODEL=Qwen/Qwen3.6-35B-A3B
TRAVEL_AGENT_MEMORY_DIR=data/memory
2. 启动前端
cd travel-h5
npm install
npm run dev
前端默认通过 Vite 代理请求后端，可配置：

VITE_API_ORIGIN=http://localhost:3101
VITE_API_BASE_URL=/api/travel
核心接口
方法	路径	说明
GET	/api/heartbeat	服务健康检查
GET	/api/travel/meta	获取城市偏好、同行人群等枚举配置
POST	/api/travel/recommend	生成结构化旅游行程
POST	/api/travel/recommend/stream	流式生成旅游行程
POST	/api/travel/chat	流式旅游问答
POST	/api/travel/agent	Travel Agent：工具调用 + 记忆 + RAG
Travel Agent 调用示例：

curl -X POST http://localhost:3101/api/travel/agent \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo","message":"广州3天亲子游，预算2000，轻松一点"}'
Travel Agent v1
第一版 Agent 主要包含四部分：

工具调用：城市信息、预算拆分、安全提醒、行程骨架生成。
会话记忆：按 sessionId 保存用户偏好和最近对话，下一轮自动复用城市、预算、天数、偏好和同行人群。
轻量 RAG：基于内置旅游知识库进行关键词检索，补充城市、预算、安全和人群建议。
评测脚本：检查回复关键词覆盖、工具调用数量、RAG 命中和记忆写入。
运行评测：

cd travel-server
npm run check
npm run eval:agent
详细说明见：travel-server/docs/travel-agent-v1.md。

页面功能
首页规划：选择城市、预算、天数、偏好、人群，生成专属行程。
行程详情：展示每日路线、预算分布、本地美食、清单、提示和注意事项。
AI 咨询：围绕热门城市或当前行程继续追问，支持 SSE 流式输出。
历史行程：保存最近规划，支持回看、删除、清空和继续咨询。
我的页面：展示历史统计，并提供重新规划、历史记录和 AI 咨询入口。
后续优化方向
接入真实地图、天气、票务或 POI API。
将轻量关键词 RAG 替换为 Embedding + 向量数据库。
为前端补充截图、录屏和在线演示地址。
增加接口单元测试、E2E 测试和 CI 检查流程。
