<template>
  <div class="container">
    <router-view />
  </div>
  <van-tabbar v-if="showTabbar" router v-model="active">
    <van-tabbar-item name="/" to="/" icon="home-o">首页</van-tabbar-item>
    <van-tabbar-item name="/chat" to="/chat" icon="chat-o">对话</van-tabbar-item>
    <van-tabbar-item name="/history" to="/history" icon="notes-o">行程</van-tabbar-item>
    <van-tabbar-item name="/profile" to="/profile" icon="user-o">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tabbarRoutes = ['Home', 'Chat', 'History', 'Profile']

const showTabbar = computed(() => tabbarRoutes.includes(route.name))
const active = computed(() => route.path)
</script>
