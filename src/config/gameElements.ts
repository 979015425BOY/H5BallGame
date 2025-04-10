// 游戏元素类型定义
export interface GameElement {
  id: string;
  name: string;
  type: 'ball1' | 'ball2' | 'heart' | 'spike';
  defaultColor: string;
  description: string;
}

// 游戏元素配置
export const gameElements: GameElement[] = [
  {
    id: 'ball1',
    name: '小球1',
    type: 'ball1',
    defaultColor: '#3498db', // 蓝色
    description: '玩家1控制的小球，默认为蓝色'
  },
  {
    id: 'ball2',
    name: '小球2',
    type: 'ball2',
    defaultColor: '#e74c3c', // 红色
    description: '玩家2控制的小球，默认为红色'
  },
  {
    id: 'heart',
    name: '爱心',
    type: 'heart',
    defaultColor: '#2ecc71', // 绿色
    description: '回复生命值的道具'
  },
  {
    id: 'spike',
    name: '尖刺齿轮',
    type: 'spike',
    defaultColor: '#e67e22', // 橙色
    description: '减少生命值的障碍物'
  }
];

// 获取元素配置
export function getElementByType(type: string): GameElement | undefined {
  return gameElements.find(element => element.type === type);
}

// 获取元素配置通过ID
export function getElementById(id: string): GameElement | undefined {
  return gameElements.find(element => element.id === id);
}

// 获取元素图标
export function getElementImage(id: string): string | null {
  return localStorage.getItem(`game_icon_${id}`);
}

// 设置元素图标
export function setElementImage(id: string, imageUrl: string): void {
  localStorage.setItem(`game_icon_${id}`, imageUrl);
} 