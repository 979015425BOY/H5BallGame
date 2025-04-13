<template>
  <div class="app">
    <!-- PC端侧边导航栏 -->
    <div class="sidebar">
      <div class="sidebar-title">游戏管理</div>
      <nav class="sidebar-menu">
        <router-link to="/" class="sidebar-item" active-class="sidebar-item--active">
          <span class="sidebar-icon">🎮</span>
          <span class="sidebar-text">球球游戏</span>
        </router-link>
        <router-link to="/icon-manager" class="sidebar-item" active-class="sidebar-item--active">
          <span class="sidebar-icon">🖼️</span>
          <span class="sidebar-text">图标管理</span>
        </router-link>
        <router-link to="/game-config" class="sidebar-item" active-class="sidebar-item--active">
          <span class="sidebar-icon">⚙️</span>
          <span class="sidebar-text">游戏配置</span>
        </router-link>
      </nav>
    </div>
    
    <!-- 主内容区域 -->
    <div class="main-content">
      <div class="content-wrapper">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 不需要额外的脚本
</script>

<style lang="scss">
@use '@/styles/variables' as *;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  overscroll-behavior: none;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: $background-darker;
  color: white;
}

.app {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background-color: $background-dark;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0; // 防止侧边栏被压缩
  
  @media (max-width: 768px) {
    display: none; // 移动端隐藏侧边栏
  }
}

.sidebar-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
  color: $primary-blue;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  color: white;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  &.active {
    background-color: rgba($primary-blue, 0.2);
    color: $primary-blue;
  }
  
  .sidebar-icon {
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }
}

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 0;
    overflow: hidden;
  }
}

.content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1rem;
  
  @media (max-width: 768px) {
    padding: 0;
  }
}
</style>
