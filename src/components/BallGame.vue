<template>
  <div class="game-container">
    <div class="lives-display">
      <div class="player1-container">
        <div class="player-label">P1</div>
        <div class="lives-bar">
          <div v-for="i in 5" :key="i" class="life-point" :class="{ 'active': i <= player1Lives, 'player1': true }" />
        </div>
      </div>
      <div class="player2-container">
        <div class="player-label">P2</div>
        <div class="lives-bar">
          <div v-for="i in 5" :key="i" class="life-point" :class="{ 'active': i <= player2Lives, 'player2': true }" />
        </div>
      </div>
    </div>
    <div class="canvas-container" ref="canvasContainer">
      <canvas ref="gameCanvas" />
      <Transition name="fade">
        <div v-if="!isGameStarted" class="start-overlay">
          <button class="start-button" @click="startGame">开始游戏</button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { GameEngine } from '../game/GameEngine'
import { useWindowSize } from '@vueuse/core'

const gameCanvas = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLElement | null>(null)
const player1Lives = ref(5)
const player2Lives = ref(5)
const isGameStarted = ref(false)
let gameEngine: GameEngine | null = null

// 监听窗口大小变化
const { width: windowWidth } = useWindowSize()

// 调整画布大小
const resizeCanvas = async () => {
  if (!canvasContainer.value || !gameCanvas.value || !gameEngine) return
  
  // 等待DOM更新
  await nextTick()
  
  // 获取容器尺寸
  const container = canvasContainer.value
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  
  // 选择较小的值确保为正方形
  const size = Math.min(containerWidth, containerHeight)
  
  // 设置canvas样式，确保居中
  const canvas = gameCanvas.value
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`
  canvas.width = size
  canvas.height = size
  
  // 更新游戏引擎
  if (gameEngine) {
    gameEngine.resize(size, size)
  }
  
  console.log(`Resized canvas to ${size}x${size}`)
}

onMounted(async () => {
  if (gameCanvas.value) {
    // 创建游戏引擎
    gameEngine = new GameEngine(gameCanvas.value)
    
    // 设置生命值更新回调
    gameEngine.onLivesUpdate((p1Lives: number, p2Lives: number) => {
      console.log(`Lives updated: P1=${p1Lives}, P2=${p2Lives}`)
      player1Lives.value = p1Lives
      player2Lives.value = p2Lives
    })
    
    // 初始化游戏
    gameEngine.init()
    
    // 首次调整尺寸
    await nextTick()
    if (canvasContainer.value) {
      const containerWidth = canvasContainer.value.clientWidth
      const containerHeight = containerWidth * 0.75
      gameEngine.resize(containerWidth, containerHeight)
    }
  }
})

// 监听窗口大小变化
watch(windowWidth, resizeCanvas)

// 监听窗口大小变化
window.addEventListener('resize', debounce(() => {
  resizeCanvas();
}, 200));

// 简单的防抖函数
function debounce(fn: Function, delay: number) {
  let timer: number | null = null;
  return function() {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn();
      timer = null;
    }, delay);
  };
}

// 确保组件卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('resize', debounce);
  gameEngine?.destroy();
})

const startGame = () => {
  if (!gameEngine) return
  isGameStarted.value = true
  gameEngine.start()
  gameEngine.startBorderShrink()
  
  // 添加边框更新循环
  console.log('Starting border update loop')
  const updateLoop = setInterval(() => {
    // 检查gameEngine是否为null，避免潜在的空指针异常
    if (gameEngine) {
      // 由于updateBorderOffset是私有方法，不能直接调用，这里假设GameEngine类有一个公共方法来间接调用它
      gameEngine.indirectlyUpdateBorderOffset() 
    }
  }, 16) // 约60fps
  
  onUnmounted(() => clearInterval(updateLoop))
}
</script>

<style lang="scss">
.game-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: $background-dark;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
  }
}

.lives-display {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: min(100%, 800px);
  margin-bottom: 1rem;
  gap: 1rem;
  
  @media (max-width: 768px) {
    margin-bottom: 0.5rem;
  }
}

.player1-container, .player2-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.player-label {
  font-weight: bold;
  margin-bottom: 0.3rem;
  color: white;
}

.lives-bar {
  display: flex;
  gap: 0.3rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 1rem;
  width: 100%;
  justify-content: center;
}

.life-point {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: #666; // 默认灰色（没血）
  transition: background-color $transition-time ease;
  
  @media (max-width: 768px) {
    width: 0.8rem;
    height: 0.8rem;
  }
}

.life-point.player1.active {
  background: #0088ff; // 蓝色代表P1有血
}

.life-point.player2.active {
  background: #ff4444; // 红色代表P2有血
}

.canvas-container {
  position: relative;
  width: min(85vh, 800px); /* 基于视口高度 */
  height: min(85vh, 800px); /* 基于视口高度 */
  aspect-ratio: 1/1; /* 保持1:1比例 */
  margin: 0 auto;
  border-radius: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    width: 80vh; /* 移动端稍微小一点 */
    height: 80vh;
    max-width: 90vw; /* 确保不会超出屏幕宽度 */
    max-height: 90vw;
  }
}

canvas {
  position: relative; /* 改为相对定位，便于居中 */
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 0;
  touch-action: none;
  display: block; /* 消除潜在的内联元素空白 */
}

.start-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 0;
}

// 添加淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.start-button {
  padding: 1rem 2rem;
  font-size: clamp(1rem, 5vw, 1.5rem);
  font-weight: bold;
  color: white;
  background: linear-gradient(45deg, $primary-blue, lighten-color($primary-blue, 20%));
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all $transition-time ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba($primary-blue, 0.5);
  }
  
  &:active {
    transform: scale(0.95);
  }
}
</style>