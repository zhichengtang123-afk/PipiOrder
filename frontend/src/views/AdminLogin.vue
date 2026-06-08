<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../api/supabase.js'

const router = useRouter()
const password = ref('')
const error = ref('')
const loading = ref(false)

async function login() {
  if (!password.value) return
  loading.value = true
  error.value = ''

  try {
    const { data, error: err } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_password')
      .single()

    if (err) throw err

    if (data.value === password.value) {
      sessionStorage.setItem('admin_logged_in', 'true')
      router.push('/admin/dashboard')
    } else {
      error.value = '密码错误'
    }
  } catch (e) {
    error.value = '验证失败，请检查网络连接'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-icon">🐶</div>
      <h1 class="login-title">管理员登录</h1>
      <p class="login-subtitle">🐾 皮皮点菜 · 后台管理</p>
      <form @submit.prevent="login">
        <input
          v-model="password"
          type="password"
          placeholder="请输入管理员密码"
          class="login-input"
          autofocus
        />
        <p class="error-msg" v-if="error">{{ error }}</p>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '🐶 验证中...' : '🔐 登录' }}
        </button>
      </form>
      <router-link to="/" class="back-link">← 返回点菜</router-link>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, var(--primary-bg), #fff0f5);
}
.login-card {
  background: white;
  padding: 36px 28px;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(255, 143, 171, 0.15);
  width: 100%;
  max-width: 340px;
  text-align: center;
}
.login-icon {
  font-size: 48px;
  margin-bottom: 8px;
}
.login-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: var(--text); }
.login-subtitle { font-size: 13px; color: var(--text-secondary); margin-bottom: 28px; }
.login-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border);
  border-radius: 14px;
  font-size: 16px;
  margin-bottom: 12px;
  background: var(--bg);
  transition: all 0.2s;
}
.login-input:focus {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 4px rgba(255, 143, 171, 0.1);
}
.login-btn {
  width: 100%;
  padding: 13px;
  font-size: 16px;
  border-radius: 14px;
}
.error-msg {
  color: var(--primary-dark);
  font-size: 13px;
  margin-bottom: 10px;
}
.back-link {
  display: inline-block;
  margin-top: 18px;
  color: var(--text-secondary);
  font-size: 13px;
  text-decoration: none;
}
.back-link:active { color: var(--primary); }
</style>
