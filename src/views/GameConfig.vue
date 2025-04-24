<template>
  <div class="game-config">
    <div class="tabs">
      <button class="reset-btn" @click="resetConfig">重置配置</button>
      <div class="tab" :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'">游戏基础配置</div>
      <div class="tab" :class="{ active: activeTab === 'balls' }" @click="activeTab = 'balls'">小球配置</div>
      <div class="tab" :class="{ active: activeTab === 'powerups' }" @click="activeTab = 'powerups'">道具配置</div>
    </div>

    <!-- 游戏基础配置标签页 -->
    <div v-if="activeTab === 'general'" class="tab-content">
      <h2 class="section-title">游戏基础配置</h2>

      <div class="config-item">
        <label for="initialHp">初始生命值</label>
        <input id="initialHp" type="number" min="1" max="10" v-model.number="config.initialHp" @change="updateGameConfig" />
      </div>

      <div class="config-item">
        <label for="shrinkRate">边界缩小速率 (每帧像素)</label>
        <input id="shrinkRate" type="number" min="0" max="0.1" step="0.001" v-model.number="config.shrinkRate" @change="updateGameConfig" />
        <span>{{ config.shrinkRate.toFixed(3) }}</span>
      </div>

      <div class="config-item">
        <label for="minAreaSize">最小区域大小 (像素)</label>
        <input id="minAreaSize" type="number" min="10" max="200" v-model.number="config.minAreaSize" @change="updateGameConfig" />
      </div>

      <div class="config-item">
        <label for="powerUpSpawnInterval">道具生成间隔 (毫秒)</label>
        <input id="powerUpSpawnInterval" type="number" min="1000" max="15000" step="500" v-model.number="config.powerUpSpawnInterval" @change="updateGameConfig" />
      </div>

      <div class="config-item color-picker">
        <label for="damageColor">伤害道具颜色</label>
        <input id="damageColor" type="color" v-model="config.damagePowerUpColor" @change="updateGameConfig" />
        <span>{{ config.damagePowerUpColor }}</span>
      </div>

      <div class="config-item color-picker">
        <label for="healColor">治疗道具颜色</label>
        <input id="healColor" type="color" v-model="config.healPowerUpColor" @change="updateGameConfig" />
        <span>{{ config.healPowerUpColor }}</span>
      </div>
    </div>

    <!-- 小球配置标签页 -->
    <div v-if="activeTab === 'balls'" class="tab-content">
      <h2 class="section-title">小球配置</h2>
      
      <div class="balls-config">
        <!-- 玩家1配置 -->
        <div class="ball-config-section">
          <h3>玩家1配置</h3>
          
          <div class="config-item">
            <label for="player1Name">名称</label>
            <input id="player1Name" type="text" v-model="config.player1Name" @change="updateGameConfig" />
          </div>
          
          <div class="config-item color-picker">
            <label for="player1Color">小球颜色</label>
            <input id="player1Color" type="color" v-model="config.player1Color" @change="updateGameConfig" />
            <span>{{ config.player1Color }}</span>
          </div>
          
          <div class="config-item">
            <label for="player1OuterRadius">外圈半径比例</label>
            <input id="player1OuterRadius" type="range" min="0.8" max="1.5" step="0.1" v-model.number="config.player1OuterRadius" @change="updateGameConfig" />
            <span>{{ config.player1OuterRadius.toFixed(1) }}</span>
          </div>
          
          <div class="config-item">
            <label for="player1InnerRadius">内圈半径比例</label>
            <input id="player1InnerRadius" type="range" min="0.5" max="0.9" step="0.1" v-model.number="config.player1InnerRadius" @change="updateGameConfig" />
            <span>{{ config.player1InnerRadius.toFixed(1) }}</span>
          </div>
          
          <div class="config-item image-upload">
            <label for="player1Image">小球图片</label>
            <input id="player1Image" type="file" accept="image/*" @change="handleImageUpload($event, 'player1Image')" />
            <label for="player1Image">选择图片</label>
            <div class="image-preview" v-if="config.player1Image">
              <img :src="config.player1Image" alt="玩家1图片" />
              <button @click="clearImage('player1Image')">清除</button>
            </div>
          </div>
        </div>
        
        <!-- 玩家2配置 -->
        <div class="ball-config-section">
          <h3>玩家2配置</h3>
          
          <div class="config-item">
            <label for="player2Name">名称</label>
            <input id="player2Name" type="text" v-model="config.player2Name" @change="updateGameConfig" />
          </div>
          
          <div class="config-item color-picker">
            <label for="player2Color">小球颜色</label>
            <input id="player2Color" type="color" v-model="config.player2Color" @change="updateGameConfig" />
            <span>{{ config.player2Color }}</span>
          </div>
          
          <div class="config-item">
            <label for="player2OuterRadius">外圈半径比例</label>
            <input id="player2OuterRadius" type="range" min="0.8" max="1.5" step="0.1" v-model.number="config.player2OuterRadius" @change="updateGameConfig" />
            <span>{{ config.player2OuterRadius.toFixed(1) }}</span>
          </div>
          
          <div class="config-item">
            <label for="player2InnerRadius">内圈半径比例</label>
            <input id="player2InnerRadius" type="range" min="0.5" max="0.9" step="0.1" v-model.number="config.player2InnerRadius" @change="updateGameConfig" />
            <span>{{ config.player2InnerRadius.toFixed(1) }}</span>
          </div>
          
          <div class="config-item image-upload">
            <label for="player2Image">小球图片</label>
            <input id="player2Image" type="file" accept="image/*" @change="handleImageUpload($event, 'player2Image')" />
            <label for="player2Image">选择图片</label>
            <div class="image-preview" v-if="config.player2Image">
              <img :src="config.player2Image" alt="玩家2图片" />
              <button @click="clearImage('player2Image')">清除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 道具配置标签页 -->
    <div v-if="activeTab === 'powerups'" class="tab-content">
      <h2 class="section-title">道具配置</h2>

      <div class="powerups-config">
        <!-- 爱心道具配置 -->
        <div class="powerup-config-section">
          <h3>爱心道具</h3>
          <div class="config-item">
            <label for="heartItemSize">大小 (像素)</label>
            <input id="heartItemSize" type="number" min="5" max="50" v-model.number="config.heartItemSize" @change="updateGameConfig" />
          </div>
          <div class="config-item image-upload">
            <label for="heartItemImage">图片</label>
            <input id="heartItemImage" type="file" accept="image/*" @change="handleImageUpload($event, 'heartItemImage')" />
            <label for="heartItemImage">选择图片</label>
            <div class="image-preview" v-if="config.heartItemImage">
              <img :src="config.heartItemImage" alt="爱心道具图片" />
              <button @click="clearImage('heartItemImage')">清除</button>
            </div>
          </div>
        </div>

        <!-- 尖刺道具配置 -->
        <div class="powerup-config-section">
          <h3>尖刺道具</h3>
          <div class="config-item">
            <label for="spikeItemSize">大小 (像素)</label>
            <input id="spikeItemSize" type="number" min="5" max="50" v-model.number="config.spikeItemSize" @change="updateGameConfig" />
          </div>
          <div class="config-item image-upload">
            <label for="spikeItemImage">图片</label>
            <input id="spikeItemImage" type="file" accept="image/*" @change="handleImageUpload($event, 'spikeItemImage')" />
            <label for="spikeItemImage">选择图片</label>
            <div class="image-preview" v-if="config.spikeItemImage">
              <img :src="config.spikeItemImage" alt="尖刺道具图片" />
              <button @click="clearImage('spikeItemImage')">清除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

// 使用 reactive 包装 store 的 config 对象，以便双向绑定
// 注意：直接解构 state 会失去响应性，所以我们引用整个 config 对象
const config = reactive(gameStore.config)

// 确保 config 对象包含新增的道具配置项，如果 store 中还没有的话
if (config.heartItemSize === undefined) config.heartItemSize = 15;
if (config.heartItemImage === undefined) config.heartItemImage = '/src/static/png/love.png';
if (config.spikeItemSize === undefined) config.spikeItemSize = 20;
if (config.spikeItemImage === undefined) config.spikeItemImage = '/src/static/png/sawtooth.png';

// 标签页状态
const activeTab = ref('general')

// 加载已保存的配置
onMounted(() => {
  gameStore.loadGameConfig();
  // 确保加载后本地的 reactive 对象也更新
  Object.assign(config, gameStore.config);
});

// 更新配置的方法
const updateGameConfig = () => {
  // 调用 store 中的 action 来更新状态和 localStorage
  gameStore.updateGameConfig(config);
}

// 处理图片上传
const handleImageUpload = (event: Event, imageKey: 'player1Image' | 'player2Image' | 'heartItemImage' | 'spikeItemImage') => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        // 更新配置中的图片URL
        config[imageKey] = e.target.result;
        // 保存配置
        updateGameConfig();
      }
    };
    
    reader.readAsDataURL(file);
  }
};

// 清除图片
const clearImage = (imageKey: 'player1Image' | 'player2Image' | 'heartItemImage' | 'spikeItemImage') => {
  config[imageKey] = '';
  updateGameConfig();
};

// 重置配置
const resetConfig = () => {
  gameStore.resetConfig();
  Object.assign(config, gameStore.config);
};

</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

// 定义互补色和反差色
$complementary-blue: #ff7700; // 蓝色的互补色（橙色）
$complementary-red: #00bbaa; // 红色的互补色（青色）
$contrast-light: #eaeaea;
$contrast-dark: #333333;
$accent-color: #8a2be2; // 紫色作为强调色

.powerups-config,
.balls-config {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
}

.powerup-config-section,
.ball-config-section {
  flex: 1;
  min-width: 300px; // 保证在小屏幕上也能较好显示
  padding: 15px;
  border: 1px solid $border-color;
  border-radius: $border-radius-medium;
  background-color: rgba($background-light, 0.1);

  h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: $accent-color;
    text-align: center;
    border-bottom: 1px solid $border-color;
    padding-bottom: 10px;
  }
}

.game-config {
  padding: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background-color: rgba($background-dark, 0.7);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

/* 标签页样式 */
.tabs {
  display: flex;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
  padding-bottom: 5px;
}

.tab {
  padding: 12px 24px;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  margin-right: 8px;
  background-color: rgba($background-darker, 0.6);
  color: $contrast-light;
  font-weight: 500;
  transition: all $transition-time ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: none;
  
  &:hover {
    background-color: rgba($primary-blue, 0.2);
  }
}

.tab.active {
  background-color: $primary-blue;
  color: white;
  border-bottom: 2px solid $complementary-blue;
  transform: translateY(-3px);
}

.tab-content {
  width: 100%;
  padding: 15px;
  background-color: rgba($background-darker, 0.3);
  border-radius: 0 8px 8px 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  .section-title {
    color: $primary-blue;
    font-size: 1.8rem;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid rgba($complementary-blue, 0.5);
    text-align: center;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

/* 配置项样式 */
.config-item {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  padding: 5px 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 15px;
  }
}

label {
  display: inline-block;
  width: 180px; /* 调整标签宽度以对齐 */
  margin-right: 15px;
  text-align: right;
  color: $contrast-light;
  font-weight: 500;
  transition: color $transition-time ease;
  
  &:hover {
    color: $primary-blue;
  }
}

input[type="number"],
input[type="text"],
select {
  margin-right: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba($background-darker, 0.5);
  color: white;
  transition: all $transition-time ease;
  
  &:focus {
    outline: none;
    border-color: $primary-blue;
    box-shadow: 0 0 0 2px rgba($primary-blue, 0.3);
  }
  
  &:hover {
    border-color: rgba($primary-blue, 0.5);
  }
}

input[type="color"] {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  background: transparent;
  transition: transform $transition-time ease;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 50%;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
  }
  
  &:hover {
    transform: scale(1.1);
  }
}


input[type="range"] {
  width: 150px;
  height: 6px;
  -webkit-appearance: none;
  background: linear-gradient(to right, $primary-blue, $complementary-blue);
  border-radius: 10px;
  outline: none;
  padding: 0;
  margin: 0 15px 0 0;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    transition: all $transition-time ease;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  }
  
  &::-webkit-slider-thumb:hover {
    background: $complementary-blue;
    transform: scale(1.2);
  }
}

.color-picker span {
  display: inline-block;
  vertical-align: middle;
  margin-left: 10px;
  font-family: monospace;
  background-color: rgba($background-darker, 0.7);
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

/* 小球配置部分 */
.balls-config {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
}

.ball-config-section {
  flex: 1;
  min-width: 300px;
  padding: 20px;
  border-radius: 12px;
  transition: all $transition-time ease;
  position: relative;
  overflow: hidden;
  
  &:first-child {
    background-color: rgba($primary-blue, 0.15);
    border: 1px solid rgba($primary-blue, 0.3);
    
    h3 {
      color: $primary-blue;
    }
  }
  
  &:last-child {
    background-color: rgba($primary-red, 0.15);
    border: 1px solid rgba($primary-red, 0.3);
    
    h3 {
      color: $primary-red;
    }
  }
  
  &:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    transform: translateY(-3px);
  }
  
  h3 {
    margin-bottom: 15px;
    font-weight: 600;
    text-align: center;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.image-upload {
  margin-top: 20px;
  
  input[type="file"] {
    width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: -1;
  }
  
  input[type="file"] + label {
    display: inline-block;
    width: auto;
    padding: 8px 16px;
    background-color: $accent-color;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    text-align: center;
    margin: 10px auto;
    transition: all $transition-time ease;
    
    &:hover {
      background-color: darken($accent-color, 10%);
      transform: translateY(-2px);
    }
  }
}

.image-preview {
  margin-top: 15px;
  text-align: center;
  background-color: rgba($background-darker, 0.4);
  padding: 15px;
  border-radius: 8px;
}

.image-preview img {
  max-width: 100px;
  max-height: 100px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.2);
  display: block;
  margin: 0 auto 15px;
  transition: all $transition-time ease;
  
  &:hover {
    transform: scale(1.1);
    border-color: $primary-blue;
  }
}

.image-preview button {
  background-color: $primary-red;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all $transition-time ease;
  
  &:hover {
    background-color: darken($primary-red, 10%);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

.reset-btn {
  position: absolute;
  right: 20px;
  top: 20px;
  padding: 8px 16px;
  background-color: #ff4757;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: darken(#ff4757, 10%);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .game-config {
    padding: 15px;
    border-radius: 0;
  }
  
  .tabs {
    flex-direction: column;
    border-bottom: none;
    gap: 8px;
  }
  
  .tab {
    margin-bottom: 0;
    border-radius: 6px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .tab-content {
    border-radius: 6px;
    padding: 10px;
  }
  
  .config-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  label {
    width: 100%;
    text-align: left;
    margin-bottom: 8px;
    margin-right: 0;
  }
  
  input[type="range"] {
    width: 100%;
    margin: 10px 0;
  }
  
  .balls-config {
    flex-direction: column;
    gap: 15px;
  }
  
  .ball-config-section {
    width: 100%;
    padding: 15px;
  }
  
  .image-upload input[type="file"] + label {
    width: 100%;
    margin: 5px 0;
  }
}
</style>