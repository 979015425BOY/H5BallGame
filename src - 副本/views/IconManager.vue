<template>
  <div class="icon-manager">
    <h1 class="icon-manager__title">图标管理</h1>
    
    <div class="icon-list">
      <div 
        v-for="item in gameItems" 
        :key="item.id"
        class="icon-item"
        :class="{ 'icon-item--active': selectedItem?.id === item.id }"
        @click="selectItem(item)"
      >
        <div class="icon-preview">
          <img v-if="item.imageSrc" :src="item.imageSrc" :alt="item.name">
          <div v-else class="icon-placeholder" :style="getItemColor(item)">
            <span>{{ item.name[0] }}</span>
          </div>
        </div>
        <div class="icon-info">
          <div class="icon-name">{{ item.name }}</div>
          <div class="icon-id">ID: {{ item.id }}</div>
        </div>
      </div>
    </div>
    
    <!-- 编辑面板 -->
    <div class="edit-panel" v-if="selectedItem">
      <h2 class="edit-panel__title">编辑 {{ selectedItem.name }}</h2>
      
      <div class="form-group">
        <label for="itemName">名称</label>
        <input 
          id="itemName" 
          v-model="editForm.name" 
          class="form-input"
          placeholder="请输入图标名称"
        />
      </div>
      
      <div class="form-group">
        <label>当前图标</label>
        <div class="current-icon">
          <img 
            v-if="editForm.imageSrc" 
            :src="editForm.imageSrc" 
            :alt="editForm.name"
            class="current-icon__image"
          >
          <div v-else class="icon-placeholder large" :style="getItemColor(selectedItem)">
            <span>{{ editForm.name[0] }}</span>
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label for="iconUpload">上传新图标</label>
        <input 
          id="iconUpload" 
          type="file" 
          accept="image/*"
          @change="handleImageUpload" 
          class="file-input"
        />
        <div class="upload-preview" v-if="previewImageUrl">
          <img :src="previewImageUrl" alt="预览" class="preview-image">
          <button @click="clearPreview" class="clear-preview-btn">×</button>
        </div>
      </div>
      
      <div class="action-buttons">
        <button @click="saveChanges" class="save-btn">保存更改</button>
        <button @click="resetChanges" class="reset-btn">重置</button>
      </div>
    </div>
    
    <div class="empty-state" v-if="!selectedItem">
      <div class="empty-state__icon">🖌️</div>
      <p class="empty-state__text">请从上方选择一个元素进行编辑</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';

// 游戏元素类型定义
interface GameItem {
  id: string;
  name: string;
  type: 'ball1' | 'ball2' | 'heart' | 'spike';
  imageSrc: string | null;
}

// 游戏元素列表
const gameItems = ref<GameItem[]>([
  { id: 'ball1', name: '小球1', type: 'ball1', imageSrc: getStoredImage('ball1') },
  { id: 'ball2', name: '小球2', type: 'ball2', imageSrc: getStoredImage('ball2') },
  { id: 'heart', name: '爱心', type: 'heart', imageSrc: getStoredImage('heart') },
  { id: 'spike', name: '尖刺齿轮', type: 'spike', imageSrc: getStoredImage('spike') }
]);

// 当前选中的元素
const selectedItem = ref<GameItem | null>(null);

// 编辑表单
const editForm = reactive({
  id: '',
  name: '',
  type: '',
  imageSrc: ''
});

// 预览图片URL
const previewImageUrl = ref<string | null>(null);

// 从本地存储获取图片
function getStoredImage(itemId: string): string | null {
  return localStorage.getItem(`game_icon_${itemId}`);
}

// 保存图片到本地存储
function saveImageToStorage(itemId: string, imageUrl: string) {
  localStorage.setItem(`game_icon_${itemId}`, imageUrl);
}

// 获取元素颜色
function getItemColor(item: GameItem) {
  const colors = {
    ball1: 'background-color: #3498db;',
    ball2: 'background-color: #e74c3c;',
    heart: 'background-color: #2ecc71;',
    spike: 'background-color: #e67e22;'
  };
  return colors[item.type];
}

// 选择元素
const selectItem = (item: GameItem) => {
  selectedItem.value = item;
  
  // 重置表单
  editForm.id = item.id;
  editForm.name = item.name;
  editForm.type = item.type;
  editForm.imageSrc = item.imageSrc || '';
  
  // 清除预览
  previewImageUrl.value = null;
};

// 重置更改
const resetChanges = () => {
  if (selectedItem.value) {
    selectItem(selectedItem.value);
  }
};

// 处理图片上传
const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  
  const file = input.files[0];
  
  // 检查文件类型
  if (!file.type.match('image.*')) {
    alert('请上传图片文件');
    return;
  }
  
  // 创建预览
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target && typeof e.target.result === 'string') {
      previewImageUrl.value = e.target.result;
    }
  };
  reader.readAsDataURL(file);
};

// 清除预览
const clearPreview = () => {
  previewImageUrl.value = null;
  
  // 重置文件输入
  const fileInput = document.getElementById('iconUpload') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
};

// 保存更改
const saveChanges = () => {
  if (!selectedItem.value) return;
  
  // 更新本地数据
  const itemIndex = gameItems.value.findIndex(item => item.id === selectedItem.value?.id);
  if (itemIndex >= 0) {
    gameItems.value[itemIndex].name = editForm.name;
    gameItems.value[itemIndex].imageSrc = previewImageUrl.value || editForm.imageSrc;
  }
  
  // 更新游戏存储
  const imageToSave = previewImageUrl.value || editForm.imageSrc;
  if (imageToSave) {
    saveImageToStorage(selectedItem.value.id, imageToSave);
  }
  
  // 提示保存成功
  alert(`${editForm.name} 图标已更新成功！`);
  
  // 更新当前选择的元素
  selectedItem.value = gameItems.value[itemIndex];
  
  // 清除预览
  previewImageUrl.value = null;
  
  // 重置文件输入
  const fileInput = document.getElementById('iconUpload') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
};

// 组件挂载时的处理
onMounted(() => {
  // 从存储中加载图片
  gameItems.value.forEach(item => {
    item.imageSrc = getStoredImage(item.id);
  });
});
</script>

<style lang="scss" scoped>
.icon-manager {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 2rem;
  overflow: auto;
  background-color: #1a1a1a;
  color: #fff;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
  
  &__title {
    font-size: 1.8rem;
    margin-bottom: 2rem;
    text-align: center;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
  }
}

.icon-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}

.icon-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }
  
  &--active {
    background-color: rgba(66, 139, 202, 0.4);
    
    &:hover {
      background-color: rgba(66, 139, 202, 0.5);
    }
  }
}

.icon-preview {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.2);
  margin-right: 1rem;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.icon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  
  &.large {
    font-size: 3rem;
    width: 100px;
    height: 100px;
  }
}

.icon-info {
  flex: 1;
}

.icon-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.icon-id {
  font-size: 0.8rem;
  opacity: 0.7;
}

.edit-panel, .empty-state {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
}

.edit-panel {
  &__title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  
  label {
    font-weight: bold;
    opacity: 0.9;
  }
}

.form-input {
  padding: 0.75rem;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: rgba(66, 139, 202, 0.8);
  }
}

.file-input {
  border: 1px dashed rgba(255, 255, 255, 0.3);
  padding: 1rem;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.current-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.upload-preview {
  position: relative;
  width: 100px;
  height: 100px;
  margin-top: 1rem;
  border-radius: 50%;
  overflow: hidden;
  
  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .clear-preview-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1rem;
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  
  button {
    flex: 1;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    border: none;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .save-btn {
    background-color: rgba(46, 204, 113, 0.8);
    color: white;
    
    &:hover {
      background-color: rgba(46, 204, 113, 1);
    }
  }
  
  .reset-btn {
    background-color: rgba(44, 62, 80, 0.8);
    color: white;
    
    &:hover {
      background-color: rgba(44, 62, 80, 1);
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  
  &__icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  &__text {
    font-size: 1.2rem;
    opacity: 0.7;
  }
}
</style> 