<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.ts'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance } from 'element-plus'
import useTrigger from '@/composables/useTrigger'

defineOptions({ name: 'LoginPage' })

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: ['change'] }],
  password: [{ required: true, message: '请输入密码', trigger: ['change'] }],
})

const handleLogin = useTrigger.throttle(() => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      loading.value = true
      await userStore.login(form)
      if (userStore.token) {
        ElMessage.success('登录成功')
        await userStore.getUserInfo()
        router.push({ name: 'home' })
      } else {
        ElMessage.error('登录失败')
      }
    } finally {
      loading.value = false
    }
  })
}, 500)
</script>

<template>
  <main class="login-page">
    <section class="intro">
      <p class="intro-eyebrow">制造企业一体化管理平台</p>
      <h1>生产有序<br />经营有数</h1>
      <p class="intro-description">围绕物料、库存、生产与交付，连接制造企业每一个关键环节。</p>
      <p class="intro-tags">计划 · 执行 · 协同 · 追溯</p>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <header class="brand">
          <img src="/origin-manufacturing-logo.svg" alt="原点智造 ERP" />
          <div class="brand-copy">
            <strong>原点智造 ERP</strong>
            <span>制造企业管理系统</span>
          </div>
        </header>

        <div class="login-title">
          <h1>欢迎登录</h1>
          <p>请输入账号和密码进入系统</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="用户名" autocomplete="username">
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码" show-password
              autocomplete="current-password" @keyup.enter="handleLogin">
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-button class="submit-button" type="primary" native-type="submit" :loading="loading">
            登录
          </el-button>
        </el-form>

        <p class="login-help">账号问题请联系系统管理员</p>
      </div>
    </section>

    <footer>© 2026 原点智造 ERP</footer>
  </main>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: #1f2937;
  background: #eef1f3 url('/manufacturing-login-bg.png') center / cover no-repeat;
}

.login-page::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgb(7 14 20 / 56%) 0%, rgb(7 14 20 / 42%) 52%, rgb(7 14 20 / 30%) 100%),
    rgb(7 14 20 / 12%);
  pointer-events: none;
}

.intro {
  position: absolute;
  z-index: 1;
  left: clamp(48px, 7vw, 120px);
  top: 50%;
  width: min(480px, 40vw);
  color: #ffffff;
  transform: translateY(-50%);
}

.intro-eyebrow {
  margin: 0 0 18px;
  color: #efb64c;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
}

.intro h1 {
  margin: 0;
  font-size: clamp(44px, 4.4vw, 64px);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 1px;
}

.intro-description {
  max-width: 430px;
  margin: 24px 0 0;
  color: rgb(255 255 255 / 78%);
  font-size: 15px;
  line-height: 1.9;
}

.intro-tags {
  margin: 28px 0 0;
  color: rgb(255 255 255 / 64%);
  font-size: 12px;
  letter-spacing: 2px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 34px;
  padding-bottom: 22px;
  border-bottom: 1px solid #e5e9ee;
}

.brand img {
  width: 38px;
  height: 38px;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-copy strong {
  color: #183047;
  font-size: 18px;
  letter-spacing: .3px;
}

.brand-copy span {
  color: #64717d;
  font-size: 11px;
  letter-spacing: 1px;
}

.login-panel {
  position: relative;
  z-index: 1;
  width: 420px;
  margin-right: clamp(48px, 8vw, 140px);
}

.login-card {
  padding: 42px 40px 36px;
  background: rgb(255 255 255 / 96%);
  border: 1px solid rgb(203 210 218 / 85%);
  border-radius: 8px;
  box-shadow: 0 16px 42px rgb(36 45 52 / 16%);
}

.login-title {
  margin-bottom: 30px;
}

.login-title h1 {
  margin: 0 0 9px;
  color: #1f2937;
  font-size: 25px;
  font-weight: 600;
}

.login-title p {
  margin: 0;
  color: #7a8794;
  font-size: 13px;
}

.login-card :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-card :deep(.el-input__wrapper) {
  min-height: 44px;
  background: #ffffff;
  box-shadow: 0 0 0 1px #d8dee5 inset;
}

.login-card :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #335f7c inset;
}

.submit-button {
  width: 100%;
  height: 44px;
  margin-top: 4px;
  border-color: #294f68;
  border-radius: 4px;
  background: #294f68;
  font-size: 14px;
}

.submit-button:hover,
.submit-button:focus {
  border-color: #203f54;
  background: #203f54;
}

.login-help {
  margin: 26px 0 0;
  color: #929ca6;
  font-size: 12px;
  text-align: center;
}

footer {
  position: absolute;
  z-index: 1;
  left: 46px;
  bottom: 28px;
  color: rgb(52 65 75 / 64%);
  font-size: 11px;
}

@media (max-width: 900px) {
  .login-page {
    justify-content: center;
    padding: 100px 24px 40px;
    background-position: 42% center;
  }

  .login-page::after {
    background: rgb(7 14 20 / 48%);
  }

  .intro {
    display: none;
  }

  .brand {
    margin-bottom: 28px;
  }

  .login-panel {
    width: min(420px, 100%);
    margin-right: 0;
  }

  footer {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 34px 24px 30px;
  }
}
</style>
