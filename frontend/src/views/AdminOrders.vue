<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../api/supabase.js'

const router = useRouter()
const orders = ref([])
const loading = ref(true)
const statusFilter = ref('')

const statusMap = {
  pending: { label: '⏳ 待处理', color: '#f7c948' },
  confirmed: { label: '👩‍🍳 制作中', color: '#6bb5ff' },
  completed: { label: '✅ 已完成', color: '#6bcf7f' },
  cancelled: { label: '❌ 已取消', color: '#b5a0b0' }
}

onMounted(async () => {
  await loadOrders()
})

async function loadOrders() {
  loading.value = true
  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (statusFilter.value) {
      query = query.eq('status', statusFilter.value)
    }

    const { data, error } = await query
    if (error) throw error
    orders.value = data || []
  } catch (e) {
    console.error('加载订单失败:', e)
  } finally {
    loading.value = false
  }
}

async function updateStatus(orderId, status) {
  try {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    await loadOrders()
  } catch (e) {
    alert('更新失败')
  }
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth()+1}月${d.getDate()}日 ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}
</script>

<template>
  <div class="orders-page">
    <header class="orders-header">
      <button class="back-btn" @click="router.push('/admin/dashboard')">← 返回</button>
      <h1>📋 订单管理</h1>
    </header>

    <div class="filter-bar">
      <button
        :class="['filter-btn', { active: statusFilter === '' }]"
        @click="statusFilter = ''; loadOrders()"
      >📋 全部</button>
      <button
        v-for="(v, k) in statusMap" :key="k"
        :class="['filter-btn', { active: statusFilter === k }]"
        @click="statusFilter = k; loadOrders()"
      >{{ v.label }}</button>
    </div>

    <div class="orders-list" v-if="!loading">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span class="order-id">#{{ order.id }}</span>
          <span :style="{ color: statusMap[order.status]?.color }" class="order-status">
            {{ statusMap[order.status]?.label }}
          </span>
          <span class="order-time">{{ formatTime(order.created_at) }}</span>
        </div>
        <div class="order-items">
          <div v-for="item in order.order_items" :key="item.id" class="order-item">
            <span>{{ item.dish_name }} × {{ item.quantity }}</span>
            <span>¥{{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>
        <div class="order-footer">
          <div class="order-total">
            <span v-if="order.table_number">📍 桌号: {{ order.table_number }}</span>
            <span class="total-price">合计: ¥{{ order.total_price.toFixed(2) }}</span>
          </div>
          <p v-if="order.note" class="order-note">📝 备注: {{ order.note }}</p>
          <div class="order-actions" v-if="order.status !== 'completed' && order.status !== 'cancelled'">
            <button
              v-if="order.status === 'pending'"
              class="btn btn-sm action-btn confirm-btn"
              @click="updateStatus(order.id, 'confirmed')"
            >👩‍🍳 确认</button>
            <button
              v-if="order.status === 'confirmed'"
              class="btn btn-sm action-btn done-btn"
              @click="updateStatus(order.id, 'completed')"
            >✅ 完成</button>
            <button
              class="btn btn-sm action-btn"
              style="background:var(--bg);color:var(--text-secondary)"
              @click="updateStatus(order.id, 'cancelled')"
            >❌ 取消</button>
          </div>
        </div>
      </div>
      <div v-if="orders.length === 0" class="empty">📭 暂无订单</div>
    </div>
    <div v-else class="loading">🐶 加载中...</div>
  </div>
</template>

<style scoped>
.orders-page { min-height: 100dvh; background: var(--bg); }
.orders-header {
  background: linear-gradient(135deg, #ff8fab 0%, #ff6b8a 100%);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.orders-header h1 { font-size: 18px; font-weight: 700; }
.back-btn {
  background: rgba(255,255,255,0.25);
  color: white;
  font-size: 14px;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.filter-bar {
  display: flex;
  gap: 6px;
  padding: 14px 16px;
  background: white;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
}
.filter-btn {
  flex-shrink: 0;
  padding: 6px 16px;
  border-radius: 16px;
  background: var(--bg);
  font-size: 13px;
  color: var(--text);
  border: none;
  font-weight: 500;
}
.filter-btn.active {
  background: var(--primary);
  color: white;
}

.orders-list { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
.order-card {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}
.order-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
}
.order-id { font-weight: 700; }
.order-status { font-weight: 600; font-size: 13px; }
.order-time { margin-left: auto; color: var(--text-secondary); font-size: 12px; }

.order-items {
  border-top: 2px solid var(--border);
  padding-top: 10px;
}
.order-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 5px 0;
}
.order-footer { margin-top: 12px; }
.order-total {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.total-price { font-weight: 700; color: var(--primary-dark); font-size: 16px; }
.order-note {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 6px;
  padding: 8px 10px;
  background: var(--bg);
  border-radius: 8px;
}
.order-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}
.action-btn {
  padding: 8px 16px !important;
  border-radius: 10px !important;
  font-weight: 600;
}
.confirm-btn { background: #6bb5ff !important; color: white !important; }
.done-btn { background: #6bcf7f !important; color: white !important; }
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  font-size: 15px;
}
</style>
