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
    Matter.Events.on(this.engine.engine, 'collisionStart', (event: any) => {
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
    if ((bodyA.label === 'p1Ball' || bodyA.label === 'p2Ball') && 
        (bodyB.label === 'p1Ball' || bodyB.label === 'p2Ball')) {
      console.log('Ball-ball collision detected');
      
      // 计算碰撞角度
      const angle = Math.atan2(bodyB.position.y - bodyA.position.y, bodyB.position.x - bodyA.position.x);
      
      // 设置速度变化系数
      const speedChange = 0.2;
      
      // 计算新的速度向量
      const speedAX = bodyA.velocity.x * (1 - speedChange) * Math.cos(angle);
      const speedAY = bodyA.velocity.y * (1 - speedChange) * Math.sin(angle);
      const speedBX = bodyB.velocity.x * (1 + speedChange) * Math.cos(angle + Math.PI);
      const speedBY = bodyB.velocity.y * (1 + speedChange) * Math.sin(angle + Math.PI);
      
      // 应用新的速度
      Matter.Body.setVelocity(bodyA, {
        x: speedAX,
        y: speedAY
      });
      
      Matter.Body.setVelocity(bodyB, {
        x: speedBX,
        y: speedBY
      });
    }
  }

  private handlePowerUpBoundaryCollision(pair: any) {
    const { bodyA, bodyB } = pair;
    
    if ((bodyA === this.engine.spikeItem || bodyA === this.engine.heartItem) &&
      (this.engine.boundaries.includes(bodyB) || bodyB.isWall)) {
      console.log('PowerUp-boundary collision detected');
    } else if ((bodyB === this.engine.spikeItem || bodyB === this.engine.heartItem) &&
      (this.engine.boundaries.includes(bodyA) || bodyA.isWall)) {
      console.log('PowerUp-boundary collision detected');
    }
  }

  private handleBallWallCollision(pair: any) {
    const { bodyA, bodyB } = pair;
    if ((bodyA.isWall || bodyB.isWall)) {
      console.log('Ball-wall collision detected');
    }
  }

  private handleBallPowerUpCollision(pair: any) {
    const { bodyA, bodyB } = pair;
    const labelA = bodyA.label || '';
    const labelB = bodyB.label || '';

    // 检测小球与尖刺道具碰撞
    if (labelA === 'spikeItem' || labelB === 'spikeItem') {
      console.log('Ball-spikeItem collision detected');
    }
    
    // 检测小球与爱心道具碰撞
    else if (labelA === 'heartItem' || labelB === 'heartItem') {
      console.log('Ball-heartItem collision detected');
    }
  }


}