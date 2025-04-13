<template>
  <div class="game-config">
    <h2>游戏配置</h2>
    <div class="config-item">
      <label>小球速度</label>
      <input type="range" min="1" max="10" v-model="ballSpeed" @change="updateConfig" />
      <span>{{ ballSpeed }}</span>
    </div>
    <div class="config-item">
      <label>移动轨迹</label>
      <select v-model="ballTrajectory" @change="updateConfig">
        <option value="linear">直线</option>
        <option value="sin">正弦曲线</option>
        <option value="cos">余弦曲线</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()
const ballSpeed = ref(gameStore.ballSpeed)
const ballTrajectory = ref(gameStore.ballTrajectory)

const updateConfig = () => {
  gameStore.updateConfig({
    ballSpeed: ballSpeed.value,
    ballTrajectory: ballTrajectory.value
  })
}
</script>

<style scoped>
.game-config {
  padding: 20px;
}
.config-item {
  margin-bottom: 15px;
}
label {
  margin-right: 10px;
}
</style>