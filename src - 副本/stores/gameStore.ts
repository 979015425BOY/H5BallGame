import { defineStore } from 'pinia';

export const useGameStore = defineStore('game', {
  state: () => ({
    // 图标映射表
    icons: {
      ball1: null as string | null,
      ball2: null as string | null,
      heart: null as string | null,
      spike: null as string | null
    },
    // 默认图标（预设好的Base64或URL）
    defaultIcons: {
      ball1: null as string | null,
      ball2: null as string | null,
      heart: null as string | null,
      spike: null as string | null
    }
  }),
  
  actions: {
    // 设置元素图标
    setItemImage(itemId: string, imageUrl: string) {
      if (itemId in this.icons) {
        this.icons[itemId as keyof typeof this.icons] = imageUrl;
        
        // 保存到本地存储
        localStorage.setItem(`game_icon_${itemId}`, imageUrl);
      }
    },
    
    // 获取元素图标
    getItemImage(itemId: string): string | null {
      // 首先尝试从状态获取
      const stateIcon = this.icons[itemId as keyof typeof this.icons];
      if (stateIcon) return stateIcon;
      
      // 然后尝试从本地存储获取
      const localIcon = localStorage.getItem(`game_icon_${itemId}`);
      if (localIcon) {
        // 更新状态并返回
        this.icons[itemId as keyof typeof this.icons] = localIcon;
        return localIcon;
      }
      
      // 最后返回默认图标
      return this.defaultIcons[itemId as keyof typeof this.defaultIcons];
    },
    
    // 重置元素图标到默认状态
    resetItemImage(itemId: string) {
      if (itemId in this.icons) {
        this.icons[itemId as keyof typeof this.icons] = this.defaultIcons[itemId as keyof typeof this.defaultIcons];
        localStorage.removeItem(`game_icon_${itemId}`);
      }
    },
    
    // 重置所有图标
    resetAllImages() {
      for (const key in this.icons) {
        this.resetItemImage(key);
      }
    }
  }
}); 