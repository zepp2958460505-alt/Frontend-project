<template>
  <div class="profile-container">
    <van-nav-bar title="我的" />

    <div class="user-info">
      <van-image :src="userAvatar" round class="avatar" />
      <div class="user-details">
        <h2 class="user-name">{{ userName }}</h2>
        <p class="user-desc">欢迎使用智能旅游助手</p>
      </div>
    </div>

    <div class="stats-card">
      <div class="stat-item">
        <strong>{{ historyCount }}</strong>
        <span>历史行程</span>
      </div>
      <div class="stat-item">
        <strong>3</strong>
        <span>AI能力</span>
      </div>
      <div class="stat-item">
        <strong>1.1</strong>
        <span>当前版本</span>
      </div>
    </div>

    <div class="menu-section">
      <h3 class="menu-title">我的服务</h3>
      <van-cell-group>
        <van-cell title="历史记录" is-link icon="history" :value="`${historyCount}条`" @click="router.push('/history')" />
        <van-cell title="重新规划" is-link icon="guide-o" @click="router.push('/')" />
        <van-cell title="AI 旅游咨询" is-link icon="chat-o" @click="router.push('/chat')" />
        <van-cell title="清空历史" is-link icon="delete-o" @click="handleClearHistory" />
      </van-cell-group>
    </div>

    <div class="menu-section">
      <h3 class="menu-title">关于</h3>
      <van-cell-group>
        <van-cell title="关于我们" is-link @click="showAboutDialog" />
        <van-cell title="版本信息" value="v1.1.0" />
      </van-cell-group>
    </div>

    <van-dialog v-model:show="aboutDialogVisible" title="关于我们" show-cancel-button>
      <div class="about-content">
        <p>智能旅游助手 v1.1.0</p>
        <p class="mt-2">支持 AI 问答、结构化行程生成、预算拆分和历史行程管理。</p>
        <p class="mt-2">行程建议仅供参考，出行前请以官方开放时间、天气和交通信息为准。</p>
        <p class="mt-4 text-center">© 2026 智能旅游助手</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { clearTripHistory, getTripHistory } from '@/utils/storage'

const router = useRouter()
const userAvatar = 'https://img.yzcdn.cn/vant/cat.jpeg'
const userName = '游客'
const aboutDialogVisible = ref(false)
const historyCount = ref(0)

const refreshStats = () => {
  historyCount.value = getTripHistory().length
}

const showAboutDialog = () => {
  aboutDialogVisible.value = true
}

const handleClearHistory = () => {
  if (!historyCount.value) {
    showToast('暂无历史记录')
    return
  }

  showConfirmDialog({
    title: '清空历史',
    message: '确定清空所有历史行程吗？'
  }).then(() => {
    clearTripHistory()
    refreshStats()
    showToast('已清空')
  })
}

onMounted(refreshStats)
</script>

<style scoped>
.profile-container {
  padding-bottom: 70px;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #1989fa 0%, #36cbcb 100%);
  color: white;
}

.avatar {
  width: 80px;
  height: 80px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.user-details {
  margin-left: 20px;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 5px;
}

.user-desc {
  font-size: 14px;
  opacity: 0.9;
}

.stats-card {
  display: flex;
  justify-content: space-around;
  margin: 12px 10px 0;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-item strong {
  color: #1989fa;
  font-size: 22px;
}

.stat-item span {
  color: #646566;
  font-size: 12px;
}

.menu-section {
  margin-top: 15px;
  background-color: white;
  border-radius: 12px;
  margin: 15px 10px 0;
  overflow: hidden;
}

.menu-title {
  font-size: 14px;
  color: #646566;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
}

.about-content {
  padding: 8px 16px 16px;
  text-align: center;
  line-height: 1.6;
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.text-center {
  text-align: center;
}
</style>
