import Matter from 'matter-js'
import { createHeartItem, createSpikeItem, setupSpikeRotation } from './PowerUpManager'
import { CollisionManager } from './CollisionManager'
export class GameEngine {
  private engine: Matter.Engine
  private render: Matter.Render
  private runner: Matter.Runner
  private canvas: HTMLCanvasElement
  private collisionManager: CollisionManager | null = null
  private p1Ball: Matter.Body
  private p2Ball: Matter.Body
  private boundaries: Matter.Body[] = []
  private isRunning: boolean = false
  private onLivesUpdateCallback: ((p1Lives: number, p2Lives: number) => void) | null = null

  // 获取游戏运行状态
  public getIsRunning(): boolean {
    return this.isRunning;
  }

  // 获取物理引擎实例
  public getEngine(): Matter.Engine {
    return this.engine;
  }

  // 获取尖刺道具
  public getSpikeItem(): Matter.Body | null {
    return this.spikeItem;
  }

  // 获取爱心道具
  public getHeartItem(): Matter.Body | null {
    return this.heartItem;
  }

  // 获取边界
  public getBoundaries(): Matter.Body[] {
    return this.boundaries;
  }
  private p1Lives: number = 1  //小球生命值
  private p2Lives: number = 1
  private gameWidth: number
  private gameHeight: number
  

  
  private initialCanvasSize: number; // 初始画布尺寸（假设画布是正方形）

  // 道具相关
  private spikeItem: Matter.Body | null = null
  private heartItem: Matter.Body | null = null
  private spikeItemImage: HTMLImageElement | null = null
  private heartItemImage: HTMLImageElement | null = null
  private p1HasSpikes: boolean = false
  private p2HasSpikes: boolean = false
  private itemSpawnInterval: number | null = null
  private lastSpikeRemovedTime: number = 0
  private lastHeartRemovedTime: number = 0


  // 边框颜色
  private readonly boundaryColors: string[] = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
  ]
  private currentBoundaryColor: string = this.boundaryColors[0];

  // 添加图片缓存属性
  private imageCache: Record<string, HTMLImageElement> = {}

  private iconCache: Map<string, HTMLImageElement>

  private shrinkDuration: number = 120000; // 缩小持续时间（2分钟）
  private shrinkStartTime: number | null = null; // 缩小开始时间


  private borderOffset: number = 0; // 当前边框线偏移量
  private initialBorderOffset: number = 0; // 初始边框线偏移量
  private targetBorderOffset: number = 0; // 目标边框线偏移量（移动到中心）

  // 获取当前边框偏移量
  public getBorderOffset(): number {
    return this.borderOffset;
  }

  // 获取初始边框偏移量
  public getInitialBorderOffset(): number {
    return this.initialBorderOffset;
  }


  private balls: Matter.Body[] = []
  private lives: number = 3; // 初始生命值
  private isGameOver: boolean = false; // 游戏是否结束

  private togglePause() {
    if (this.isGameOver) return;
    
    this.isRunning = !this.isRunning;
    if (this.isRunning) {
      Matter.Runner.run(this.runner, this.engine);
    } else {
      Matter.Runner.stop(this.runner);
    }
  }

  private gameOver(loser: 'p1' | 'p2') {

    console.log(this.engine)


    console.log(`游戏结束！玩家${loser === 'p1' ? '2' : '1'}获胜！`);
    this.isGameOver = true;
    this.isRunning = false;

    // 移除失败方的小球
    if (loser === 'p1') {
      Matter.World.remove(this.engine.world, this.p1Ball);
    } else {
      Matter.World.remove(this.engine.world, this.p2Ball);
    }

    // 停止游戏循环
    Matter.Runner.stop(this.runner);

    // 显示游戏结束信息
    alert(`游戏结束！玩家${loser === 'p1' ? '2' : '1'}获胜！`);
  }

  private p1BallImage: HTMLImageElement | null;
  private p2BallImage: HTMLImageElement | null;


  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.gameWidth = canvas.width
    this.gameHeight = canvas.height
    this.initialCanvasSize = 800; // 初始画布尺寸
    this.initialBorderOffset = 0; // 初始边框线偏移量
    this.borderOffset = this.initialBorderOffset;
    
    // 添加键盘事件监听
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.togglePause();
      }
    });
    this.targetBorderOffset = (this.canvas.width - 50) / 2; // 目标边框线偏移量（移动到中心）
    
    // 初始化玩家1的小球图片
    this.p1BallImage = new Image();
    // this.p1BallImage.src = '/src/static/headPortrait/t1.jpg';
    this.p1BallImage.onload = () => {
        console.log('玩家1图片加载完成');
    };
    this.p1BallImage.onerror = () => {
        console.error('玩家1图片加载失败');
        this.p1BallImage = null;
    };
    
    // 初始化玩家2的小球图片
    this.p2BallImage = new Image();
    // this.p2BallImage.src = '/src/static/headPortrait/t2.jpg';
    this.p2BallImage.onload = () => {
        console.log('玩家2图片加载完成');
    };
    this.p2BallImage.onerror = () => {
        console.error('玩家2图片加载失败');
        this.p2BallImage = null;
    };

    // 初始化 engine
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
      positionIterations: 6,
      velocityIterations: 4
    })
    // 初始化渲染器
    this.render = Matter.Render.create({
      canvas: this.canvas,
      engine: this.engine,
      options: {
        width: this.gameWidth,
        height: this.gameHeight,
        wireframes: false,
        background: '#000000'
      }
    })

    
    // 尝试获取保存的球图标
    const savedIconUrl = localStorage.getItem('currentBallIcon')

    // 计算小球初始位置和大小
    const ballRadius = this.getBallRadius(1) // 初始半径
    const xOffset = this.gameWidth * 0.25
    const yOffset = this.gameHeight * 0.5

    // 创建小球 - 确保是正圆
    // 创建大圆用于碰撞检测
    const outerBall = Matter.Bodies.circle(xOffset, yOffset, ballRadius, {
      restitution: 0.9,
      friction: 0,
      frictionAir: 0,
      density: 0.008,
      label: 'p1Ball'
    });
    
    // 创建小圆用于显示图片
    const innerBall = Matter.Bodies.circle(xOffset, yOffset, ballRadius * 0.7, {
      isStatic: false,
      isSensor: true,
      collisionFilter: { group: -1 },
      label: 'p1BallInner'
    });
    
    // 将两个圆组合成复合体
    this.p1Ball = Matter.Body.create({
      parts: [outerBall, innerBall],
      isStatic: false
    });

    // 创建大圆用于碰撞检测
    const outerBall2 = Matter.Bodies.circle(this.gameWidth - xOffset, yOffset, ballRadius, {
      restitution: 0.9,
      friction: 0,
      frictionAir: 0,
      density: 0.008,
      label: 'p2Ball'
    });
    
    // 创建小圆用于显示图片
    const innerBall2 = Matter.Bodies.circle(this.gameWidth - xOffset, yOffset, ballRadius * 0.7, {
      isStatic: false,
      isSensor: true,
      collisionFilter: { group: -1 },
      label: 'p2BallInner'
    });
    
    // 将两个圆组合成复合体
    this.p2Ball = Matter.Body.create({
      parts: [outerBall2, innerBall2],
      isStatic: false
    });

    // // 创建边界
    // this.createBoundaries()

    // 添加所有物体到世界
    Matter.World.add(this.engine.world, [
      ...this.boundaries,
      this.p1Ball,
      this.p2Ball
    ])

    // 创建运行器
    this.runner = Matter.Runner.create()


    // 设置碰撞检测
    this.setupCollisions()

    // 添加定期执行的更新确保速度稳定
    Matter.Events.on(this.engine, 'beforeUpdate', () => {
      if (!this.isRunning) return

      // 强制保持球速稳定
      this.enforceBallSpeed(this.p1Ball)
      this.enforceBallSpeed(this.p2Ball)

      // 确保小球在画布内
      this.ensureBallsInsideCanvas(this.p1Ball)
      this.ensureBallsInsideCanvas(this.p2Ball)
    })

    // 添加自定义渲染函数，处理小球图片
    Matter.Events.on(this.render, 'afterRender', () => {
      if (!this.isRunning) return

      // 如果有自定义图标，绘制到小球上
      if (savedIconUrl) {
        this.drawImageOnBall(this.p1Ball, savedIconUrl)
        this.drawImageOnBall(this.p2Ball, savedIconUrl)
      } else {
        // 如果没有自定义图标，使用默认渲染
        this.renderDefaultBall(this.p1Ball, this.p1BallImage)
        this.renderDefaultBall(this.p2Ball, this.p2BallImage)
      }
    })
    this.iconCache = new Map()
    // 预加载图标
    this.preloadIcons()
  }

  public renderDefaultBall(ball: Matter.Body, ballImage: HTMLImageElement | null) {
    if (!ball || !this.render.context) return;

    const ctx = this.render.context;
    const pos = ball.position;
    const [outerBall, innerBall] = ball.parts;
    const outerRadius = outerBall.circleRadius || 20;
    const innerRadius = innerBall?.circleRadius || outerRadius * 0.7;

    // 绘制外圆（碰撞检测用）
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = outerBall.render.fillStyle || '#0088ff';
    ctx.fill();

    // 绘制内圆图片
    if (ballImage) {
      if (ballImage.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, innerRadius, 0, Math.PI * 2);
        ctx.clip();
        
        ctx.drawImage(
          ballImage,
          pos.x - innerRadius,
          pos.y - innerRadius,
          innerRadius * 2,
          innerRadius * 2
        );
        
        ctx.restore();
      } else {
        // 如果图片未加载完成，绘制默认颜色
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = ball === this.p1Ball ? '#0088ff' : '#ff4444';
        ctx.fill();
      }
    } else {
      // 如果没有图片，绘制默认颜色
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = ball === this.p1Ball ? '#0088ff' : '#ff4444';
      ctx.fill();
    }
  }
  // 根据生命值计算球的半径
  private getBallRadius(lives: number): number {
    const baseRadius = 15 // 基础半径
    const lifeBonus = 2.5 // 每条命增加的半径(更平滑的变化)
    const maxRadius = 30 // 最大半径
    const minRadius = 10 // 最小半径
    return Math.min(Math.max(baseRadius + lives * lifeBonus, minRadius), maxRadius) // 限制尺寸范围
  }

  // 修改速度控制函数
  private enforceBallSpeed(ball: Matter.Body) {
    const velocity = ball.velocity
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
    const targetSpeed = 5.5

    // 如果几乎静止，给一个随机方向的速度
    if (speed < 0.1) {
      const angle = Math.random() * Math.PI * 2
      Matter.Body.setVelocity(ball, {
        x: Math.cos(angle) * targetSpeed,
        y: Math.sin(angle) * targetSpeed
      })
      return
    }

    // 直接设置固定速度
    const scaleFactor = targetSpeed / speed
    Matter.Body.setVelocity(ball, {
      x: velocity.x * scaleFactor,
      y: velocity.y * scaleFactor
    })

  }

  private getRandomPowerUpPosition(): { x: number, y: number } {

    const boundary = this.borderOffset || 50;
    const itemSize = 50; // 道具尺寸
    const margin = 30; // 距离边框的距离

    // 计算有效区域，确保道具生成在距离边框30px以内的区域
    const minX = boundary + margin;
    const maxX = boundary + margin + itemSize;
    const minY = boundary + margin;
    const maxY = boundary + margin + itemSize;
    
    // 计算四个边缘区域
    const leftArea = { minX: boundary + margin, maxX: boundary + margin + itemSize, minY: boundary + margin, maxY: this.gameHeight - boundary - margin };
    const rightArea = { minX: this.gameWidth - boundary - margin - itemSize, maxX: this.gameWidth - boundary - margin, minY: boundary + margin, maxY: this.gameHeight - boundary - margin };
    const topArea = { minX: boundary + margin, maxX: this.gameWidth - boundary - margin, minY: boundary + margin, maxY: boundary + margin + itemSize };
    const bottomArea = { minX: boundary + margin, maxX: this.gameWidth - boundary - margin, minY: this.gameHeight - boundary - margin - itemSize, maxY: this.gameHeight - boundary - margin };

    // 确保有效区域存在
    if (minX >= maxX || minY >= maxY) {
      return {
        x: this.gameWidth / 2,
        y: this.gameHeight / 2
      };
    }

    // 随机选择一个边缘区域生成道具
    const areas = [leftArea, rightArea, topArea, bottomArea];
    const selectedArea = areas[Math.floor(Math.random() * areas.length)];
    
    // 在选定的边缘区域内生成随机位置
    const pos = {
      x: Math.random() * (selectedArea.maxX - selectedArea.minX) + selectedArea.minX,
      y: Math.random() * (selectedArea.maxY - selectedArea.minY) + selectedArea.minY
    };

    // 最终边界检查
    if (pos.x < boundary + itemSize / 2 || pos.x > this.gameWidth - boundary - itemSize / 2 ||
      pos.y < boundary + itemSize / 2 || pos.y > this.gameHeight - boundary - itemSize / 2) {
      return this.getRandomPowerUpPosition();
    }

    return pos;
  }

  private createBoundaries() {
    // 先移除旧的边界物体
    if (this.boundaries.length > 0) {
      Matter.World.remove(this.engine.world, this.boundaries);
      this.boundaries = [];
    }

    // 边框粗细 - 改为更细的边框
    const thickness = 3; // 从10改为5

    // 计算当前边界偏移量
    const offset = this.borderOffset || 0;
    const currentWidth = this.gameWidth - offset * 2;
    const currentHeight = this.gameHeight - offset * 2;

    // 创建边框，确保完全覆盖画布边缘
    // 上边界
    const topBoundary = Matter.Bodies.rectangle(
      this.gameWidth / 2,
      offset, // 顶部对齐
      currentWidth, // 宽度与画布匹配
      thickness, // 使用更细的边框
      { isStatic: true, render: { fillStyle: this.currentBoundaryColor } }
    );

    // 下边界
    const bottomBoundary = Matter.Bodies.rectangle(
      this.gameWidth / 2,
      this.gameHeight - offset, // 底部对齐
      currentWidth, // 宽度与画布匹配
      thickness, // 使用更细的边框
      { isStatic: true, render: { fillStyle: this.currentBoundaryColor } }
    );

    // 左边界
    const leftBoundary = Matter.Bodies.rectangle(
      offset, // 左侧对齐
      this.gameHeight / 2,
      thickness, // 使用更细的边框
      currentHeight, // 高度与画布匹配
      { isStatic: true, render: { fillStyle: this.currentBoundaryColor } }
    );

    // 右边界
    const rightBoundary = Matter.Bodies.rectangle(
      this.gameWidth - offset, // 右侧对齐
      this.gameHeight / 2,
      thickness, // 使用更细的边框
      currentHeight, // 高度与画布匹配
      { isStatic: true, render: { fillStyle: this.currentBoundaryColor } }
    );

    this.boundaries = [topBoundary, bottomBoundary, leftBoundary, rightBoundary];

    // 给边界添加标识
    this.boundaries.forEach((boundary, index) => {
      boundary.label = `boundary-${index}`;
      boundary.isWall = true; // 自定义属性标识墙体
    });
console.log('监测边界')
    // 添加新的边界物体到世界
    Matter.World.add(this.engine.world, this.boundaries);
  }



  public changeBallImage(ball: 'p1' | 'p2', imageUrl: string) {
    const targetBall = ball === 'p1' ? this.p1Ball : this.p2Ball;
    if (targetBall) {
      this.drawImageOnBall(targetBall, imageUrl);
      Matter.Render.world(this.render);
    }
  }

  public startBorderShrink() {
    console.log('开始边框缩放');
    const shrinkDuration = 100000; // 5分钟
    this.shrinkStartTime = Date.now();
    this.initialBorderOffset = 0;
    this.targetBorderOffset = (this.gameWidth - 50) / 2; // 收缩至50px区域
    this.shrinkDuration = shrinkDuration;

    // 移除现有边界
    // if (this.boundaries.length > 0) {
    //   Matter.World.remove(this.engine.world, this.boundaries);
    //   this.boundaries = [];
    // }

    // 立即调用一次更新边界
    // this.updateBorderOffset();



  }

  // 创建尖刺道具
  private createSpikeItem() {
    if (this.spikeItem) return
    // 使用增强随机性的方法获取位置
    const pos = this.getRandomPowerUpPosition();

    this.spikeItem = createSpikeItem(pos.x, pos.y);
    setupSpikeRotation(this.engine, this.spikeItem, this.isRunning);

    // 将尖刺道具添加到世界
    Matter.World.add(this.engine.world, this.spikeItem)

    console.log('Spike item created at', pos.x, pos.y)
  }

  // 创建爱心道具
  private createHeartItem() {
    if (this.heartItem) return

    const pos = this.getRandomPowerUpPosition();
    
    // 移除旧爱心道具（如果存在）
    if (this.heartItem) {
      Matter.World.remove(this.engine.world, this.heartItem);
      this.heartItem = null;
    }
    
    this.heartItem = createHeartItem(pos.x, pos.y);
    
    // 将爱心道具添加到世界
    Matter.World.add(this.engine.world, this.heartItem)
    
    console.log('Heart item created at', pos.x, pos.y)
  }

  // 给小球应用尖刺效果
  private applySpikesToBall(ball: Matter.Body) {
    if (ball === this.p1Ball) {
      this.p1HasSpikes = true
      
      // 设置小球边框为透明
      ball.render.strokeStyle = 'transparent';
      
      // 创建复合体使背景球与小球完全同步
      const radius = ball.circleRadius || 25;
      const bgBall = Matter.Bodies.circle(ball.position.x, ball.position.y, radius, {
        isStatic: false,
        isSensor: true,
        collisionFilter: { group: -1 },
        render: {
          fillStyle: 'transparent',
          strokeStyle: '#00ff00',
          lineWidth: 2
        },
        label: ball === this.p1Ball ? 'p1BgBall' : 'p2BgBall'
      });
      
      // 将小球和背景球组合成复合体
      const composite = Matter.Body.create({
        parts: [ball, bgBall],
        isStatic: false
      });
      
      // 移除原小球并添加复合体
      Matter.World.remove(this.engine.world, ball);
      Matter.World.add(this.engine.world, composite);
      
      // 更新小球引用
      if (ball === this.p1Ball) {
        this.p1Ball = composite;
      } else {
        this.p2Ball = composite;
      }
      
      console.log('Applied spikes to ' + (ball === this.p1Ball ? 'P1' : 'P2'))
    } else if (ball === this.p2Ball) {
      this.p2HasSpikes = true
      
      // 创建复合体使背景球与小球完全同步
      const radius = ball.circleRadius || 25;
      const bgBall = Matter.Bodies.circle(ball.position.x, ball.position.y, radius, {
        isStatic: false,
        isSensor: true,
        collisionFilter: { group: -1 },
        render: {
          fillStyle: 'transparent',
          strokeStyle: '#00ff00',
          lineWidth: 2
        },
        label: ball === this.p1Ball ? 'p1BgBall' : 'p2BgBall'
      });
      
      // 将小球和背景球组合成复合体
      const composite = Matter.Body.create({
        parts: [ball, bgBall],
        isStatic: false
      });
      
      // 移除原小球并添加复合体
      Matter.World.remove(this.engine.world, ball);
      Matter.World.add(this.engine.world, composite);
      
      // 更新小球引用
      if (ball === this.p1Ball) {
        this.p1Ball = composite;
      } else {
        this.p2Ball = composite;
      }
      
      console.log('Applied spikes to ' + (ball === this.p1Ball ? 'P1' : 'P2'))
    }
  }

  // 移除小球尖刺效果
  private removeSpikesFromBall(ball: Matter.Body) {
    if (ball === this.p1Ball) {
      this.p1HasSpikes = false
      ball.render.strokeStyle = 'transparent'
      ball.render.fillStyle = ball === this.p1Ball ? '#0088ff' : '#ff4444'
      
      // 移除所有背景球
      this.engine.world.bodies.forEach(body => {
        if (body.label === 'p1BgBall') {
          Matter.World.remove(this.engine.world, body)
        }
      })
      
      console.log('Removed spikes from P1')
    } else if (ball === this.p2Ball) {
      this.p2HasSpikes = false
      ball.render.strokeStyle = 'transparent'
      ball.render.fillStyle = ball === this.p1Ball ? '#0088ff' : '#ff4444'
      
      // 移除所有背景球
      this.engine.world.bodies.forEach(body => {
        if (body.label === 'p2BgBall') {
          Matter.World.remove(this.engine.world, body)
        }
      })
      
      console.log('Removed spikes from P2')
    }
  }

  // 更新小球大小
  private updateBallSize(ball: Matter.Body, lives: number) {
    // 根据生命值计算新半径
    const baseRadius = 10 // 基础半径
    const lifeBonus = 2 // 每条命增加的半径
    const newRadius = baseRadius + lives * lifeBonus

    // 获取当前半径
    const currentRadius = ball.circleRadius || 25

    // 计算缩放比例 - 确保X和Y方向相同
    const scale = newRadius / currentRadius

    // 应用缩放 - 使用相同的比例保持圆形
    Matter.Body.scale(ball, scale, scale)

    // 确保速度保持不变
    this.enforceBallSpeed(ball)

    console.log(`Updated ball size: lives=${lives}, radius=${newRadius}`)
  }

  // 确保小球在画布内
  private ensureBallsInsideCanvas(ball: Matter.Body) {
    const buffer = 5 // 添加一点缓冲区
    const radius = ball.circleRadius || 20
    let position = ball.position
    let velocity = ball.velocity
    let needsUpdate = false

    // 考虑边框偏移量
    const borderOffset = this.borderOffset || 0

    // 检查水平边界，考虑边框偏移
    if (position.x < borderOffset + radius + buffer) {
      position.x = borderOffset + radius + buffer
      velocity.x = Math.abs(velocity.x) * 0.95 // 反向，保持大部分速度
      // 如果边框正在移动，增加额外的速度分量
      if (borderOffset !== this.initialBorderOffset) {
        velocity.x += (borderOffset - this.initialBorderOffset) * 0.1
      }
      needsUpdate = true
    } else if (position.x > this.gameWidth - borderOffset - radius - buffer) {
      position.x = this.gameWidth - borderOffset - radius - buffer
      velocity.x = -Math.abs(velocity.x) * 0.95 // 反向，保持大部分速度
      // 如果边框正在移动，增加额外的速度分量
      if (borderOffset !== this.initialBorderOffset) {
        velocity.x -= (borderOffset - this.initialBorderOffset) * 0.1
      }
      needsUpdate = true
    }

    // 检查垂直边界，考虑边框偏移
    if (position.y < borderOffset + radius + buffer) {
      position.y = borderOffset + radius + buffer
      velocity.y = Math.abs(velocity.y) * 0.95 // 反向，保持大部分速度
      // 如果边框正在移动，增加额外的速度分量
      if (borderOffset !== this.initialBorderOffset) {
        velocity.y += (borderOffset - this.initialBorderOffset) * 0.1
      }
      needsUpdate = true
    } else if (position.y > this.gameHeight - borderOffset - radius - buffer) {
      position.y = this.gameHeight - borderOffset - radius - buffer
      velocity.y = -Math.abs(velocity.y) * 0.95 // 反向，保持大部分速度
      // 如果边框正在移动，增加额外的速度分量
      if (borderOffset !== this.initialBorderOffset) {
        velocity.y -= (borderOffset - this.initialBorderOffset) * 0.1
      }
      needsUpdate = true
    }

    // 如果需要更新位置
    if (needsUpdate) {
      Matter.Body.setPosition(ball, position)
      Matter.Body.setVelocity(ball, velocity)
      // 创建碰撞效果
      const collisionSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
      const collisionIntensity = Math.min(1, collisionSpeed / 10)
      if (this.collisionManager) {
        this.collisionManager.createCollisionEffect(
          position.x,
          position.y,
          collisionIntensity
        )
      }
    }
  }

      /**
       * 设置碰撞检测系统
       *
       * 该方法会创建一个新的 CollisionManager 实例，并传入当前实例作为参数，用于管理碰撞检测。
       */
  private setupCollisions() {
    this.collisionManager = new CollisionManager(this);
  }

  // 修改道具生成定时器函数
  private startItemSpawner() {
    // 立即生成第一个道具（随机选择尖刺或爱心）
    if (Math.random() < 0.5) {
      this.createSpikeItem()
    } else {
      this.createHeartItem()
    }

    // 设置定时器，每隔一段时间随机生成一个道具
    // this.itemSpawnInterval = window.setInterval(() => {
      // 随机选择要生成的道具类型
      // const itemType = Math.random() < 0.5 ? 'spike' : 'heart'

      // // 检查道具是否不存在且消失时间超过2秒
      // if (itemType === 'spike' && !this.spikeItem && Date.now() - this.lastSpikeRemovedTime > 2000) {
      //   this.createSpikeItem()
      // } else if (itemType === 'heart' && !this.heartItem && Date.now() - this.lastHeartRemovedTime > 2000) {
      //   this.createHeartItem()
      // }
    // }, 5000) // 每5秒尝试生成一次道具

    // 另一个定时器，专门用于确保两种道具都有机会生成
    setInterval(() => {
      // 如果没有尖刺道具且消失时间超过1秒，有30%概率生成
      if (!this.spikeItem && Date.now() - this.lastSpikeRemovedTime > 1000 && Math.random() < 0.3) {
        this.createSpikeItem()
      }

      // 如果没有爱心道具且消失时间超过1秒，有30%概率生成
      if (!this.heartItem && Date.now() - this.lastHeartRemovedTime > 1000 && Math.random() < 0.3) {
        this.createHeartItem()
      }
    }, 3000) // 每3秒检查一次
  }



  public start() {
    if (this.isRunning) return

    this.isRunning = true

    // 初始化时不设置速度，由startGame方法设置相向速度
    // 将速度设为0，确保游戏开始前小球静止
    Matter.Body.setVelocity(this.p1Ball, {
      x: 0,
      y: 0
    })
    
    Matter.Body.setVelocity(this.p2Ball, {
      x: 0,
      y: 0
    })

    // 启动物理引擎
    Matter.Runner.run(this.runner, this.engine)

    // 启动道具生成
    this.startItemSpawner()
  }

  public init() {
    // 只运行渲染器
    Matter.Render.run(this.render)
  }

  public resize(width: number, height: number) {
    // 计算正方形尺寸 - 取宽高的最小值确保是正方形
    const size = Math.min(width, height);

    // 更新保存的尺寸
    this.gameWidth = size;
    this.gameHeight = size;

    // 更新渲染器尺寸
    this.render.options.width = size;
    this.render.options.height = size;
    this.render.canvas.width = size;
    this.render.canvas.height = size;

    // 如果边界尚未创建，先创建边界
    if (this.boundaries.length === 0) {
      this.createBoundaries();
    }

    // // 更新边界位置，确保覆盖画布边缘和角落
    // Matter.Body.setPosition(this.boundaries[0], {
    //   x: size / 2,
    //   y: 0
    // });
    // Matter.Body.setPosition(this.boundaries[1], {
    //   x: size / 2,
    //   y: size
    // });
    // Matter.Body.setPosition(this.boundaries[2], {
    //   x: 0,
    //   y: size / 2
    // });
    // Matter.Body.setPosition(this.boundaries[3], {
    //   x: size,
    //   y: size / 2
    // });

    // 更新边界尺寸
    Matter.Body.scale(this.boundaries[0], size / (this.boundaries[0].bounds.max.x - this.boundaries[0].bounds.min.x), 1);
    Matter.Body.scale(this.boundaries[1], size / (this.boundaries[1].bounds.max.x - this.boundaries[1].bounds.min.x), 1);
    Matter.Body.scale(this.boundaries[2], 1, size / (this.boundaries[2].bounds.max.y - this.boundaries[2].bounds.min.y));
    Matter.Body.scale(this.boundaries[3], 1, size / (this.boundaries[3].bounds.max.y - this.boundaries[3].bounds.min.y));

    // 如果游戏未开始，重新定位小球
    if (!this.isRunning) {
      const xOffset = size * 0.25;
      const yOffset = size * 0.5;

      Matter.Body.setPosition(this.p1Ball, {
        x: xOffset,
        y: yOffset
      });

      Matter.Body.setPosition(this.p2Ball, {
        x: size - xOffset,
        y: yOffset
      });
    }
  }

  public onLivesUpdate(callback: (p1Lives: number, p2Lives: number) => void) {
    this.onLivesUpdateCallback = callback
    // 初始调用一次以设置初始状态
    callback(this.p1Lives, this.p2Lives)
  }

  public destroy() {
    if (this.render) Matter.Render.stop(this.render)
    if (this.runner) Matter.Runner.stop(this.runner)
    if (this.engine) Matter.Engine.clear(this.engine)

    // 清除道具生成定时器
    if (this.itemSpawnInterval) {
      clearInterval(this.itemSpawnInterval)
      this.itemSpawnInterval = null
    }
  }

  // 添加在小球上绘制图片的方法
  private async loadImage(imageUrl: string): Promise<HTMLImageElement> {
    if (!this.imageCache[imageUrl]) {
      const img = new Image();
      img.src = `/src/static/headPortrait/${imageUrl}`;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          console.error(`Failed to load image: ${imageUrl}`);
          reject();
        };
      });
      this.imageCache[imageUrl] = img;
    }
    return this.imageCache[imageUrl];
  }

  private drawImageOnBall(ball: Matter.Body, imageUrl: string) {
    if (!ball || !this.render.context) return

    const ctx = this.render.context
    const pos = ball.position
    const radius = ball.circleRadius || 20

    // 保存当前状态
    ctx.save()

    // 创建圆形裁剪区域 - 确保完美圆形
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
    ctx.clip()

    // 加载和缓存图片
    if (!this.imageCache) {
      this.imageCache = {}
    }

    const img = this.imageCache[imageUrl] || null

    // 检查图片是否已加载
    if (img && img.complete) {
      // 计算图片绘制尺寸 - 确保正方形且覆盖整个圆
      const size = radius * 2

      // 居中绘制图片，确保完全填充圆形区域
      ctx.drawImage(img, pos.x - radius, pos.y - radius, size, size)

      // 获取小球颜色并计算互补色
      let ballColor = '#0088ff';
      if (ball === this.p2Ball) {
        ballColor = '#ff4444';
      }

      // 将十六进制颜色转换为RGB
      const r = parseInt(ballColor.slice(1, 3), 16);
      const g = parseInt(ballColor.slice(3, 5), 16);
      const b = parseInt(ballColor.slice(5, 7), 16);

      // 计算互补色
      const complementaryColor = `#${(255 - r).toString(16).padStart(2, '0')}${(255 - g).toString(16).padStart(2, '0')}${(255 - b).toString(16).padStart(2, '0')}`;

      // 绘制互补色边框
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = complementaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 如果小球有尖刺效果，隐藏边框并绘制尖刺环绕
      if ((ball === this.p1Ball && this.p1HasSpikes) ||
        (ball === this.p2Ball && this.p2HasSpikes)) {
        // 隐藏原有边框
        ctx.strokeStyle = 'transparent'
        ctx.lineWidth = 0
        ctx.stroke()

        // 绘制尖刺环绕效果
        const spikeCount = 12
        const spikeLength = radius * 0.4
        const outerRadius = radius * 1.1

        ctx.beginPath()
        for (let i = 0; i < spikeCount; i++) {
          const angle = (i / spikeCount) * Math.PI * 2
          const innerX = pos.x + radius * Math.cos(angle)
          const innerY = pos.y + radius * Math.sin(angle)
          const outerX = pos.x + outerRadius * Math.cos(angle)
          const outerY = pos.y + outerRadius * Math.sin(angle)
          const midX = pos.x + (radius + spikeLength) * Math.cos(angle)
          const midY = pos.y + (radius + spikeLength) * Math.sin(angle)

          ctx.moveTo(innerX, innerY)
          ctx.lineTo(midX, midY)
          ctx.lineTo(outerX, outerY)
        }
        ctx.closePath()
        ctx.fillStyle = '#FF0000'
        ctx.fill()
      }
    } else {
      // 如果图片未加载，加载图片并在加载完成后重绘
      this.loadImage(imageUrl).then(() => {
        if (this.render) {
          Matter.Render.world(this.render);
        }
      }).catch(() => {
        console.error(`Failed to load image: ${imageUrl}`);
      });
    }

    // 恢复状态
    ctx.restore()
  }

  // 预加载所有图标
  private preloadIcons() {
    const itemTypes = ['ball1', 'ball2', 'heart', 'spike'];

    itemTypes.forEach(type => {
      const imageSrc = localStorage.getItem(`game_icon_${type}`);
      if (imageSrc) {
        this.loadAndCacheImage(type, imageSrc);
      }
    });
  }

  // 加载并缓存图像
  private loadAndCacheImage(itemId: string, src: string) {
    const img = new Image();
    img.onload = () => {
      this.iconCache.set(itemId, img);
    };
    img.src = src;
    return img;
  }


  // 修改渲染道具方法



  public update() {
    this.updateBorderOffset(); // 更新边框线偏移量

    Matter.Engine.update(this.engine);
    // 渲染边框线
    // this.renderBorders();

    // 继续更新
    requestAnimationFrame(() => this.update());
  }


  private updateBorderOffset() {
    if (this.shrinkStartTime === null || !this.shrinkDuration) {
      return;
    }

    // 检查游戏是否已经结束
    if (this.isGameOver) {
      return;
    }

    // 检查小球生命值是否为零
    if (this.p1Lives <= 0 || this.p2Lives <= 0) {
      this.isGameOver = true;
      this.isRunning = false;
      Matter.Runner.stop(this.runner);

      // 触发游戏结束回调
      if (this.onLivesUpdateCallback) {
        this.onLivesUpdateCallback(this.p1Lives, this.p2Lives);
      }
      return;
    }

    const elapsedTime = Date.now() - this.shrinkStartTime;
    const progress = Math.min(elapsedTime / this.shrinkDuration, 1);

    // 确保borderOffset和相关值有默认值
    const currentBorderOffset = this.borderOffset || 0;
    const currentInitialBorderOffset = this.initialBorderOffset || 0;
    const currentTargetBorderOffset = this.targetBorderOffset || 0;

    // 计算当前边框线偏移量，使用缓动函数使移动更平滑
    this.borderOffset = currentInitialBorderOffset +
      (currentTargetBorderOffset - currentInitialBorderOffset) * this.easeInOutQuad(progress);

    // 更新边界位置
    this.createBoundaries();
  }

  public startGame() {
    this.isRunning = true;
    
    // 设置小球初始速度，使它们相向移动并立即碰撞
    const initialSpeed = 5; // 提高初始速度以确保快速碰撞
    
    // 计算两球之间的向量
    const p1Pos = this.p1Ball.position;
    const p2Pos = this.p2Ball.position;
    
    // 计算从p1指向p2的单位向量
    const directionVector = Matter.Vector.normalise({
      x: p2Pos.x - p1Pos.x,
      y: p2Pos.y - p1Pos.y
    });
    
    // 设置p1球的速度 - 朝向p2
    Matter.Body.setVelocity(this.p1Ball, {
      x: directionVector.x * initialSpeed,
      y: directionVector.y * initialSpeed
    });
    
    // 设置p2球的速度 - 朝向p1
    Matter.Body.setVelocity(this.p2Ball, {
      x: -directionVector.x * initialSpeed,
      y: -directionVector.y * initialSpeed
    });
    
    this.startBorderShrink(); // 游戏开始时启动边界收缩
    Matter.Runner.run(this.runner, this.engine);
  }

  public indirectlyUpdateBorderOffset() {
    this.updateBorderOffset();
  }

  // 缓动函数，使边框移动更平滑
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }


  // private loadImage(url: string): Promise<HTMLImageElement> {
  //   return new Promise((resolve, reject) => {
  //     const image = new Image();
  //     image.src = url;
  //     image.onload = () => resolve(image);
  //     image.onerror = reject;
  //   });
  // }

  public async setBallImage(ball: Matter.Body, imageUrl: string) {
    try {
      const image = await this.loadImage(imageUrl);
      ball.render.sprite = { texture: imageUrl, xScale: 0.1, yScale: 0.1 }; // 使用sprite属性存储图片
    } catch (error) {
      console.error('图片加载失败:', error);
      return null;
    }
    if (ball === this.p1Ball && this.p1BallImage) {
      console.log('玩家1图片加载完成');
    } else if (ball === this.p2Ball && this.p2BallImage) {
      console.log('玩家2图片加载完成');
    }
  }
}