<template>
  <el-config-provider>
    <Login v-if="!session" @login-success="handleLogin" />
    <Dashboard v-else :session="session" @logout="handleLogout" />
  </el-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Login from './components/Login.vue'
import Dashboard from './components/Dashboard.vue'

const session = ref(null)

const handleLogin = (userSession) => {
  session.value = userSession
  localStorage.setItem('carshare.session', JSON.stringify(userSession))
}

const handleLogout = () => {
  session.value = null
  localStorage.removeItem('carshare.session')
}

onMounted(() => {
  const saved = localStorage.getItem('carshare.session')
  if (saved) {
    try {
      session.value = JSON.parse(saved)
    } catch (e) {
      localStorage.removeItem('carshare.session')
    }
  }
})
</script>
