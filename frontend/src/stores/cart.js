import { reactive, computed } from 'vue'

const state = reactive({
  items: [],
  note: ''
})

export function useCart() {
  const totalCount = computed(() =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  )

  const totalPrice = computed(() =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  function addDish(dish) {
    const existing = state.items.find(item => item.dish_id === dish.id)
    if (existing) {
      existing.quantity++
    } else {
      state.items.push({
        dish_id: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: 1
      })
    }
  }

  function removeDish(dishId) {
    const idx = state.items.findIndex(item => item.dish_id === dishId)
    if (idx !== -1) {
      if (state.items[idx].quantity > 1) {
        state.items[idx].quantity--
      } else {
        state.items.splice(idx, 1)
      }
    }
  }

  function clearCart() {
    state.items = []
    state.note = ''
  }

  function setNote(note) {
    state.note = note
  }

  return {
    items: state.items,
    note: computed(() => state.note),
    totalCount,
    totalPrice,
    addDish,
    removeDish,
    clearCart,
    setNote
  }
}
