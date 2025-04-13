import Matter from 'matter-js';

export const createHeartItem = (x: number, y: number) => {
  const itemSize = 15; // 固定尺寸为15px
  const heartX = x + Math.random() * 100 - 50;
  const heartY = y + Math.random() * 100 - 50;
  
  const heartImage = new Image();
  heartImage.src = '/src/static/png/love.png';
  
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
  const itemSize = 20; // 固定尺寸为20px
  const spikeX = x + Math.random() * 80 - 40;
  const spikeY = y + Math.random() * 80 - 40;
  
  const spikeImage = new Image();
  spikeImage.src = '/src/static/png/gear.png';
  
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