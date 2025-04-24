import Matter from 'matter-js';
import { useGameStore } from '@/stores/gameStore';

export const createHeartItem = (x: number, y: number) => {
  const gameStore = useGameStore();
  const config = gameStore.config;
  const itemSize = config.heartItemSize;
  const heartX = x + Math.random() * 100 - 50;
  const heartY = y + Math.random() * 100 - 50;
  
  const heartImage = new Image();
  heartImage.src = config.heartItemImage;
  
  // 确保图片加载完成
  heartImage.onload = () => {
    Matter.Body.set(heartItem, {
      render: {
        sprite: {
          texture: heartImage.src,
          xScale: 0.1,
          yScale: 0.1
        }
      }
    });
  };
  
  return Matter.Bodies.rectangle(heartX, heartY, itemSize, itemSize, {
    isStatic: true,
    isSensor: true,
    collisionFilter: {
      group: -1,
      category: 0x0002,
      mask: 0xFFFFFFFF
    },
    render: {
      sprite: {
        texture: heartImage.src,
        xScale: 0.1,
        yScale: 0.1
      }
    },
    label: 'heartItem',
    heartImage: heartImage
  });
};

export const createSpikeItem = (x: number, y: number) => {
  const gameStore = useGameStore();
  const config = gameStore.config;
  const itemSize = config.spikeItemSize;
  const spikeX = x + Math.random() * 80 - 40;
  const spikeY = y + Math.random() * 80 - 40;
  
  const spikeImage = new Image();
  spikeImage.src = config.spikeItemImage;
  
  const item = Matter.Bodies.rectangle(spikeX, spikeY, itemSize, itemSize, {
    isStatic: true,
    isSensor: true,
    collisionFilter: {
      group: -1,
      category: 0x0004,
      mask: 0xFFFFFFFF
    },
    render: {
      sprite: {
        texture: spikeImage.src,
        xScale: 0.1,
        yScale: 0.1
      }
    },
    label: 'spikeItem',
    angle: 0,
    spikeImage: spikeImage
  });
  
  return item;
};

export const setupSpikeRotation = (engine: Matter.Engine, spikeItem: Matter.Body, isRunning: boolean) => {
  Matter.Events.on(engine, 'beforeUpdate', () => {
    if (spikeItem && isRunning) {
      Matter.Body.setAngle(spikeItem, spikeItem.angle + 0.05);
      Matter.Body.setPosition(spikeItem, {x: spikeItem.position.x, y: spikeItem.position.y});
    }
  });
};