<template>
  <div class="page-container detail-page">
    <div class="page-header">
      <van-nav-bar
        fixed
        left-text="返回"
        left-arrow
        @click-left="onBack"
        :title="`${formData.city || '行程'}规划`"
      />
    </div>

    <div class="page-content">
      <div v-if="isLoading" class="loading-container">
        <van-loading size="48" type="spinner">正在生成旅游规划...</van-loading>
      </div>

      <div v-else-if="errorMsg">
        <van-empty :description="errorMsg">
          <van-button type="primary" @click="fetchTripData">重试</van-button>
        </van-empty>
      </div>

      <template v-else-if="tripData && tripData.success !== false">
        <div class="card overview-card">
          <div class="trip-header">
            <div>
              <h2>{{ tripData.city }} · {{ tripData.days }} 天行程</h2>
              <p class="trip-subtitle">{{ getTravelStyleLabel(tripData.style) }}｜{{ getCompanionLabel(tripData.companion) }}</p>
            </div>
            <span class="trip-budget">¥{{ tripData.totalBudget }}</span>
          </div>
          <van-notice-bar
            v-if="tripData.generatedBy === 'fallback'"
            left-icon="warning-o"
            text="当前使用本地兜底规划，建议联网后重新生成更个性化的行程。"
            color="#ed6a0c"
            background="#fffbe8"
          />
        </div>

        <van-collapse v-model="activeDays" class="trip-collapse">
          <van-collapse-item
            v-for="day in tripData.dailyItinerary"
            :key="day.day"
            :title="`第${day.day}天`"
            :name="day.day"
          >
            <div class="day-schedule">
              <div class="schedule-section">
                <div class="section-label morning">上午</div>
                <SpotItem :data="day.morning" />
              </div>
              <div class="schedule-section">
                <div class="section-label afternoon">下午</div>
                <SpotItem :data="day.afternoon" />
              </div>
              <div class="schedule-section">
                <div class="section-label evening">晚上</div>
                <SpotItem :data="day.evening" />
              </div>
            </div>
          </van-collapse-item>
        </van-collapse>

        <div class="card budget-card" v-if="tripData.budgetBreakdown">
          <div class="section-title">预算明细</div>
          <BudgetTable :data="tripData.budgetBreakdown" :total="tripData.totalBudget" />
        </div>

        <div class="card" v-if="tripData.localFoods?.length">
          <div class="section-title">本地美食</div>
          <van-tag v-for="food in tripData.localFoods" :key="food" type="success" class="tag-item">{{ food }}</van-tag>
        </div>

        <div class="card" v-if="tripData.packingList?.length">
          <div class="section-title">出行清单</div>
          <van-tag v-for="item in tripData.packingList" :key="item" plain type="primary" class="tag-item">{{ item }}</van-tag>
        </div>

        <div class="card tips-card" v-if="tripData.tips?.length">
          <div class="section-title">温馨提示</div>
          <ul class="tips-list">
            <li v-for="tip in tripData.tips" :key="tip">{{ tip }}</li>
          </ul>
        </div>

        <div class="card warnings-card" v-if="tripData.warnings?.length">
          <div class="section-title">注意事项</div>
          <ul class="warnings-list">
            <li v-for="warning in tripData.warnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>
      </template>
    </div>

    <div class="detail-footer" v-if="tripData && tripData.success !== false">
      <van-button type="primary" round @click="goToChat" class="footer-button">咨询 AI 助手</van-button>
      <van-button round @click="goHistory" class="footer-button secondary-button">历史行程</van-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { post } from '@/utils/request'
import { getTripRecord, saveTripPlan } from '@/utils/storage'
import { getCompanionLabel, getTravelStyleLabel } from '@/constants/travel'
import SpotItem from '../components/SpotItem.vue'
import BudgetTable from '../components/BudgetTable.vue'

const router = useRouter()
const route = useRoute()

const isLoading = ref(false)
const formData = reactive({
  city: '',
  budget: '',
  days: '',
  style: 'classic',
  companion: 'friends'
})
const tripData = ref(null)
const errorMsg = ref('')
const activeDays = ref([])

const onBack = () => router.back()

const normalizeQuery = () => ({
  city: String(route.query.city || '').trim(),
  budget: Number(route.query.budget),
  days: Number(route.query.days),
  style: route.query.style || 'classic',
  companion: route.query.companion || 'friends'
})

const validateQuery = (query) => {
  if (!query.city) return '缺少目的城市'
  if (!Number.isFinite(query.budget) || query.budget < 100) return '预算不能低于100元'
  if (!Number.isFinite(query.days) || query.days < 1 || query.days > 30) return '行程天数必须在1-30天之间'
  return ''
}

const applyFormData = (query) => {
  Object.assign(formData, query)
}

const fetchTripData = async () => {
  const query = normalizeQuery()
  const validationError = validateQuery(query)
  applyFormData(query)

  if (validationError) {
    errorMsg.value = validationError
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMsg.value = ''

  try {
    const res = await post('recommend', query)
    tripData.value = res
    activeDays.value = res.dailyItinerary?.map((day) => day.day) || []
    saveTripPlan({ query, plan: res })
  } catch (error) {
    errorMsg.value = error?.message || '网络请求失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const loadRecord = (recordId) => {
  const record = getTripRecord(recordId)
  if (!record) {
    errorMsg.value = '未找到历史行程'
    return
  }

  applyFormData(record.query || record)
  tripData.value = record.plan
  activeDays.value = record.plan?.dailyItinerary?.map((day) => day.day) || []
}

const goToChat = () => {
  router.push({
    path: '/chat',
    query: {
      scene: 'detail',
      city: formData.city,
      style: formData.style
    }
  })
}

const goHistory = () => router.push('/history')

onMounted(() => {
  if (route.query.recordId) {
    loadRecord(route.query.recordId)
    return
  }

  fetchTripData()
})
</script>

<style scoped>
.detail-page {
  padding-bottom: 86px;
}

.page-header {
  height: 46px;
}

.overview-card {
  margin-bottom: 16px;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.trip-header h2 {
  font-size: 20px;
  color: #323233;
  margin: 0;
}

.trip-subtitle {
  margin-top: 6px;
  color: #646566;
  font-size: 13px;
}

.trip-budget {
  font-size: 18px;
  color: #ee0a24;
  font-weight: 600;
}

.trip-collapse {
  margin-bottom: 16px;
}

.day-schedule {
  padding: 8px 0;
}

.schedule-section {
  margin-bottom: 16px;
}

.schedule-section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  color: #fff;
  font-size: 12px;
  margin-bottom: 8px;
}

.morning {
  background: #ff976a;
}

.afternoon {
  background: #1989fa;
}

.evening {
  background: #7232dd;
}

.tag-item {
  margin: 0 8px 8px 0;
}

.tips-list,
.warnings-list {
  margin: 0;
  padding-left: 20px;
}

.tips-list li,
.warnings-list li {
  padding: 8px 0;
  color: #666;
  font-size: 14px;
  border-bottom: 1px solid #f5f5f5;
}

.tips-list li:last-child,
.warnings-list li:last-child {
  border-bottom: none;
}

.detail-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.footer-button {
  flex: 1;
}
</style>
