<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../api/supabase.js'

const router = useRouter()
const dishes = ref([])
const categories = ref([])
const loading = ref(true)
const showForm = ref(false)
const editingDish = ref(null)
const form = ref({ name: '', price: '', category_id: '', description: '', is_available: true })
const showCategoryForm = ref(false)
const catForm = ref({ name: '', sort_order: 0 })
const uploading = ref(false)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [catRes, dishRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('dishes').select('*, categories(name)').order('id', { ascending: false })
    ])
    categories.value = catRes.data || []
    dishes.value = dishRes.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function logout() {
  sessionStorage.removeItem('admin_logged_in')
  router.push('/admin')
}

function openNewDish() {
  editingDish.value = null
  form.value = { name: '', price: '', category_id: categories.value[0]?.id || '', description: '', is_available: true }
  showForm.value = true
}

function openEdit(dish) {
  editingDish.value = dish
  form.value = {
    name: dish.name,
    price: String(dish.price),
    category_id: dish.category_id,
    description: dish.description || '',
    is_available: dish.is_available
  }
  showForm.value = true
}

async function saveDish() {
  if (!form.value.name || !form.value.price || !form.value.category_id) {
    alert('请填写菜品名称、价格和分类')
    return
  }
  const payload = {
    name: form.value.name,
    price: parseFloat(form.value.price),
    category_id: parseInt(form.value.category_id),
    description: form.value.description,
    is_available: form.value.is_available,
    image_url: form.value.image_url || null
  }

  try {
    if (editingDish.value) {
      const { error } = await supabase.from('dishes').update(payload).eq('id', editingDish.value.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('dishes').insert(payload)
      if (error) throw error
    }
    showForm.value = false
    await loadData()
  } catch (e) {
    alert('保存失败: ' + e.message)
  }
}

async function deleteDish(id) {
  if (!confirm('确定删除该菜品？')) return
  try {
    await supabase.from('dishes').delete().eq('id', id)
    await loadData()
  } catch (e) {
    alert('删除失败')
  }
}

async function saveCategory() {
  if (!catForm.value.name) return
  try {
    await supabase.from('categories').insert({ name: catForm.value.name, sort_order: catForm.value.sort_order })
    showCategoryForm.value = false
    catForm.value = { name: '', sort_order: 0 }
    await loadData()
  } catch (e) {
    alert('添加分类失败')
  }
}

async function deleteCategory(id) {
  if (!confirm('确定删除该分类？（分类下的菜品也会被删除）')) return
  try {
    await supabase.from('categories').delete().eq('id', id)
    await loadData()
  } catch (e) {
    alert('删除失败')
  }
}

async function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  uploading.value = true
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('dish-images')
      .upload(fileName, file)
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('dish-images')
      .getPublicUrl(fileName)

    form.value.image_url = publicUrl
  } catch (e) {
    alert('上传图片失败')
    console.error(e)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <div>
        <h1><img src="/logo.jpg" alt="皮皮" class="admin-logo" /> 菜品管理</h1>
        <p class="admin-subtitle">皮皮点菜 · 管理后台</p>
      </div>
      <div class="header-actions">
        <router-link to="/admin/orders" class="btn btn-sm nav-btn">📋 订单</router-link>
        <button class="btn btn-sm nav-btn" @click="logout">🚪 退出</button>
      </div>
    </header>

    <div class="toolbar">
      <button class="btn btn-primary btn-sm" @click="openNewDish">➕ 添加菜品</button>
      <button class="btn btn-sm tool-btn" @click="showCategoryForm = !showCategoryForm">📂 管理分类</button>
    </div>

    <!-- Category Form -->
    <div v-if="showCategoryForm" class="category-form">
      <div class="cat-list">
        <div v-for="cat in categories" :key="cat.id" class="cat-item">
          <span>📁 {{ cat.name }}</span>
          <button class="btn-sm" @click="deleteCategory(cat.id)" style="color:var(--primary-dark)">删除</button>
        </div>
      </div>
      <div class="cat-add">
        <input v-model="catForm.name" placeholder="分类名称" />
        <input v-model="catForm.sort_order" type="number" placeholder="排序" />
        <button class="btn btn-primary btn-sm" @click="saveCategory">添加 ➕</button>
      </div>
    </div>

    <!-- Dish Form Modal -->
    <Teleport to="body">
      <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
        <div class="modal">
          <h2>{{ editingDish ? '✏️ 编辑菜品' : '🍽️ 添加菜品' }}</h2>
          <div class="form-group">
            <label>菜品名称</label>
            <input v-model="form.name" placeholder="例：鱼香肉丝" />
          </div>
          <div class="form-group">
            <label>价格 (¥)</label>
            <input v-model="form.price" type="number" step="0.01" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="form.category_id">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>描述</label>
            <input v-model="form.description" placeholder="菜品描述（选填）" />
          </div>
          <div class="form-group">
            <label>图片</label>
            <div class="upload-area">
              <input type="file" accept="image/*" @change="handleImageUpload" id="fileInput" />
              <label for="fileInput" class="upload-label" v-if="!uploading && !form.image_url">📸 点击上传图片</label>
              <span v-if="uploading">⏳ 上传中...</span>
            </div>
            <img v-if="form.image_url" :src="form.image_url" class="preview-img" />
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="form.is_available" />
              上架中
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn" @click="showForm = false">取消</button>
            <button class="btn btn-primary" @click="saveDish">💾 保存</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Dish List -->
    <div class="dish-admin-list" v-if="!loading">
      <div v-for="dish in dishes" :key="dish.id" class="dish-admin-item">
        <div class="dish-admin-info">
          <div class="dish-admin-name">
            <h3>{{ dish.name }}</h3>
            <span v-if="!dish.is_available" class="badge-off">已下架</span>
          </div>
          <p>¥{{ dish.price }} · {{ dish.categories?.name }}</p>
        </div>
        <div class="dish-admin-actions">
          <button class="btn btn-sm" @click="openEdit(dish)">✏️</button>
          <button class="btn btn-sm del-btn" @click="deleteDish(dish.id)">🗑️</button>
        </div>
      </div>
      <div v-if="dishes.length === 0" class="empty">😢 暂无菜品，点击上方按钮添加吧~</div>
    </div>
    <div v-else class="loading">🐶 加载中...</div>
  </div>
</template>

<style scoped>
.admin-page { min-height: 100dvh; background: var(--bg); }
.admin-header {
  background: linear-gradient(135deg, #ff8fab 0%, #ff6b8a 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.admin-header h1 { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.admin-logo {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.3);
}
.admin-subtitle { font-size: 12px; opacity: 0.8; margin-top: 2px; }
.header-actions { display: flex; gap: 8px; }
.nav-btn { background: rgba(255,255,255,0.25) !important; color: white !important; backdrop-filter: blur(4px); }

.toolbar {
  padding: 14px 16px;
  display: flex;
  gap: 8px;
  background: white;
  border-bottom: 1px solid var(--border);
}
.tool-btn {
  background: var(--bg) !important;
  color: var(--text) !important;
}

.category-form {
  padding: 16px;
  background: white;
  border-bottom: 1px solid var(--border);
}
.cat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px solid var(--border);
}
.cat-add {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.cat-add input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-size: 13px;
  background: var(--bg);
}
.cat-add input:focus { border-color: var(--primary); background: white; }

.dish-admin-list { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.dish-admin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.dish-admin-name h3 { font-size: 15px; font-weight: 600; }
.dish-admin-name { display: flex; align-items: center; gap: 8px; }
.dish-admin-info p { font-size: 13px; color: var(--primary-dark); font-weight: 500; margin-top: 4px; }
.badge-off {
  display: inline-block;
  font-size: 10px;
  background: var(--bg);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 6px;
}
.dish-admin-actions { display: flex; gap: 4px; }
.dish-admin-actions .btn {
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 10px;
  background: var(--bg);
}
.del-btn:active { background: var(--primary-light); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(90, 74, 90, 0.5);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal {
  background: white;
  border-radius: 24px;
  padding: 28px 24px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.15);
}
.modal h2 { font-size: 18px; margin-bottom: 20px; }
.form-group {
  margin-bottom: 14px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.form-group input, .form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 14px;
  background: var(--bg);
  transition: all 0.2s;
}
.form-group input:focus, .form-group select:focus {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 4px rgba(255, 143, 171, 0.1);
}
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
  font-weight: 400 !important;
}
.checkbox-group input { width: auto; }
.upload-area {
  position: relative;
}
.upload-area input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.upload-label {
  display: block;
  padding: 14px;
  text-align: center;
  border: 2px dashed var(--border);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-secondary);
  background: var(--bg);
  cursor: pointer;
}
.preview-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 12px;
  margin-top: 8px;
  border: 2px solid var(--border);
}
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 24px;
}
.modal-actions .btn {
  padding: 10px 20px;
  border-radius: 12px;
  min-width: 80px;
}
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  font-size: 15px;
}
</style>
