# AI 智能旅游规划 H5

基于 `Vue 3 + Vite + Vant` 的移动端智能旅游助手，支持 AI 行程规划、流式旅游问答、预算拆分、本地行程历史和多维旅行偏好。

## 功能模块

- 首页规划：城市、预算、天数、旅行偏好、同行人群。
- 行程详情：每日时间段安排、预算明细、本地美食、出行清单、温馨提示和注意事项。
- AI 对话：基于 SSE 的流式回复，支持热门城市和详情页场景化追问。
- 历史行程：本地保存最近 20 条行程，支持回看、删除和清空。
- 我的页面：历史统计、重新规划、AI 咨询和版本说明。

## 技术栈

- Vue 3
- Vite
- Vant 4
- Vue Router
- Axios
- Server-Sent Events
- LocalStorage

## 快速开始

```bash
npm install
npm run dev
```

默认通过 Vite 代理请求后端：

```bash
VITE_API_ORIGIN=http://localhost:3101
VITE_API_BASE_URL=/api/travel
```

## 可用脚本

```bash
npm run dev      # 启动开发服务
npm run build    # 生产构建
npm run preview  # 预览构建结果
npm run check    # Vue SFC 语法检查
```

## 目录说明

```text
src/
├── components/       # 行程卡片、预算表、聊天气泡
├── constants/        # 城市、旅行偏好、同行人群配置
├── router/           # 页面路由
├── utils/            # 请求层、本地历史存储
└── views/            # 首页、详情、聊天、历史、我的
```
