<script setup>
defineProps({
  dish: { type: Object, required: true }
})
const emit = defineEmits(['add'])
</script>

<template>
  <div class="dish-card" @click="emit('add', dish)">
    <div class="dish-img">
      <img v-if="dish.image_url" :src="dish.image_url" :alt="dish.name" />
      <div v-else class="img-placeholder">
        {{ ['🍕','🍜','🥗','🍣','🍛','🥟','🍲','🥘','🍝','🌮'][dish.id % 10] }}
      </div>
    </div>
    <div class="dish-info">
      <h3 class="dish-name">{{ dish.name }}</h3>
      <p class="dish-desc" v-if="dish.description">{{ dish.description }}</p>
      <div class="dish-footer">
        <span class="dish-price">¥{{ dish.price }}</span>
        <button class="add-btn" @click.stop="emit('add', dish)">+</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dish-card {
  background: var(--card);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: all 0.2s;
  cursor: pointer;
  border: 2px solid transparent;
}
.dish-card:active {
  transform: scale(0.95);
  border-color: var(--primary-light);
}

.dish-img {
  width: 100%;
  aspect-ratio: 16/10;
  background: linear-gradient(135deg, var(--primary-bg), #fce8ef);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.dish-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-placeholder {
  font-size: 36px;
}

.dish-info {
  padding: 10px 12px 14px;
}
.dish-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
  color: var(--text);
}
.dish-desc {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dish-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dish-price {
  font-size: 17px;
  font-weight: 700;
  color: var(--primary-dark);
  letter-spacing: -0.5px;
}
.add-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 3px 8px rgba(255, 143, 171, 0.3);
}
.add-btn:active {
  transform: scale(0.85);
}
</style>
