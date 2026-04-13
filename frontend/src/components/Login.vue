<template>
  <div class="auth-shell">
    <div class="bg-glow glow-left"></div>
    <div class="bg-glow glow-right"></div>
    <div class="auth-card">
      <section class="brand-panel">
        <div class="brand-chip">联盟链出行平台</div>
        <h1>让共享汽车流程更可信</h1>
        <p>支持用户、管理员、调度员协同操作，业务过程可追踪、可存证、可回溯。</p>
        <div class="brand-stats">
          <div class="stat-item">
            <span>角色协同</span>
            <strong>3 类</strong>
          </div>
          <div class="stat-item">
            <span>业务链路</span>
            <strong>全流程</strong>
          </div>
          <div class="stat-item">
            <span>数据记录</span>
            <strong>链上存证</strong>
          </div>
        </div>
      </section>
      <el-card class="login-card">
        <div class="header">
          <h2>{{ authMode === 'login' ? '欢迎登录' : '创建账号' }}</h2>
          <p>{{ authMode === 'login' ? '登录后进入智能工作台' : '注册后即可切换角色进行演示' }}</p>
        </div>

        <el-segmented
          v-model="authMode"
          class="mode-switch"
          :options="[
            { label: '登录', value: 'login' },
            { label: '注册', value: 'register' }
          ]"
        />

        <div class="role-selector">
          <span class="role-label">角色选择</span>
          <el-radio-group v-model="authRole" class="role-group">
            <el-radio-button v-if="authMode === 'login'" value="renter">用户</el-radio-button>
            <el-radio-button v-if="authMode === 'login'" value="admin">管理员</el-radio-button>
            <el-radio-button v-if="authMode === 'login'" value="dispatcher">调度员</el-radio-button>
            <el-radio-button v-if="authMode === 'register'" value="renter">用户</el-radio-button>
          </el-radio-group>
          <p v-if="authMode === 'register'" class="role-hint">
            管理员和调度员账号请联系系统管理员获取
          </p>
        </div>

        <el-form :model="form" class="login-form">
          <el-form-item v-if="authMode === 'register'">
            <el-input v-model="form.displayName" placeholder="显示名称" size="large" :prefix-icon="Avatar" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="form.username" placeholder="账号" size="large" :prefix-icon="User" />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleSubmit"
            />
          </el-form-item>

          <el-button type="primary" class="submit-btn" :loading="loading" @click="handleSubmit">
            {{ authMode === 'login' ? '进入系统' : '立即注册' }}
          </el-button>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Avatar } from '@element-plus/icons-vue'
import api from '../api'

const emit = defineEmits(['login-success'])

const authMode = ref('login')
const authRole = ref('renter')
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  displayName: ''
})

const handleSubmit = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写账号和密码')
    return
  }
  
  loading.value = true
  try {
    if (authMode.value === 'register') {
      await api.post('/accounts/register', {
        role: authRole.value,
        username: form.username,
        password: form.password,
        displayName: form.displayName || form.username
      })
      ElMessage.success('注册成功，请登录')
      authMode.value = 'login'
    } else {
      const session = await api.post('/accounts/login', {
        role: authRole.value,
        username: form.username,
        password: form.password
      })
      ElMessage.success(`欢迎回来，${session.displayName}`)
      emit('login-success', session)
    }
  } catch (error) {
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-shell {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background-image: linear-gradient(120deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.38)), url('/car-bg.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.auth-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.26), rgba(239, 246, 255, 0.2));
  z-index: 0;
}

.bg-glow {
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 999px;
  filter: blur(70px);
  opacity: 0.6;
  z-index: 0;
}

.glow-left {
  left: -120px;
  top: -120px;
  background: radial-gradient(circle, #8bb8ff, transparent 70%);
}

.glow-right {
  right: -120px;
  bottom: -140px;
  background: radial-gradient(circle, #9dd9ff, transparent 70%);
}

.auth-card {
  position: relative;
  z-index: 1;
  width: min(1040px, 100%);
  min-height: 620px;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 24px 60px rgba(37, 99, 235, 0.14);
  backdrop-filter: blur(12px);
}

.brand-panel {
  position: relative;
  isolation: isolate;
  padding: 52px 44px;
  background-image: linear-gradient(145deg, rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.52) 50%, rgba(0, 0, 0, 0.62)), url('/car-bg.png');
  background-size: cover;
  background-position: center;
  color: #eff6ff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
}

.brand-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3));
}

.brand-chip {
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-size: 13px;
  font-weight: 600;
}

.brand-panel h1 {
  margin: 0;
  font-size: 38px;
  line-height: 1.2;
  color: #f8fafc;
}

.brand-panel p {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: #dbeafe;
}

.brand-stats {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  padding: 12px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: grid;
  gap: 4px;
}

.stat-item span {
  font-size: 12px;
  color: #dbeafe;
}

.stat-item strong {
  font-size: 16px;
  color: #fff;
}

.login-card {
  height: 100%;
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  padding: 42px 40px 30px;
}

.header {
  margin-bottom: 14px;
}

.header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
  font-weight: 700;
}

.header p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.mode-switch {
  width: 100%;
  margin-top: 14px;
}

.role-selector {
  margin-top: 18px;
  margin-bottom: 16px;
}

.role-label {
  display: block;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
  font-weight: 600;
}

.role-group {
  display: flex;
}

.role-group :deep(.el-radio-button) {
  flex: 1;
}

.role-group :deep(.el-radio-button__inner) {
  width: 100%;
}

.role-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
  border-radius: 12px;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(130deg, #2563eb, #1d4ed8);
  border: none;
}

.submit-btn:hover {
  transform: translateY(-1px);
}

@media (max-width: 960px) {
  .auth-card {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .brand-panel {
    padding: 28px 24px;
  }

  .brand-panel h1 {
    font-size: 30px;
  }

  .login-card {
    padding: 28px 22px 24px;
  }
}
</style>
