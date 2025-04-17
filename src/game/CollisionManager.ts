import Matter from 'matter-js';
import { GameEngine } from './GameEngine';

export class CollisionManager {
  private engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.setupCollisions();
  }

  /**
   * 设置碰撞事件处理函数
   */
  private setupCollisions() {
    Matter.Events.on(this.engine.getEngine(), 'collisionStart', (event: any) => {
      this.processCollisionPairs(event.pairs);
    });
  }

  private processCollisionPairs(pairs: any[]) {
    for (let i = 0; i < pairs.length; i++) {
      this.processSingleCollision(pairs[i]);
    }
  }

  private processSingleCollision(pair: any) {
    // console.log('processSingleCollision:', pair);
    // 处理小球之间的碰撞
    this.handleBallBallCollision(pair);
    
    // 处理道具与边界的碰撞
    this.handlePowerUpBoundaryCollision(pair);
    
    // 处理球与墙的碰撞
    this.handleBallWallCollision(pair);
    
    // 处理小球与道具的碰撞
    this.handleBallPowerUpCollision(pair);
  }

  private handleBallBallCollision(pair: any) {
    const { bodyA, bodyB } = pair;
    
    // 检测小球之间的碰撞
    const isBallA = bodyA.label === 'p1Ball' || bodyA.label === 'p2Ball';
    const isBallB = bodyB.label === 'p1Ball' || bodyB.label === 'p2Ball';
    
    if (isBallA && isBallB) {
      console.log('Ball-ball collision detected');
      
      // 计算碰撞法向量 - 从A指向B的单位向量
      const normalVector = Matter.Vector.normalise({
        x: bodyB.position.x - bodyA.position.x,
        y: bodyB.position.y - bodyA.position.y
      });
      
      // 获取小球速度
      const velocityA = bodyA.velocity;
      const velocityB = bodyB.velocity;
      
      // 计算碰撞强度
      const speedA = Math.sqrt(velocityA.x ** 2 + velocityA.y ** 2);
      const speedB = Math.sqrt(velocityB.x ** 2 + velocityB.y ** 2);
      const collisionIntensity = Math.min(1, (speedA + speedB) / 20);
      
      // 设置动态反弹速度
      const baseSpeed = 12; // 提高基础反弹速度
      const speedMultiplier = 1.5; // 提高速度增强系数
      
      // 计算速度差异
      const speedDiff = Math.abs(speedA - speedB);
      const speedRatio = speedDiff / Math.max(speedA, speedB);
      const dynamicMultiplier = 1 + speedRatio; // 速度差异越大，反弹越强
      
      // 计算反弹后的速度
      const v1xAfter = -normalVector.x * baseSpeed * speedMultiplier * dynamicMultiplier;
      const v1yAfter = -normalVector.y * baseSpeed * speedMultiplier * dynamicMultiplier;
      const v2xAfter = normalVector.x * baseSpeed * speedMultiplier * dynamicMultiplier;
      const v2yAfter = normalVector.y * baseSpeed * speedMultiplier * dynamicMultiplier;
      
      // 设置两球的新速度，考虑原有速度的影响
      const momentumFactor = 0.3; // 动量保持因子
      Matter.Body.setVelocity(bodyA, {
        x: v1xAfter + velocityA.x * momentumFactor,
        y: v1yAfter + velocityA.y * momentumFactor
      });
      
      Matter.Body.setVelocity(bodyB, {
        x: v2xAfter + velocityB.x * momentumFactor,
        y: v2yAfter + velocityB.y * momentumFactor
      });
      
      // 如果碰撞强度较大，添加额外的速度
      if (collisionIntensity > 0.4) { // 降低触发阈值
        const extraSpeed = 2.0; // 提高额外速度
        const finalVelocityA = {
          x: (v1xAfter + velocityA.x * momentumFactor) * extraSpeed,
          y: (v1yAfter + velocityA.y * momentumFactor) * extraSpeed
        };
        const finalVelocityB = {
          x: (v2xAfter + velocityB.x * momentumFactor) * extraSpeed,
          y: (v2yAfter + velocityB.y * momentumFactor) * extraSpeed
        };
        
        Matter.Body.setVelocity(bodyA, finalVelocityA);
        Matter.Body.setVelocity(bodyB, finalVelocityB);
      }
      
      // 触发碰撞视觉效果
      this.createCollisionEffect(
        (bodyA.position.x + bodyB.position.x) / 2,
        (bodyA.position.y + bodyB.position.y) / 2,
        collisionIntensity
      );
    }
  }

  // 添加碰撞视觉效果方法
  public createCollisionEffect(x: number, y: number, intensity: number) {
    // 如果游戏引擎没有运行，不创建效果
    if (!this.engine.getIsRunning()) return;
    
    // 创建粒子效果
    const particleCount = Math.floor(intensity * 10) + 3; // 3-13个粒子
    const particleSize = 2 + intensity * 3; // 2-5像素
    const particleLifetime = 500; // 500毫秒
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + intensity * 3; // 1-4像素/帧
      const particle = Matter.Bodies.circle(
        x, 
        y, 
        particleSize, 
        {
          isSensor: true,
          isStatic: false,
          frictionAir: 0.1,
          render: {
            fillStyle: `rgba(255, 255, 255, ${0.7 * intensity})`,
            opacity: 0.7
          },
          collisionFilter: {
            group: -1, // 不与任何物体碰撞
            category: 0x0008,
            mask: 0
          },
          label: 'collisionParticle'
        }
      );
      
      // 设置粒子速度
      Matter.Body.setVelocity(particle, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      });
      
      // 添加到世界
      Matter.World.add(this.engine.getEngine().world, particle);
      
      // 设置粒子生命周期
      setTimeout(() => {
        if (this.engine && this.engine.getEngine()) {
          Matter.World.remove(this.engine.getEngine().world, particle);
        }
      }, particleLifetime);
    }
    
    // 如果碰撞强度足够大，添加冲击波效果
    if (intensity > 0.6) {
      const shockwave = Matter.Bodies.circle(
        x,
        y,
        1, // 初始半径很小
        {
          isSensor: true,
          isStatic: true,
          render: {
            fillStyle: 'transparent',
            strokeStyle: `rgba(255, 255, 255, ${0.5 * intensity})`,
            lineWidth: 2
          },
          collisionFilter: {
            group: -1,
            category: 0x0008,
            mask: 0
          },
          label: 'shockwave'
        }
      );
      
      Matter.World.add(this.engine.getEngine().world, shockwave);
      
      // 动画扩展冲击波
      let radius = 1;
      const maxRadius = 30 * intensity;
      const expandInterval = setInterval(() => {
        radius += 2;
        Matter.Body.scale(shockwave, 1.2, 1.2);
        
        if (radius >= maxRadius || !this.engine.getIsRunning()) {
          clearInterval(expandInterval);
          Matter.World.remove(this.engine.getEngine().world, shockwave);
        }
      }, 16);
    }
  }

  private handlePowerUpBoundaryCollision(pair: any) {
    const { bodyA, bodyB } = pair;
    
    if ((bodyA === this.engine.getSpikeItem() || bodyA === this.engine.getHeartItem()) &&
      (this.engine.getBoundaries().includes(bodyB) || bodyB.isWall)) {
      console.log('PowerUp-boundary collision detected');
    } else if ((bodyB === this.engine.getSpikeItem() || bodyB === this.engine.getHeartItem()) &&
      (this.engine.getBoundaries().includes(bodyA) || bodyA.isWall)) {
      console.log('PowerUp-boundary collision detected');
    }
  }

  private handleBallWallCollision(pair: any) {
    const { bodyA, bodyB } = pair;
    
    // 确定哪个是球，哪个是墙
    let ball = null;
    let wall = null;
    
    if (bodyA.isWall) {
      wall = bodyA;
      ball = bodyB;
    } else if (bodyB.isWall) {
      wall = bodyB;
      ball = bodyA;
    } else {
      return; // 如果没有墙体参与碰撞，直接返回
    }
    
    // 确认是否为小球
    if (ball.label !== 'p1Ball' && ball.label !== 'p2Ball') {
      return; // 如果不是玩家的球，直接返回
    }
    
    // 获取球的当前速度和位置
    const velocity = ball.velocity;
    const position = ball.position;
    
    // 确定墙的方向（上、下、左、右）
    const wallBounds = wall.bounds || { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    const isHorizontalWall = (wallBounds.max.y - wallBounds.min.y) < (wallBounds.max.x - wallBounds.min.x);
    
    // 获取边框的当前偏移量
    const borderOffset = this.engine.getBorderOffset();
    
    // 计算反弹后的速度，考虑边框的移动
    let newVelocity = { x: velocity.x, y: velocity.y };
    const restitution = 1.0; // 完全弹性碰撞
    
    if (isHorizontalWall) {
      // 水平墙（上/下），反转y方向速度
      newVelocity.y = -velocity.y * restitution;
      // 如果边框正在移动，增加额外的速度分量
      if (borderOffset !== this.engine.getInitialBorderOffset()) {
        const borderMovementSpeed = 0.1; // 边框移动速度影响因子
        newVelocity.x += (borderOffset - this.engine.getInitialBorderOffset()) * borderMovementSpeed;
      }
    } else {
      // 垂直墙（左/右），反转x方向速度
      newVelocity.x = -velocity.x * restitution;
      // 如果边框正在移动，增加额外的速度分量
      if (borderOffset !== this.engine.getInitialBorderOffset()) {
        const borderMovementSpeed = 0.1; // 边框移动速度影响因子
        newVelocity.y += (borderOffset - this.engine.getInitialBorderOffset()) * borderMovementSpeed;
      }
    }
    
    // 应用新的速度
    Matter.Body.setVelocity(ball, newVelocity);
    
    // 确保球不会卡在墙内
    const radius = ball.circleRadius || 20;
    const buffer = 2; // 小缓冲区
    
    // 根据墙的位置调整球的位置，考虑边框偏移量
    if (isHorizontalWall) {
      // 上墙
      if (wallBounds.min.y <= borderOffset + buffer) {
        Matter.Body.setPosition(ball, {
          x: position.x,
          y: wallBounds.max.y + radius + buffer
        });
      }
      // 下墙
      else {
        Matter.Body.setPosition(ball, {
          x: position.x,
          y: wallBounds.min.y - radius - buffer
        });
      }
    } else {
      // 左墙
      if (wallBounds.min.x <= borderOffset + buffer) {
        Matter.Body.setPosition(ball, {
          x: wallBounds.max.x + radius + buffer,
          y: position.y
        });
      }
      // 右墙
      else {
        Matter.Body.setPosition(ball, {
          x: wallBounds.min.x - radius - buffer,
          y: position.y
        });
      }
    }
    
    // 创建碰撞效果
    const collisionSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const collisionIntensity = Math.min(1, collisionSpeed / 10);
    this.createCollisionEffect(
      position.x,
      position.y,
      collisionIntensity
    );
  }

  private handleBallPowerUpCollision(pair: any) {
    const { bodyA, bodyB } = pair;
    const labelA = bodyA.label || '';
    const labelB = bodyB.label || '';

    // 确定哪个是球，哪个是道具
    let ball = null;
    let powerUp = null;
    let powerUpType = '';

    if (labelA === 'p1Ball' || labelA === 'p2Ball') {
      ball = bodyA;
      powerUp = bodyB;
      powerUpType = labelB;
    } else if (labelB === 'p1Ball' || labelB === 'p2Ball') {
      ball = bodyB;
      powerUp = bodyA;
      powerUpType = labelA;
    } else {
      return; // 如果没有球参与碰撞，直接返回
    }

    // 获取球的当前速度
    const velocity = ball.velocity;
    const currentSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

    // 处理不同类型的道具效果
    switch (powerUpType) {
      case 'spikeItem':
        // 加速效果
        const speedBoost = 1.5;
        Matter.Body.setVelocity(ball, {
          x: velocity.x * speedBoost,
          y: velocity.y * speedBoost
        });
        break;

      case 'heartItem':
        // 减速效果
        const slowdown = 0.7;
        Matter.Body.setVelocity(ball, {
          x: velocity.x * slowdown,
          y: velocity.y * slowdown
        });
        break;
    }

    // 移除道具
    if (powerUp && this.engine.getEngine()) {
      Matter.World.remove(this.engine.getEngine().world, powerUp);
    }

    // 创建道具拾取效果
    this.createCollisionEffect(
      powerUp.position.x,
      powerUp.position.y,
      0.8 // 固定的效果强度
    );
  }


}