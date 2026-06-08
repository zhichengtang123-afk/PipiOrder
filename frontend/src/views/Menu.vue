<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { supabase } from '../api/supabase.js'
import DishCard from '../components/DishCard.vue'
import CartDrawer from '../components/CartDrawer.vue'

const categories = ref([])
const dishes = ref([])
const activeCategory = ref(null)
const showCart = ref(false)
const loading = ref(true)

// Cart state
const cartItems = ref([])
const cartNote = ref('')

const cartCount = computed(() => cartItems.value.reduce((s, i) => s + i.quantity, 0))
const cartTotal = computed(() => cartItems.value.reduce((s, i) => s + i.price * i.quantity, 0))

function addDish(dish) {
  const existing = cartItems.value.find(i => i.dish_id === dish.id)
  if (existing) {
    existing.quantity++
  } else {
    cartItems.value.push({ dish_id: dish.id, name: dish.name, price: dish.price, quantity: 1 })
  }
}

function removeDish(dishId) {
  const idx = cartItems.value.findIndex(i => i.dish_id === dishId)
  if (idx !== -1) {
    if (cartItems.value[idx].quantity > 1) {
      cartItems.value[idx].quantity--
    } else {
      cartItems.value.splice(idx, 1)
    }
  }
}

function clearCart() {
  cartItems.value = []
  cartNote.value = ''
}

provide('cart', { items: cartItems, note: cartNote, addDish, removeDish, clearCart, cartCount, cartTotal })

onMounted(async () => {
  try {
    const [catRes, dishRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('dishes').select('*').order('id')
    ])
    categories.value = catRes.data || []
    dishes.value = dishRes.data || []
    if (categories.value.length > 0) {
      activeCategory.value = categories.value[0].id
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
})

const filteredDishes = computed(() => {
  let result = dishes.value.filter(d => d.is_available !== false)
  if (activeCategory.value) {
    result = result.filter(d => d.category_id === activeCategory.value)
  }
  return result
})
</script>

<template>
  <div class="menu-page">
    <header class="header">
      <div class="header-content">
        <div class="header-icon"><img src="/logo.jpg" alt="皮皮" class="header-img" /></div>
        <div>
          <h1 class="title">皮皮点菜</h1>
          <p class="subtitle">✨ 今天想吃什么呢？</p>
        </div>
      </div>
      <router-link to="/admin" class="admin-link">⚙️</router-link>
    </header>

    <div class="category-bar">
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="['cat-tab', { active: activeCategory === cat.id }]"
        @click="activeCategory = cat.id"
      >
        {{ cat.name }}
      </button>
    </div>

    <div class="dish-list" v-if="!loading">
      <DishCard
        v-for="dish in filteredDishes"
        :key="dish.id"
        :dish="dish"
        @add="addDish"
      />
      <div v-if="filteredDishes.length === 0" class="empty">😢 该分类暂无菜品哦~</div>
    </div>
    <div v-else class="loading">🐶 加载中...</div>

    <button class="cart-fab" @click="showCart = true" v-if="cartCount > 0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <span class="cart-badge">{{ cartCount }}</span>
    </button>

    <CartDrawer :visible="showCart" @close="showCart = false" />
  </div>
</template>

<style scoped>
.menu-page { padding-bottom: 80px; min-height: 100dvh; }

.header {
  background: linear-gradient(135deg, #ff8fab 0%, #ff6b8a 100%);
  color: white;
  padding: 24px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.header::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: -20px;
  right: -20px;
  height: 40px;
  background: var(--bg);
  border-radius: 50%;
}
.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-icon {
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.25);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  backdrop-filter: blur(4px);
  overflow: hidden;
}
.header-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
}
.title { font-size: 24px; font-weight: 700; letter-spacing: 1px; }
.subtitle { font-size: 13px; opacity: 0.9; margin-top: 2px; }
.admin-link {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  text-decoration: none;
  backdrop-filter: blur(4px);
}

.category-bar {
  display: flex;
  gap: 8px;
  padding: 16px 16px 12px;
  overflow-x: auto;
  background: transparent;
  -webkit-overflow-scrolling: touch;
}
.cat-tab {
  flex-shrink: 0;
  padding: 8px 20px;
  border-radius: 20px;
  background: white;
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.25s;
  box-shadow: 0 2px 8px rgba(255, 143, 171, 0.1);
  border: 2px solid transparent;
}
.cat-tab.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary-dark);
  box-shadow: 0 4px 12px rgba(255, 143, 171, 0.3);
}

.dish-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 4px 16px 16px;
}
.empty, .loading {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 15px;
}

.cart-fab {
  position: fixed;
  bottom: 24px;
  right: 20px;
  width: 58px;
  height: 58px;
  border-radius: 29px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(255, 143, 171, 0.45);
  z-index: 100;
  border: none;
  transition: transform 0.2s;
}
.cart-fab:active { transform: scale(0.9); }
.cart-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #5a4a5a;
  color: white;
  font-size: 11px;
  min-width: 22px;
  height: 22px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border: 2px solid white;
}
</style>
