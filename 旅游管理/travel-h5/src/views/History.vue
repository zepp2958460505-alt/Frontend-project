<template>
  <div class="page-container history-page">
    <div class="page-header">
      <van-nav-bar title="历史行程" left-arrow left-text="返回" @click-left="router.back()" />
    </div>

    <div class="page-content">
      <van-empty v-if="!historyList.length" description="暂无历史行程">
        <van-button type="primary" round @click="router.push('/')">去规划行程</van-button>
      </van-empty>

      <template v-else>
        <div class="history-actions">
          <span>共 {{ historyList.length }} 条记录</span>
          <van-button size="small" plain type="danger" @click="handleClear">清空</van-button>
        </div>

        <van-swipe-cell v-for="item in historyList" :key="item.id">
          <div class="history-card" @click="openDetail(item)">
            <div class="card-main">
              <h3>{{ item.city }} · {{ item.days }}天</h3>
              <p>{{ getTravelStyleLabel(item.style) }}｜{{ getCompanionLabel(item.companion) }}</p>
              <p>预算 ¥{{ item.budget }}｜{{ formatTime(item.createdAt) }}</p>
            </div>
            <van-icon name="arrow" color="#969799" />
          </div>
          <template #right>
            <van-button square type="danger" text="删除" class="delete-button" @click="handleDelete(item.id)" />
          </template>
        </van-swipe-cell>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { clearTripHistory, getTripHistory, removeTripRecord } from '@/utils/storage'
import { getCompanionLabel, getTravelStyleLabel } from '@/constants/travel'

const router = useRouter()
const route = useRoute()
const historyList = ref([])

const loadHistory = () => {
  historyList.value = getTripHistory()
}

const openDetail = (item) => {
  router.push({ path: '/detail', query: { recordId: item.id } })
}

const handleDelete = (id) => {
  removeTripRecord(id)
  loadHistory()
  showToast('已删除')
}

const handleClear = () => {
  showConfirmDialog({
    title: '清空历史',
    message: '确定清空所有历史行程吗？'
  }).then(() => {
    clearTripHistory()
    loadHistory()
  })
}

const formatTime = (value) => new Date(value).toLocaleString('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

onMounted(() => {
  loadHistory()
  if (route.query.id) {
    const target = historyList.value.find((item) => item.id === route.query.id)
    if (target) openDetail(target)
  }
})
</script>

<style scoped>
.history-page {
  padding-bottom: 70px;
}

.history-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #646566;
  font-size: 14px;
}

.history-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-main h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #323233;
}

.card-main p {
  margin: 4px 0;
  color: #646566;
  font-size: 13px;
}

.delete-button {
  height: calc(100% - 12px);
}
</style>
