export const GAME_CONFIG = {
  // 游戏画布尺寸 Game canvas dimensions
  gameWidth: 800,
  gameHeight: 800,
  
  // 玩家属性 Player attributes
  playerRadius: 20, // 玩家小球半径 Player ball radius
  initialLives: 5, // 初始生命值 Initial lives count
  
  // 速度限制 Speed limits
  maxSpeed: 7.0,   // 最大速度 Maximum speed
  minSpeed: 2.0,   // 最小速度 Minimum speed
  initialSpeed: 4.0, // 初始速度 Initial speed
  
  // 物理参数 Physics parameters
  boundaryThickness: 10, // 边界厚度 Boundary thickness
  bounceFactor: 1.0,    // 反弹系数 Bounce factor (1 = perfect bounce)
  frictionAir: 0.001,   // 空气摩擦力 Air friction
  friction: 0.001       // 地面摩擦力 Ground friction
}