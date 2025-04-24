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
    },
    // 游戏配置
    config: {
      initialHp: 5,
      shrinkRate: 0.01,
      minAreaSize: 50,
      powerUpSpawnInterval: 5000,
      player1Color: '#4682B4',
      player2Color: '#FF6347',
      damagePowerUpColor: '#FFD700',
      healPowerUpColor: '#32CD32',
      // 小球配置
      player1Name: '玩家1',
      player2Name: '玩家2',
      player1OuterRadius: 1.0, // 外圈半径比例因子
      player2OuterRadius: 1.0,
      player1InnerRadius: 0.8, // 内圈半径比例因子
      player2InnerRadius: 0.8,
      player1Image: '', // 小球上的图片URL
      player2Image: '',
      // 道具配置
      heartItemSize: 15, // 爱心道具大小
      heartItemImage: '/src/static/png/love.png', // 爱心道具图片
      spikeItemSize: 20, // 尖刺道具大小
      spikeItemImage: '/src/static/png/sawtooth.png', // 尖刺道具图片
      gearImage: '/src/static/png/gear.png', // 尖刺状态小球外圈图片
      // 可以添加更多配置项，例如初始速度范围等
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
    
    // 更新游戏配置
    updateGameConfig(newConfig: Partial<typeof this.config>) {
      this.config = { ...this.config, ...newConfig };
      // 可以选择将配置保存到 localStorage
      localStorage.setItem('game_config', JSON.stringify(this.config));
    },

    // 加载游戏配置 (例如在应用启动时)
    loadGameConfig() {
      const savedConfig = localStorage.getItem('game_config');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          // 合并加载的配置和默认配置，以确保新添加的字段存在
          this.config = { ...this.$state.config, ...parsedConfig };
        } catch (e) {
          console.error('Failed to parse saved game config:', e);
          // 如果解析失败，可以使用默认配置
        }
      }
    },

    // 重置元素图标到默认状态
    resetItemImage(itemId: string) {
      if (itemId in this.icons) {
    
this.resetConfig()
        this.icons[itemId as keyof typeof this.icons] = this.defaultIcons[itemId as keyof typeof this.defaultIcons];
        localStorage.removeItem(`game_icon_${itemId}`);
      }
    },
    // 重置游戏配置到默认状态

    resetConfig() {
      const defaultConfig = {
        initialHp: 5,
        shrinkRate: 0.01,
        minAreaSize: 50,
        powerUpSpawnInterval: 5000,
        player1Color: '#4682B4',
        player2Color: '#FF6347',
        damagePowerUpColor: '#FFD700',
        healPowerUpColor: '#32CD32',
        player1Name: '玩家1',
        player2Name: '玩家2',
        player1OuterRadius: 1.0,
        player2OuterRadius: 1.0,
        player1InnerRadius: 0.8,
        player2InnerRadius: 0.8,
        player1Image: '',
        player2Image: '',
        heartItemSize: 15,
        heartItemImage: '/src/static/png/love.png',
        spikeItemSize: 20,
        spikeItemImage: '/src/static/png/sawtooth.png'
      };
      this.config = defaultConfig;
      localStorage.setItem('game_config', JSON.stringify(defaultConfig));
    },
    
    // 重置所有图标
    resetAllImages() {
      for (const key in this.icons) {
        this.resetItemImage(key);
      }
    }
  }
});