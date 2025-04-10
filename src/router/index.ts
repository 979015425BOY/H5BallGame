import { createRouter, createWebHistory } from 'vue-router'
import IconManager from '@/views/IconManager.vue'
import BallGame from '@/components/BallGame.vue'
import GameConfig from '@/views/GameConfig.vue'

const routes = [
  {
    path: '/',
    name: 'BallGame',
    component: BallGame
  },
  {
    path: '/icon-manager',
    name: 'IconManager',
    component: IconManager
  },
  {
    path: '/game-config',
    name: 'GameConfig',
    component: GameConfig
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router