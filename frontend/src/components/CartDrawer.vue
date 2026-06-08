<script setup>
import { inject, ref } from 'vue'
import { supabase } from '../api/supabase.js'

const props = defineProps({
  visible: Boolean
})
const emit = defineEmits(['close'])

const cart = inject('cart')
const submitting = ref(false)
const submitted = ref(false)
const tableNumber = ref('')

async function submitOrder() {
  if (cart.items.value.length === 0) return
  submitting.value = true
  try {
    const total = cart.items.value.reduce((s, i) => s + i.price * i.quantity, 0)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        table_number: tableNumber.value || null,
        note: cart.note.value || null,
        total_price: total,
        status: 'pending'
      })
      .select()
      .single()

    if (orderErr) throw orderErr

    const items = cart.items.value.map(i => ({
      order_id: order.id,
      dish_id: i.dish_id,
      dish_name: i.name,
      quantity: i.quantity,
      price: i.price
    }))

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(items)

    if (itemsErr) throw itemsErr

    submitted.value = true
    cart.clearCart()
  } catch (e) {
    alert('提交失败，请重试')
    console.error(e)
  } finally {
    submitting.value = false
  }
}

function close() {
  if (!submitting.value) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="overlay" @click.self="close"></div>
    </Transition>
    <Transition name="slide">
      <div v-if="visible" class="drawer">
        <div class="drawer-header">
          <h2>🛒 购物车</h2>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <div v-if="submitted" class="submitted">
          <div class="success-icon">🎉</div>
          <h3>下单成功啦！</h3>
          <p>🐶 后厨正在努力制作中~</p>
          <button class="btn btn-primary" @click="submitted = false; emit('close')">继续点菜 📋</button>
        </div>

        <template v-else>
          <div class="cart-items" v-if="cart.items.value.length > 0">
            <div v-for="item in cart.items.value" :key="item.dish_id" class="cart-item">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-price">¥{{ item.price }}</span>
              </div>
              <div class="item-qty">
                <button class="qty-btn minus" @click="cart.removeDish(item.dish_id)">−</button>
                <span class="qty-num">{{ item.quantity }}</span>
                <button class="qty-btn plus" @click="cart.addDish({ id: item.dish_id, name: item.name, price: item.price })">+</button>
              </div>
            </div>

            <div class="note-section">
              <div class="note-label">📝 备注信息</div>
              <input v-model="tableNumber" placeholder="桌号 / 人数（选填）" class="note-input" />
              <textarea v-model="cart.note.value" placeholder="口味要求 / 特殊备注（选填）" class="note-input note-textarea"></textarea>
            </div>
          </div>

          <div v-else class="empty-cart">
            <p>🛒 购物车是空的~</p>
            <p class="empty-hint">快去挑选美食吧！</p>
          </div>

          <div class="drawer-footer" v-if="cart.items.value.length > 0">
            <div class="total-line">
              <span>合计</span>
              <span class="total-price">¥{{ cart.cartTotal.value.toFixed(2) }}</span>
            </div>
            <button class="btn btn-primary submit-btn" @click="submitOrder" :disabled="submitting">
              {{ submitting ? '🐶 提交中...' : '✅ 提交订单' }}
            </button>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(90, 74, 90, 0.4);
  z-index: 200;
}
.drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  max-height: 80dvh;
  background: white;
  border-radius: 20px 20px 0 0;
  z-index: 201;
  display: flex;
  flex-direction: column;
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}
.drawer-header h2 { font-size: 18px; }
.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  padding: 4px;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:active {
  background: var(--bg);
}

.cart-items {
  padding: 8px 20px;
  overflow-y: auto;
  flex: 1;
}
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.item-name { font-size: 15px; font-weight: 600; }
.item-price { font-size: 13px; color: var(--primary-dark); font-weight: 600; }
.item-qty {
  display: flex;
  align-items: center;
  gap: 10px;
}
.qty-btn {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: none;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.15s;
}
.qty-btn.minus {
  background: var(--bg);
  color: var(--text);
}
.qty-btn.plus {
  background: var(--primary-light);
  color: var(--primary-dark);
}
.qty-btn:active { transform: scale(0.85); }
.qty-num {
  font-size: 16px;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

.note-section {
  margin-top: 14px;
  margin-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.note-label {
  font-size: 14px;
  font-weight: 600;
}
.note-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 14px;
  background: var(--bg);
  transition: border-color 0.2s;
}
.note-input:focus {
  border-color: var(--primary);
  background: white;
}
.note-textarea {
  resize: none;
  height: 60px;
}

.empty-cart, .submitted {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
}
.empty-cart { font-size: 15px; }
.empty-hint { font-size: 13px; margin-top: 4px; color: var(--text-secondary); }
.submitted h3 {
  margin: 12px 0 4px;
  font-size: 20px;
  color: var(--text);
}
.submitted .btn {
  margin-top: 20px;
}
.success-icon {
  font-size: 48px;
  display: block;
}

.drawer-footer {
  padding: 16px 20px 20px;
  border-top: 1px solid var(--border);
  background: white;
  border-radius: 0 0 20px 20px;
}
.total-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 15px;
}
.total-price { font-size: 22px; font-weight: 700; color: var(--primary-dark); }
.submit-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  border-radius: 14px;
}

/* Slide transition */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-enter-from, .slide-leave-to {
  transform: translateY(100%);
}
</style>
