<template>
  <div class="page-container chat-page">
    <div class="page-header">
      <van-nav-bar
        title="AI 旅游助手"
        left-arrow
        left-text="返回"
        fixed
        @click-left="onBack"
      />
    </div>

    <div class="chat-container" ref="chatContainer">
      <div v-if="messages.length === 0" class="chat-empty">
        <van-empty description="开始和 AI 助手对话" />
        <div class="quick-questions">
          <div class="quick-title">常见问题</div>
          <van-tag
            v-for="question in quickQuestions"
            :key="question"
            mark
            size="large"
            class="quick-tag"
            @click="handleClickTag(question)"
          >
            {{ question }}
          </van-tag>
        </div>
      </div>

      <div class="message-list" v-else>
        <ChatBubble v-for="message in messages" :key="message.id" :message="message" />
        <div class="streaming-indicator" v-if="isStreaming">
          <van-loading type="spinner" size="20px" />
          <span>AI 正在思考中...</span>
          <van-button size="mini" type="default" @click="abortStream">停止</van-button>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <van-field
        v-model="inputMessage"
        placeholder="输入您的问题..."
        clearable
        :disabled="isStreaming"
        @keyup.enter="sendMessage()"
      >
        <template #button>
          <van-button type="primary" size="small" :disabled="!inputMessage.trim() || isStreaming" @click="sendMessage()">
            发送
          </van-button>
        </template>
      </van-field>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchStream } from '@/utils/request'
import ChatBubble from '@/components/ChatBubble.vue'
import { getTravelStyleLabel } from '@/constants/travel'

const router = useRouter()
const route = useRoute()
const quickQuestions = ref([
  '北京三天怎么玩更轻松？',
  '上海有哪些适合 City Walk 的路线？',
  '成都美食和景点怎么安排？',
  '旅行预算如何分配更合理？'
])

const chatContainer = ref(null)
const messages = ref([])
const inputMessage = ref('')
const isStreaming = ref(false)
const streamController = ref(null)
let messageId = 0

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const onBack = () => router.back()

const createMessage = (role, content = '') => ({
  id: `${Date.now()}_${messageId++}`,
  role,
  content,
  timestamp: new Date().toISOString()
})

const addUserMessage = (content) => {
  messages.value.push(createMessage('user', content))
}

const handleClickTag = (question) => {
  sendMessage(question)
}

const sendMessage = (message = inputMessage.value) => {
  const msg = String(message || '').trim()
  if (!msg || isStreaming.value) return

  addUserMessage(msg)
  inputMessage.value = ''
  fetchAIResponse(msg)
}

const fetchAIResponse = (userMsg) => {
  isStreaming.value = true
  const aiMessage = createMessage('ai')
  messages.value.push(aiMessage)
  scrollToBottom()

  let fullResponse = ''
  streamController.value = fetchStream(
    'chat',
    { message: userMsg },
    (chunk) => {
      fullResponse += chunk
      aiMessage.content = fullResponse
      scrollToBottom()
    },
    () => {
      isStreaming.value = false
      streamController.value = null
      scrollToBottom()
    },
    (errMsg) => {
      aiMessage.content = `抱歉，AI 回复发生错误：${errMsg}`
      isStreaming.value = false
      streamController.value = null
      showToast('AI 回复失败，请稍后重试')
      scrollToBottom()
    }
  )
}

const abortStream = () => {
  streamController.value?.abort()
  streamController.value = null
  isStreaming.value = false
}

const buildSceneQuestion = () => {
  const city = route.query.city
  if (!city) return ''

  if (route.query.scene === 'detail') {
    return `基于我的${city}行程，结合${getTravelStyleLabel(route.query.style)}偏好，帮我补充交通、美食和避坑建议。`
  }

  return `推荐${city}值得游玩的景点、美食和适合第一次去的路线。`
}

onMounted(() => {
  const question = buildSceneQuestion()
  if (question) {
    sendMessage(question)
  }
})

onBeforeUnmount(() => {
  abortStream()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 100vh;
  padding-top: 46px;
  padding-bottom: 106px;
  box-sizing: border-box;
  overflow: hidden;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.quick-questions {
  margin-top: 32px;
  text-align: center;
}

.quick-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.quick-tag {
  margin: 8px;
  cursor: pointer;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: #999;
  font-size: 14px;
}

.chat-input-area {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: #fff;
  padding: 8px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  z-index: 101;
}

.chat-input-area :deep(.van-field) {
  background: #f7f8fa;
  border-radius: 20px;
  padding: 8px 16px;
  box-sizing: border-box;
}
</style>
