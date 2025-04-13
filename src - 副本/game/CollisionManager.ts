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
    const { bodyA, bodyB } = pair;
    
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
    
    // 检测是否是小球之间的碰撞
    if ((bodyA.label === 'p1Ball' || bodyA.label === 'p2Ball') && 
        (bodyB.label === 'p1Ball' || bodyB.label === 'p2Ball')) {
      
      // 计算两球中心连线方向
      const direction = {
        x: bodyB.position.x - bodyA.position.x,
        y: bodyB.position.y - bodyA.position.y
      };
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      const normalizedDirection = {
        x: direction.x / length,
        y: direction.y / length
      };
      
      // 交换两球的速度向量并增加一个额外的分离力
      const tempVelocity = { ...bodyA.velocity };
      const separationForce = 0.5; // 分离力系数
      
      // 根据index (3).html的逻辑，直接交换速度并添加分离力
      Matter.Body.setVelocity(bodyA, { 
        x: bodyB.velocity.x + normalizedDirection.x * separationForce, 
        y: bodyB.velocity.y + normalizedDirection.y * separationForce 
      });
      Matter.Body.setVelocity(bodyB, { 
        x: tempVelocity.x - normalizedDirection.x * separationForce, 
        y: tempVelocity.y - normalizedDirection.y * separationForce 
      });
      
      // 确保速度在合理范围内
      this.engine.enforceBallSpeed(bodyA);
      this.engine.enforceBallSpeed(bodyB);
    }
  }

  private handlePowerUpBoundaryCollision(pair: any) {
    const { bodyA, bodyB } = pair;
    
    if ((bodyA === this.engine.spikeItem || bodyA === this.engine.heartItem) &&
      (this.engine.boundaries.includes(bodyB) || bodyB.isWall)) {
      const powerUp = bodyA === this.engine.spikeItem ? this.engine.spikeItem : this.engine.heartItem;
      if (confirm('道具与边界发生碰撞，是否重新生成位置？')) {
        const newPos = this.engine.getRandomPowerUpPosition();
        Matter.Body.setPosition(powerUp, newPos);
        Matter.Body.setVelocity(powerUp, { x: 0, y: 0 });
      }
    } else if ((bodyB === this.engine.spikeItem || bodyB === this.engine.heartItem) &&
      (this.engine.boundaries.includes(bodyA) || bodyA.isWall)) {
      const powerUp = bodyB === this.engine.spikeItem ? this.engine.spikeItem : this.engine.heartItem;
      if (confirm('道具与边界发生碰撞，是否重新生成位置？')) {
        const newPos = this.engine.getRandomPowerUpPosition();
        Matter.Body.setPosition(powerUp, newPos);
        Matter.Body.setVelocity(powerUp, { x: 0, y: 0 });
      }
    }
  }

  private handleBallWallCollision(pair: any) {
    const { bodyA, bodyB } = pair;
    
    if ((bodyA.isWall || bodyB.isWall)) {
      const wall = bodyA.isWall ? bodyA : bodyB;
      const ball = bodyA.isWall ? bodyB : bodyA;

      // 检测实际碰撞距离
      const collision = Matter.Collision.collides(ball, wall);
      if (!collision || collision.depth < 1) {
        return; // 没有实际碰撞或碰撞深度不足
      }

      // 随机选择新颜色
      let newColor;
      do {
        newColor = this.engine.boundaryColors[
          Math.floor(Math.random() * this.engine.boundaryColors.length)
        ];
      } while (newColor === this.engine.currentBoundaryColor);

      this.engine.currentBoundaryColor = newColor;
      this.engine.boundaries.forEach(boundary => {
        boundary.render.fillStyle = this.engine.currentBoundaryColor;

      });

      Matter.Body.setVelocity(ball, {
        x: -ball.velocity.x,
        y: -ball.velocity.y
      });
      this.engine.enforceBallSpeed(ball);
    }
  }

  private handleBallPowerUpCollision(pair: any) {
    const { bodyA, bodyB } = pair;
    const labelA = bodyA.label || '';
    const labelB = bodyB.label || '';

    // 检测小球与尖刺道具碰撞
    if (labelA === 'spikeItem' || labelB === 'spikeItem') {
      const ball = labelA === 'spikeItem' ? bodyB : bodyA;
      const item = labelA === 'spikeItem' ? bodyA : bodyB;

      if (ball === this.engine.p1Ball && this.engine.p2HasSpikes) {
        this.engine.removeSpikesFromBall(this.engine.p2Ball);
      } else if (ball === this.engine.p2Ball && this.engine.p1HasSpikes) {
        this.engine.removeSpikesFromBall(this.engine.p1Ball);
      }

      this.engine.applySpikesToBall(ball);
      Matter.World.remove(this.engine.engine.world, item);

      if (this.engine.spikeItem === item) {
        this.engine.spikeItem = null;
        this.engine.lastSpikeRemovedTime = Date.now();
        this.engine.createSpikeItem();
      }
    }
    
    // 检测小球与爱心道具碰撞
    else if (labelA === 'heartItem' || labelB === 'heartItem') {
      const ball = labelA === 'heartItem' ? bodyB : bodyA;
      const item = labelA === 'heartItem' ? bodyA : bodyB;

      if (ball === this.engine.p1Ball && this.engine.p1Lives < 5) {
        this.engine.p1Lives++;
        this.engine.updateBallSize(this.engine.p1Ball, this.engine.p1Lives);
        if (this.engine.onLivesUpdateCallback) {
          this.engine.onLivesUpdateCallback(this.engine.p1Lives, this.engine.p2Lives);
        }
      } else if (ball === this.engine.p2Ball && this.engine.p2Lives < 5) {
        this.engine.p2Lives++;
        this.engine.updateBallSize(this.engine.p2Ball, this.engine.p2Lives);
        if (this.engine.onLivesUpdateCallback) {
          this.engine.onLivesUpdateCallback(this.engine.p1Lives, this.engine.p2Lives);
        }
      }

      Matter.World.remove(this.engine.engine.world, item);
      if (this.engine.heartItem === item) {
        this.engine.heartItem = null;
        this.engine.lastHeartRemovedTime = Date.now();
        this.engine.createHeartItem();
      }
    }
  }


}