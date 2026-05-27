<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar title="智能旅游助手" />
    </div>

    <div class="page-content">
      <van-notice-bar
        left-icon="info-o"
        text="基于 AI 的城市行程规划、预算拆分、旅游问答与本地历史管理"
        style="margin-bottom: 16px"
      />

      <div class="card search-card">
        <div class="section-title">规划你的行程</div>
        <van-field
          v-model="formData.city"
          readonly
          label="目的地"
          placeholder="请选择城市"
          is-link
          class="form-field"
          @click="showCityPicker = true"
        />
        <van-field
          v-model="formData.budget"
          type="number"
          label="预算（元）"
          placeholder="请输入预算金额"
          :border="false"
          class="form-field"
        />
        <van-field
          v-model="formData.days"
          type="digit"
          label="行程天数"
          placeholder="请输入行程天数"
          :border="false"
          class="form-field"
        />
        <van-field
          :model-value="styleLabel"
          readonly
          label="旅行偏好"
          placeholder="请选择旅行偏好"
          is-link
          class="form-field"
          @click="showStylePicker = true"
        />
        <van-field
          :model-value="companionLabel"
          readonly
          label="出行人群"
          placeholder="请选择出行人群"
          is-link
          class="form-field"
          @click="showCompanionPicker = true"
        />
        <van-button type="primary" size="large" round block @click="handleSearch">
          开始规划
        </van-button>
      </div>

      <div class="card quick-actions">
        <div class="section-title">快捷入口</div>
        <van-grid :columns="3" :gutter="12">
          <van-grid-item @click="goPage('/chat')" icon="chat-o" text="AI会话" />
          <van-grid-item @click="goPage('/history')" icon="notes-o" text="历史行程" />
          <van-grid-item @click="goPage('/profile')" icon="user-o" text="我的" />
        </van-grid>
      </div>

      <div class="card popular-destinations">
        <div class="section-title">热门目的地</div>
        <van-grid :columns="4" :gutter="8">
          <van-grid-item v-for="city in popularCities" :key="city" @click="selectCity(city)">
            <div class="city-tag" :class="{ active: formData.city === city }">{{ city }}</div>
          </van-grid-item>
        </van-grid>
      </div>

      <div class="card" v-if="recentHistory.length">
        <div class="section-title">最近规划</div>
        <van-cell
          v-for="item in recentHistory"
          :key="item.id"
          :title="`${item.city} · ${item.days}天`"
          :label="`${formatDate(item.createdAt)}｜预算 ¥${item.budget}`"
          is-link
          @click="openHistory(item.id)"
        />
      </div>
    </div>

    <van-popup round v-model:show="showCityPicker" position="bottom">
      <van-picker
        title="选择目的地"
        :columns="cityColumns"
        @confirm="handleCityConfirm"
        @cancel="showCityPicker = false"
      />
    </van-popup>

    <van-popup round v-model:show="showStylePicker" position="bottom">
      <van-picker
        title="选择旅行偏好"
        :columns="styleColumns"
        @confirm="handleStyleConfirm"
        @cancel="showStylePicker = false"
      />
    </van-popup>

    <van-popup round v-model:show="showCompanionPicker" position="bottom">
      <van-picker
        title="选择出行人群"
        :columns="companionColumns"
        @confirm="handleCompanionConfirm"
        @cancel="showCompanionPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { allCities, companionTypes, getCompanionLabel, getTravelStyleLabel, popularCities, travelStyles } from '@/constants/travel'
import { getTripHistory } from '@/utils/storage'

const router = useRouter()
const formData = reactive({
  city: '',
  budget: null,
  days: null,
  style: 'classic',
  companion: 'friends'
})

const showCityPicker = ref(false)
const showStylePicker = ref(false)
const showCompanionPicker = ref(false)
const recentHistory = ref([])

const cityColumns = allCities.map((city) => ({ text: city, value: city }))
const styleColumns = travelStyles.map((item) => ({ text: item.label, value: item.value }))
const companionColumns = companionTypes.map((item) => ({ text: item.label, value: item.value }))

const styleLabel = computed(() => getTravelStyleLabel(formData.style))
const companionLabel = computed(() => getCompanionLabel(formData.companion))

const getSelectedValue = (selectedOptions, fallback) => selectedOptions?.[0]?.value || fallback

const handleCityConfirm = ({ selectedOptions }) => {
  formData.city = getSelectedValue(selectedOptions, '')
  showCityPicker.value = false
}

const handleStyleConfirm = ({ selectedOptions }) => {
  formData.style = getSelectedValue(selectedOptions, 'classic')
  showStylePicker.value = false
}

const handleCompanionConfirm = ({ selectedOptions }) => {
  formData.companion = getSelectedValue(selectedOptions, 'friends')
  showCompanionPicker.value = false
}

const validateForm = () => {
  if (!formData.city) {
    showToast('请选择目的城市')
    return false
  }

  if (!formData.budget || Number(formData.budget) < 100) {
    showToast('预算不能低于100元')
    return false
  }

  if (!formData.days || Number(formData.days) < 1 || Number(formData.days) > 30) {
    showToast('行程天数必须在1-30天之间')
    return false
  }

  return true
}

const handleSearch = () => {
  if (!validateForm()) return

  router.push({
    path: '/detail',
    query: {
      city: formData.city,
      budget: formData.budget,
      days: formData.days,
      style: formData.style,
      companion: formData.companion
    }
  })
}

const goPage = (path) => router.push(path)

const selectCity = (city) => {
  formData.city = city
}

const openHistory = (id) => {
  router.push({ path: '/history', query: { id } })
}

const formatDate = (value) => new Date(value).toLocaleDateString('zh-CN')

onMounted(() => {
  recentHistory.value = getTripHistory().slice(0, 3)
})
</script>

<style scoped>
.search-card {
  margin-bottom: 16px;
}

.form-field {
  background-color: #f7f8fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.city-tag {
  padding: 8px 12px;
  border-radius: 16px;
  background-color: #f7f8fa;
  transition: all 0.3s;
  color: #666;
  font-size: 14px;
}

.active {
  background-color: #1989fa;
  color: #fff;
}
</style>
