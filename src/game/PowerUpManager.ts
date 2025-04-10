import Matter from 'matter-js';

export const createHeartItem = (x: number, y: number) => {
  const itemSize = 15; // 固定尺寸为15px
  // 爱心道具独立位置计算逻辑
  const heartX = x + Math.random() * 100 - 50;
  const heartY = y + Math.random() * 100 - 50;
  // 假设 PNG 图片路径为 /src/static/png/love.png
  const texturePath = '/src/static/png/love.png';
  // 假设 PNG 图片原始宽度和高度为 100px，这里的缩放比例就是 15 / 100 = 0.15
  const scale = itemSize / 100; 

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
        texture: texturePath,
        xScale: 0.1,
        yScale: 0.1
      }
    },
    label: 'heartItem'
  });
};

export const createSpikeItem = (x: number, y: number) => {
  const itemSize = 20; // 固定尺寸为20px
  // 尖刺道具独立位置计算逻辑
  const spikeX = x + Math.random() * 80 - 40;
  const spikeY = y + Math.random() * 80 - 40;
  // 假设 PNG 图片路径为 /src/static/png/gear.png
  const texturePath = '/src/static/png/gear.png';
  const scale = 0.1; 

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
        texture: texturePath,
        xScale: scale,
        yScale: scale
      }
    },
    label: 'spikeItem',
    angle: 0
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