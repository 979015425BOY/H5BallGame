<template>
  <div class="canvas-collision-container">
    <h1 style="color:#fff">小球对战</h1>
    <!-- 新增 HP 条容器 -->
    <div class="hp-bars-container">
      <div class="player-hp-bar">
        <div class="player-name">{{ gameStore.config.player1Name }}</div>
        <div class="hp-bar">
          <div v-for="i in initialHp" :key="`p1-${i}`" class="hp-segment player1" :class="{ active: player1 && i <= player1.hp }" />
        </div>
      </div>
      <div class="player-hp-bar">
        <div class="player-name">{{ gameStore.config.player2Name }}</div>
        <div class="hp-bar">
          <div v-for="i in initialHp" :key="`p2-${i}`" class="hp-segment player2" :class="{ active: player2 && i <= player2.hp }" />
        </div>
      </div>
    </div>
    <!-- 新增 Canvas 容器 -->
    <button v-if="!isGameStarted" class="start-button" @click="startGame">开始游戏</button>
    <div class="canvas-wrapper" ref="canvasContainerRef">
      <canvas ref="canvasRef"></canvas> <!-- 移除固定的 width 和 height -->
    </div>
    <div v-if="gameOver" class="game-over-message">
      游戏结束! 获胜者: {{ winner }}
    </div>
    <!-- 移除旧的 HP 显示 -->
    <!-- <div class="hp-display">
      <div>玩家1 HP: {{ player1?.hp }}</div>
      <div>玩家2 HP: {{ player2?.hp }}</div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, watch, nextTick } from 'vue';
import borderHitSound from '@/assets/sounds/音频6.WAV'; // 边界/普通碰撞
import ballHitSound from '@/assets/sounds/音频6.WAV';     // 边界/普通碰撞
import healPickupSound from '@/assets/sounds/音频7.WAV'; // 治疗拾取
import damagePickupSound from '@/assets/sounds/音频6.WAV';// 伤害拾取 (使用碰撞音)
import damageHitSound from '@/assets/sounds/音频6.WAV';   // 伤害碰撞 (使用碰撞音)
import { useWindowSize } from '@vueuse/core'; // 导入 useWindowSize
import { useGameStore } from '@/stores/gameStore'; // <-- 新增：导入 gameStore
import player1Head from '@/static/headPortrait/t1.jpg'; // 导入玩家1头像
import player2Head from '@/static/headPortrait/t2.jpg'; // 导入玩家2头像
import heartSvg from '@/static/svg/love.svg'; // <-- 新增：导入心形 SVG

// --- 新增：玩家头像图片引用 ---
const player1Image = ref<HTMLImageElement | null>(null);
const player2Image = ref<HTMLImageElement | null>(null);
const heartImage = ref<HTMLImageElement | null>(null); // <-- 新增：心形图片引用
// ---------------------------

// --- 新增：播放音效函数 ---
function playSound(soundFile: string) {
  const audio = new Audio(soundFile);
  audio.play().catch(error => console.error("Error playing sound:", error));
}
// -------------------------

// --- 新增：流血粒子接口 ---
interface BloodParticle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  alpha: number;
  life: number; // 剩余生命周期
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasContainerRef = ref<HTMLElement | null>(null); // 新增：用于获取容器尺寸
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;
let globalRotation = 0; // 新增全局旋转变量，用于玩家球的尖刺效果

// --- 新增游戏状态和配置 ---
const gameOver = ref(false);
const winner = ref<string | null>(null);
const isGameStarted = ref(false); // 新增：游戏是否已开始状态
const isShattering = ref(false); // 新增：是否正在播放碎裂动画
// --- 修改游戏区域定义 (初始值将在 resizeCanvas 中设置) ---
const gameArea = reactive({ centerX: 0, centerY: 0, size: 0, borderColor: 'rgba(0, 0, 0, 0.5)', borderGlow: 0 }); // 新增边框颜色和光效状态
// --- 从 gameStore 获取配置 --- 
const gameStore = useGameStore();
const { initialHp, shrinkRate, minAreaSize, powerUpSpawnInterval, player1Color, player2Color, damagePowerUpColor, healPowerUpColor } = gameStore.config;
// --------------------------

interface Ball {
  id: number; // 区分玩家
  x: number;
  y: number;
  baseRadius: number; // 新增：基础半径
  radius: number;
  dx: number;
  dy: number;
  color: string;
  hp: number; // 生命值
  hasDamagePowerUp: boolean; // 是否持有伤害道具
}

interface PowerUp {
  x: number;
  y: number;
  radius: number;
  type: 'damage' | 'heal';
  color: string;
  rotation?: number; // 新增：用于伤害道具旋转
}

// 不再使用随机小球数组，改为定义两个玩家小球
// const balls: Ball[] = [];
// const numBalls = 15;
const player1 = ref<Ball | null>(null); // 使用 ref
const player2 = ref<Ball | null>(null); // 使用 ref
const powerUps = reactive<PowerUp[]>([]);
const bloodParticles = reactive<BloodParticle[]>([]); // 新增：流血粒子数组
const shatterParticles = reactive<ShatterParticle[]>([]); // 新增：碎裂粒子数组
// const powerUpSpawnInterval = 5000; // 道具生成间隔 (ms) <-- 使用 store 中的值
let lastPowerUpSpawnTime = 0;

// const playerColors = ['#4682B4', '#FF6347']; // 玩家1蓝色, 玩家2红色 <-- 使用 store 中的值
// const powerUpColors = { damage: '#FFD700', heal: '#32CD32' }; // 伤害黄色, 治疗绿色 <-- 使用 store 中的值

// const colors = ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#6A5ACD', '#FF69B4', '#00CED1'];

// function getRandomColor(): string {
//   return colors[Math.floor(Math.random() * colors.length)];
// }

function getRandomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// --- 修改初始化逻辑 (不再直接设置尺寸) ---
function startGame() {
  if (!canvasRef.value || !canvasContainerRef.value) return;
  const { width, height } = canvasContainerRef.value.getBoundingClientRect();
  initGame(width, height);
  isGameStarted.value = true;
  // 点击开始后生成道具
  spawnPowerUp();
  // 开始游戏循环
  animationFrameId = requestAnimationFrame(gameLoop);
}

function initGame(canvasWidth: number, canvasHeight: number) {
  gameOver.value = false;
  winner.value = null;
  // --- 尺寸和中心点在 resizeCanvas 中设置 ---
  // gameArea.size = Math.min(canvasWidth, canvasHeight);
  // gameArea.centerX = canvasWidth / 2;
  // gameArea.centerY = canvasHeight / 2;
  powerUps.length = 0; // 清空道具
  bloodParticles.length = 0; // 清空粒子
  lastPowerUpSpawnTime = Date.now();

  // --- 半径可以根据画布大小调整 (可选) ---
  const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.04; // 增加基础半径比例
  const radius = Math.max(20, baseRadius); // 增加最小半径

  // --- 调整初始位置以适应中心区域 (使用 gameArea 的值) ---
  player1.value = { // 使用 .value
    id: 1,
    x: gameArea.centerX - gameArea.size / 4, // 调整初始位置
    y: gameArea.centerY,
    baseRadius: radius * gameStore.config.player1OuterRadius, // 应用外圈半径比例
    radius: radius * gameStore.config.player1OuterRadius, // 当前半径
    dx: getRandomNumber(3, 6) * (canvasWidth / 800), // 增加初始速度范围
    dy: getRandomNumber(-6, 6) * (canvasHeight / 600), // 增加初始速度范围
    color: player1Color, // <-- 使用 store 中的颜色
    hp: initialHp,
    hasDamagePowerUp: false,
  };
  player2.value = { // 使用 .value
    id: 2,
    x: gameArea.centerX + gameArea.size / 4, // 调整初始位置
    y: gameArea.centerY,
    baseRadius: radius * gameStore.config.player2OuterRadius, // 应用外圈半径比例
    radius: radius * gameStore.config.player2OuterRadius, // 当前半径
    dx: getRandomNumber(-6, -3) * (canvasWidth / 800), // 增加初始速度范围
    dy: getRandomNumber(-6, 6) * (canvasHeight / 600), // 增加初始速度范围
    color: player2Color, // <-- 使用 store 中的颜色
    hp: initialHp,
    hasDamagePowerUp: false,
  };

  // 初始生成一个道具
  spawnPowerUp();
}

// --- 新增道具生成逻辑 (使用 gameArea) ---
function spawnPowerUp() {
  // --- 修改：限制同类型道具数量 ---
  const existingDamage = powerUps.some(p => p.type === 'damage');
  const existingHeal = powerUps.some(p => p.type === 'heal');
  if (existingDamage && existingHeal) return; // 如果两种道具都已存在，则不生成

  const availableTypes: ('damage' | 'heal')[] = [];
  if (!existingDamage) availableTypes.push('damage');
  if (!existingHeal) availableTypes.push('heal');
  if (availableTypes.length === 0) return; // 没有可生成的类型
  // ----------------------------------

  const radius = Math.max(8, gameArea.size * 0.025); // 道具半径也适配
  let x, y, overlapping;
  let attempts = 0;
  const halfSize = gameArea.size / 2;
  const padding = radius + 10; // 边缘填充

  // 确保 gameArea 有效
  if (gameArea.size <= padding * 2) return; // 区域太小无法生成

  do {
    overlapping = false;
    // --- 在正方形区域内生成 ---
    x = getRandomNumber(gameArea.centerX - halfSize + padding, gameArea.centerX + halfSize - padding);
    y = getRandomNumber(gameArea.centerY - halfSize + padding, gameArea.centerY + halfSize - padding);

    // 检查与玩家球的重叠
    [player1.value, player2.value].forEach(ball => { // 使用 .value
      if (!ball) return;
      const dxBall = x - ball.x;
      const dyBall = y - ball.y;
      if (Math.sqrt(dxBall * dxBall + dyBall * dyBall) < radius + ball.radius + 10) {
        overlapping = true;
      }
    });

    // 检查与现有道具的重叠
    powerUps.forEach(p => {
        const dxP = x - p.x;
        const dyP = y - p.y;
        if (Math.sqrt(dxP * dxP + dyP * dyP) < radius + p.radius + 10) {
            overlapping = true;
        }
    });

    attempts++;
  } while (overlapping && attempts < 50);

  if (!overlapping) {
    // --- 修改：从可用类型中随机选择 ---
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    // ----------------------------------
    powerUps.push({
      x,
      y,
      radius,
      type,
      color: type === 'damage' ? damagePowerUpColor : healPowerUpColor, // <-- 使用 store 中的颜色
      ...(type === 'damage' ? { rotation: 0 } : {}), // 初始化伤害道具旋转角度
    });
  }
}

// --- 新增绘制道具逻辑 --- 
function drawPowerUp(powerUp: PowerUp) {
  if (!ctx) return;

  // 移除背景圆绘制
  // ctx.beginPath();
  // ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
  // ctx.fillStyle = powerUp.color;
  // ctx.fill();
  // ctx.closePath();

  // 根据道具类型绘制不同内容
  if (powerUp.type === 'damage') {
    // 使用配置中的伤害道具图片
    if (gameStore.config.spikeItemImage) {
      const tempImg = new Image();
      tempImg.src = gameStore.config.spikeItemImage;
      
      if (tempImg.complete) {
        // 如果图片已加载完成，直接绘制
        ctx.save();
        ctx.translate(powerUp.x, powerUp.y);
        ctx.rotate(globalRotation);
        ctx.translate(-powerUp.x, -powerUp.y);
        const drawSize = powerUp.radius * 2;
        ctx.drawImage(tempImg, powerUp.x - powerUp.radius, powerUp.y - powerUp.radius, drawSize, drawSize);
        ctx.restore();
      } else {
        // 如果图片未加载完成，添加加载事件
        tempImg.onload = () => {
          if (!ctx) return;
          ctx.save();
          ctx.translate(powerUp.x, powerUp.y);
          ctx.rotate(globalRotation);
          ctx.translate(-powerUp.x, -powerUp.y);
          const drawSize = powerUp.radius * 2;
          ctx.drawImage(tempImg, powerUp.x - powerUp.radius, powerUp.y - powerUp.radius, drawSize, drawSize);
          ctx.restore();
        };
        // 后备方案：如果图片未加载，可以绘制一个简单的圆圈
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
        ctx.fillStyle = damagePowerUpColor;
        ctx.fill();
        ctx.closePath();
      }
    } else {
      // 如果没有配置图片，绘制默认圆圈
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
      ctx.fillStyle = damagePowerUpColor;
      ctx.fill();
      ctx.closePath();
    }

  } else if (powerUp.type === 'heal') {
    // <-- 修改：绘制心形图片 -->
    if (heartImage.value) {
        const drawSize = powerUp.radius * 2; // 图片绘制大小，基于道具半径
        ctx.drawImage(heartImage.value, powerUp.x - powerUp.radius, powerUp.y - powerUp.radius, drawSize, drawSize);
    } else {
        // 后备方案：如果图片未加载，可以绘制一个简单的圆圈或不绘制
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
        ctx.fillStyle = healPowerUpColor; // <-- 使用 store 中的颜色
        ctx.fill();
        ctx.closePath();
    }
    // <-- 移除旧的 drawHeart 调用 -->
    // drawHeart(ctx, powerUp.x, powerUp.y, powerUp.radius * 1.2, 'red');
  }
}

// --- 新增：绘制尖刺形状的辅助函数 ---
function drawSpikeShape(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
    if (!ctx) return; // Add null check
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const spikes = 12;
    const outerRadius = radius;
    const innerRadius = radius * 0.4;
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(x, y - outerRadius);
    for (let i = 0; i < spikes; i++) {
      const currentOuterX = x + Math.cos(rot) * outerRadius;
      const currentOuterY = y + Math.sin(rot) * outerRadius;
      ctx.lineTo(currentOuterX, currentOuterY);
      rot += step;

      const currentInnerX = x + Math.cos(rot) * innerRadius;
      const currentInnerY = y + Math.sin(rot) * innerRadius;
      ctx.lineTo(currentInnerX, currentInnerY);
      rot += step;
    }
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
    ctx.fill();
}

// --- 新增：绘制心形图案的辅助函数 ---
/*
function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
    if (!ctx) return; // Add null check
    ctx.fillStyle = color;
    ctx.beginPath();
    // 调整绘制起点和控制点，使心形视觉上更居中于 (x, y)
    const topCurveHeight = size * 0.3;
    const halfSize = size / 2;
    const bottomY = y + size * 0.5; // 调整心形底部位置，使其更接近中心 y
    const topY = y - size * 0.2; // 调整心形顶部凹陷位置

    ctx.moveTo(x, topY + topCurveHeight); // 移动到凹陷下方
    // 左上半圆弧
    ctx.bezierCurveTo(x, topY, x - halfSize, topY - topCurveHeight, x - halfSize, topY + topCurveHeight);
    // 左下半圆弧
    ctx.bezierCurveTo(x - halfSize, topY + (size + topCurveHeight) / 2, x, bottomY - size * 0.2, x, bottomY);
    // 右下半圆弧
    ctx.bezierCurveTo(x, bottomY - size * 0.2, x + halfSize, topY + (size + topCurveHeight) / 2, x + halfSize, topY + topCurveHeight);
    // 右上半圆弧
    ctx.bezierCurveTo(x + halfSize, topY - topCurveHeight, x, topY, x, topY + topCurveHeight);
    ctx.closePath();
    ctx.fill();
}
*/

// --- 绘制游戏区域边界 ---
let gameAreaHue = 0; // 新增：用于边框颜色循环

// --- 绘制游戏区域边界 ---
function drawGameArea() {
    if (!ctx) return;

    // --- 动态边框颜色和光效 --- 
    // 颜色循环
    gameAreaHue = (gameAreaHue + 0.5) % 360; // 调整速度
    const dynamicBorderColor = `hsl(${gameAreaHue}, 100%, 70%)`; // 使用 HSL 颜色

    const glowRadius = gameArea.borderGlow > 0 ? gameArea.borderGlow * 5 : 0; // 光效半径
    if (glowRadius > 0) {
        ctx.shadowBlur = glowRadius;
        ctx.shadowColor = 'white'; // 白色光效
        // 碰撞时光效期间使用白色边框，否则使用动态颜色
        ctx.strokeStyle = 'white'; 
    } else {
        ctx.strokeStyle = gameArea.borderColor === 'red' ? 'red' : dynamicBorderColor; // 碰撞瞬间变红，否则动态颜色
    }

    ctx.lineWidth = 2;
    // --- 绘制以中心点为基准的正方形 --- 
    const halfSize = gameArea.size / 2;
    ctx.strokeRect(gameArea.centerX - halfSize, gameArea.centerY - halfSize, gameArea.size, gameArea.size);

    // 清除阴影，避免影响其他绘制
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // 光效逐渐减弱
    if (gameArea.borderGlow > 0) {
        gameArea.borderGlow -= 0.05; // 减弱速度
        if (gameArea.borderGlow < 0) {
            gameArea.borderGlow = 0;
            // 光效结束后，如果之前是红色（碰撞导致），恢复默认颜色，否则保持动态颜色
            if (gameArea.borderColor === 'red') {
                gameArea.borderColor = 'rgba(0, 0, 0, 0.5)'; // 恢复默认用于下次碰撞检测
            }
        }
    } else {
        // 不在光效期间，且不是碰撞瞬间的红色，则恢复默认，允许动态颜色生效
        if (gameArea.borderColor !== 'red') {
             gameArea.borderColor = 'rgba(0, 0, 0, 0.5)';
        }
    }
    // ---------------------------
}

// --- 修改缩小边界逻辑 --- (中心缩放)
function shrinkBoundary() {
    if (gameOver.value) return;
    if (gameArea.size > minAreaSize) {
        gameArea.size -= shrinkRate * 2; // 正方形两边同时缩小，速率调整
        if (gameArea.size < minAreaSize) {
            gameArea.size = minAreaSize;
        }
    }
    // 中心点不变，无需调整物体位置
}

// --- 修改绘制小球逻辑 (绘制同心圆或尖刺，使用配置的图片) ---
function drawBall(ball: Ball) {
  if (!ctx) return;

  const drawInnerContent = () => {
    if (!ctx) return; // Add null check
    // 使用配置中的内圈半径比例
    const innerRadiusRatio = ball.id === 1 ? gameStore.config.player1InnerRadius : gameStore.config.player2InnerRadius;
    const innerRadius = ball.radius * innerRadiusRatio;
    
    // 优先使用配置中的自定义图片，如果没有则使用默认头像
    const customImage = ball.id === 1 ? gameStore.config.player1Image : gameStore.config.player2Image;
    const defaultImage = ball.id === 1 ? player1Image.value : player2Image.value;
    
    // 如果有自定义图片，创建并使用临时图片对象
    if (customImage) {
      const tempImg = new Image();
      tempImg.src = customImage;
      console.log('ball.hasDamagePowerUp:', ball.hasDamagePowerUp ,gameStore.config.gearImage);
      
      if (tempImg.complete) {
        // 如果图片已加载完成，直接绘制
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, innerRadius, 0, Math.PI * 2);
        ctx.clip(); // 裁剪绘制区域为圆形
        
        // 绘制尖刺状态外圈
        console.log('ball.hasDamagePowerUp:', ball.hasDamagePowerUp ,gameStore.config.gearImage);
        if (ball.hasDamagePowerUp && gameStore.config.gearImage) {
          const gearImg = new Image();
          gearImg.src = gameStore.config.gearImage;
          if (gearImg.complete) {
            ctx.drawImage(gearImg, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
          } else {
            gearImg.onload = () => {
              ctx?.drawImage(gearImg, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
            };
          }
        }
        ctx.drawImage(tempImg, ball.x - innerRadius, ball.y - innerRadius, innerRadius * 2, innerRadius * 2);
        ctx.restore();
      } else {
        // 如果图片未加载完成，添加加载事件
        tempImg.onload = () => {
          if (!ctx) return;
          ctx.save();
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, innerRadius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(tempImg, ball.x - innerRadius, ball.y - innerRadius, innerRadius * 2, innerRadius * 2);
          ctx.restore();
        };
        // 同时绘制后备内圆
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, innerRadius, 0, Math.PI * 2);
        const darkerColor = darkenColor(ball.color, 0.3);
        ctx.fillStyle = darkerColor;
        ctx.fill();
        ctx.closePath();
      }
    } else if (defaultImage) {
      // 使用默认头像
      ctx.save();
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, innerRadius, 0, Math.PI * 2);
      ctx.clip(); // 裁剪绘制区域为圆形
      ctx.drawImage(defaultImage, ball.x - innerRadius, ball.y - innerRadius, innerRadius * 2, innerRadius * 2);
      ctx.restore();
    } else {
      // 图片未加载，绘制深色内圆作为后备
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, innerRadius, 0, Math.PI * 2);
      const darkerColor = darkenColor(ball.color, 0.3);
      ctx.fillStyle = darkerColor;
      ctx.fill();
      ctx.closePath();
    }
  };

  if (ball.hasDamagePowerUp) {
    console.log('ball.获取尖刺道具:', ball.hasDamagePowerUp);
    // 持有伤害道具：绘制旋转尖刺外圈 + 内部内容
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(globalRotation); // 使用全局旋转变量
    ctx.translate(-ball.x, -ball.y);
    
    // 优先使用gear.png图片作为外圈
    if (gameStore.config.gearImage) {
      const gearImg = new Image();
      gearImg.src = gameStore.config.gearImage;
      if (gearImg.complete) {
        ctx.drawImage(gearImg, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
      } else {
        gearImg.onload = () => {
          ctx?.drawImage(gearImg, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
        };
      }
    } else {
      // 如果没有gear图片，使用玩家颜色绘制尖刺
      drawSpikeShape(ctx, ball.x, ball.y, ball.radius, ball.color);
    }
    
    ctx.restore();
    
    // 绘制内部内容 (图片或后备内圆)
    drawInnerContent();

  } else {
    // 正常状态：绘制外圆和内部内容
    // 绘制外圆
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();

    // 绘制内部内容 (图片或后备内圆)
    drawInnerContent();
  }
}

// --- 辅助函数：颜色变暗 ---
function darkenColor(hex: string, percent: number): string {
    hex = hex.replace(/^#/, '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, Math.floor(r * (1 - percent)));
    g = Math.max(0, Math.floor(g * (1 - percent)));
    b = Math.max(0, Math.floor(b * (1 - percent)));

    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
}

// --- 修改更新逻辑 --- (边界检测部分)
function updateGame() {
  if (gameOver.value || !player1.value || !player2.value) return; // 使用 .value

 // --- 新增：更新全局旋转变量 ---
  globalRotation += 0.02; // 控制尖刺旋转速度
  // -----------------------------

 // --- 新增：根据 HP 更新小球半径 ---
 [player1.value, player2.value].forEach(ball => {
   if (ball) {
     const hpRatio = Math.max(0.7, ball.hp / initialHp); // 半径最小为基础半径的 70%
     ball.radius = ball.baseRadius * hpRatio;
   }
 });
 // ----------------------------------

  // 更新玩家1
  updateBall(player1.value); // 使用 .value
  // 更新玩家2
  updateBall(player2.value); // 使用 .value

  // 玩家间碰撞检测与响应
  resolveCollision(player1.value, player2.value); // 使用 .value

  // 道具拾取检测
  checkPowerUpCollision(player1.value); // 使用 .value
  checkPowerUpCollision(player2.value); // 使用 .value

  // --- 新增：更新道具旋转 ---
  powerUps.forEach(p => {
      if (p.type === 'damage' && p.rotation !== undefined) {
          p.rotation += 0.2; // 控制伤害道具旋转速度
      }
  });
  // -------------------------

  // 检查游戏结束条件
  checkGameOver();

  // 定期生成道具
  const now = Date.now();
  if (now - lastPowerUpSpawnTime > powerUpSpawnInterval) {
      spawnPowerUp();
      lastPowerUpSpawnTime = now;
  }

  // 缩小边界 (使用 gameArea)
  shrinkBoundary();
}

// --- 提取单个小球更新逻辑 (使用 gameArea) ---
function updateBall(ball: Ball) {
    // 移动小球
    ball.x += ball.dx;
    ball.y += ball.dy;

    // --- 边界碰撞检测 (使用 gameArea 的正方形边界) ---
    const halfSize = gameArea.size / 2;
    const leftBoundary = gameArea.centerX - halfSize;
    const rightBoundary = gameArea.centerX + halfSize;
    const topBoundary = gameArea.centerY - halfSize;
    const bottomBoundary = gameArea.centerY + halfSize;

    let hitBoundary = false; // 标记是否碰到边界

    // 考虑半径的碰撞
    if (ball.x + ball.radius > rightBoundary) {
        ball.x = rightBoundary - ball.radius;
        ball.dx = -ball.dx;
    playSound(borderHitSound); // 播放边界碰撞音效
        hitBoundary = true;
    } else if (ball.x - ball.radius < leftBoundary) {
        ball.x = leftBoundary + ball.radius;
        ball.dx = -ball.dx;
    playSound(borderHitSound); // 播放边界碰撞音效
        hitBoundary = true;
    }

    if (ball.y + ball.radius > bottomBoundary) {
        ball.y = bottomBoundary - ball.radius;
        ball.dy = -ball.dy;
    playSound(borderHitSound); // 播放边界碰撞音效
        hitBoundary = true;
    } else if (ball.y - ball.radius < topBoundary) {
        ball.y = topBoundary + ball.radius;
        ball.dy = -ball.dy;
    playSound(borderHitSound); // 播放边界碰撞音效
        hitBoundary = true;
    }

    // --- 如果碰到边界，触发边框效果 --- 
    if (hitBoundary) {
        gameArea.borderColor = 'red'; // 碰撞时变红
        gameArea.borderGlow = 1; // 激活光效
    }
    // --------------------------------
}

// --- 新增道具拾取检测 ---
function checkPowerUpCollision(ball: Ball) {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        const dx = powerUp.x - ball.x;
        const dy = powerUp.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ball.radius + powerUp.radius) {
            // 拾取道具
            if (powerUp.type === 'damage') {
                ball.hasDamagePowerUp = true;
                playSound(damagePickupSound); // 播放伤害道具拾取音效
                // --- 新增：移除对方的伤害道具效果 ---
                const otherPlayer = ball.id === 1 ? player2.value : player1.value;
                if (otherPlayer) {
                    otherPlayer.hasDamagePowerUp = false;
                }
                // -------------------------------------
            } else if (powerUp.type === 'heal') {
                ball.hp = Math.min(initialHp, ball.hp + 1); // 回复1点HP，不超过上限
                playSound(healPickupSound); // 播放治疗道具拾取音效
            }
            powerUps.splice(i, 1); // 移除道具
            // 拾取后立即生成一个新道具
            spawnPowerUp();
            lastPowerUpSpawnTime = Date.now(); // 重置生成计时器
        }
    }
}

// --- 新增：生成流血粒子效果 ---
function spawnBloodParticles(x: number, y: number) {
    const count = 10; // 生成粒子数量
    for (let i = 0; i < count; i++) {
        bloodParticles.push({
            x,
            y,
            dx: getRandomNumber(-2, 2),
            dy: getRandomNumber(-2, 2),
            radius: getRandomNumber(1, 3),
            alpha: 1,
            life: getRandomNumber(20, 40), // 粒子持续帧数
        });
    }
}

// --- 修改碰撞响应逻辑 ---
function resolveCollision(ball1: Ball, ball2: Ball) {
  const dx = ball2.x - ball1.x;
  const dy = ball2.y - ball1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = ball1.radius + ball2.radius;

  if (distance < minDistance) {
    // --- 新增：播放碰撞音效 ---
    if (ball1.hasDamagePowerUp || ball2.hasDamagePowerUp) {
      playSound(damageHitSound); // 播放割裂音效
    } else {
      playSound(ballHitSound); // 播放普通碰撞音效
    }
    // -------------------------
    let damageDealt = false; // 标记是否造成了伤害
    const collisionX = ball1.x + dx / 2; // 碰撞点 X
    const collisionY = ball1.y + dy / 2; // 碰撞点 Y

    // --- 处理伤害 ---
    if (ball1.hasDamagePowerUp) {
        ball2.hp -= 1;
        ball1.hasDamagePowerUp = false; // 消耗道具
        damageDealt = true;
        // 添加视觉/音效反馈
    }
    if (ball2.hasDamagePowerUp) {
        ball1.hp -= 1;
        ball2.hasDamagePowerUp = false; // 消耗道具
        damageDealt = true;
        // 添加视觉/音效反馈
    }

    // --- 如果造成了伤害，生成流血效果 ---
    if (damageDealt) {
        spawnBloodParticles(collisionX, collisionY);
    }

    // --- 物理碰撞响应 (保持原有逻辑) ---
    // 防止球体重叠导致的多次碰撞计算
    if (distance === 0) return; // 避免除以零

    // 法线向量 (碰撞方向)
    const nx = dx / distance;
    const ny = dy / distance;

    // 切线向量
    const tx = -ny;
    const ty = nx;

    // 点积：切线速度 (保持不变)
    const dpTan1 = ball1.dx * tx + ball1.dy * ty;
    const dpTan2 = ball2.dx * tx + ball2.dy * ty;

    // 点积：法线速度
    const dpNorm1 = ball1.dx * nx + ball1.dy * ny;
    const dpNorm2 = ball2.dx * nx + ball2.dy * ny;

    // 动量守恒 (假设质量相等，简化为速度交换)
    const m1 = dpNorm2;
    const m2 = dpNorm1;

    // 更新速度 (法线方向速度交换)
    ball1.dx = tx * dpTan1 + nx * m1;
    ball1.dy = ty * dpTan1 + ny * m1;
    ball2.dx = tx * dpTan2 + nx * m2;
    ball2.dy = ty * dpTan2 + ny * m2;

    // --- 分离重叠 --- (重要)
    const overlap = minDistance - distance;
    if (overlap > 0) {
      // 按质量比例（此处简化为相等）移动球体以消除重叠
      const separationX = nx * (overlap / 2 + 0.1); // 加一点点防止粘连
      const separationY = ny * (overlap / 2 + 0.1);

      ball1.x -= separationX;
      ball1.y -= separationY;
      ball2.x += separationX;
      ball2.y += separationY;

      // --- 再次检查边界，防止分离后超出边界 (使用 gameArea 正方形) ---
      checkBoundaryAfterSeparation(ball1);
      checkBoundaryAfterSeparation(ball2);
    }

    // 检查游戏是否结束 (碰撞后可能导致HP耗尽)
    checkGameOver();
  }
}

// --- 辅助函数：分离后检查边界 (使用 gameArea 正方形) ---
function checkBoundaryAfterSeparation(ball: Ball) {
  const halfSize = gameArea.size / 2;
  const leftBoundary = gameArea.centerX - halfSize;
  const rightBoundary = gameArea.centerX + halfSize;
  const topBoundary = gameArea.centerY - halfSize;
  const bottomBoundary = gameArea.centerY + halfSize;

  // 确保分离后仍在边界内
  if (ball.x + ball.radius > rightBoundary) ball.x = rightBoundary - ball.radius;
  if (ball.x - ball.radius < leftBoundary) ball.x = leftBoundary + ball.radius;
  if (ball.y + ball.radius > bottomBoundary) ball.y = bottomBoundary - ball.radius;
  if (ball.y - ball.radius < topBoundary) ball.y = topBoundary + ball.radius;
}

// --- 新增游戏结束检测 ---
function checkGameOver() {
    if (gameOver.value) return;
    if (player1.value && player1.value.hp <= 0) { // 使用 .value
        gameOver.value = true;
        winner.value = gameStore.config.player2Name;
        cancelAnimationFrame(animationFrameId);
    } else if (player2.value && player2.value.hp <= 0) { // 使用 .value
        gameOver.value = true;
        winner.value = gameStore.config.player1Name;
        cancelAnimationFrame(animationFrameId);
    }
}

// --- 修改主绘制循环 ---
function draw() {
    if (!ctx || !canvasRef.value) return; // Add null check for ctx

    // 清空画布
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);

    // 背景色已移除，使其透明

    // 绘制游戏区域边界
    drawGameArea();

    // 更新游戏状态
    updateGame();

    // --- 新增：更新和绘制流血粒子 ---
    for (let i = bloodParticles.length - 1; i >= 0; i--) {
        const p = bloodParticles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= 0.025; // 透明度衰减
        p.life--;

        if (p.life <= 0 || p.alpha <= 0) {
            bloodParticles.splice(i, 1);
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 0, 0, ${p.alpha})`; // 红色，带透明度
            ctx.fill();
            ctx.closePath();
        }
    }
    // -------------------------------

    // 绘制玩家小球
    if (player1.value) drawBall(player1.value); // 使用 .value
    if (player2.value) drawBall(player2.value); // 使用 .value

    // 绘制道具
    powerUps.forEach(drawPowerUp);

    // 如果游戏未结束，请求下一帧
    if (!gameOver.value) {
        animationFrameId = requestAnimationFrame(draw);
    }
}

// --- 新增：调整画布和游戏区域大小 ---
const resizeCanvas = () => {
  if (!canvasRef.value || !canvasContainerRef.value) return;

  const containerWidth = canvasContainerRef.value.offsetWidth;
  const containerHeight = canvasContainerRef.value.offsetHeight;

  // 保持宽高比 4:3，或者根据容器调整
  const aspectRatio = 4 / 3;
  let newWidth = containerWidth;
  let newHeight = containerWidth / aspectRatio;

  // 如果计算出的高度大于容器高度，则以高度为基准
  if (newHeight > containerHeight) {
    newHeight = containerHeight;
    newWidth = containerHeight * aspectRatio;
  }

  // 确保画布尺寸是整数
  newWidth = Math.floor(newWidth);
  newHeight = Math.floor(newHeight);

  canvasRef.value.width = newWidth;
  canvasRef.value.height = newHeight;

  // 重新计算游戏区域
  gameArea.size = Math.min(newWidth, newHeight) * 0.95; // 留一点边距
  gameArea.centerX = newWidth / 2;
  gameArea.centerY = newHeight / 2;

  // 如果游戏已经开始，可能需要调整现有元素位置或重新初始化
  // 这里选择重新初始化以简化逻辑
  if (ctx) { // 确保 ctx 存在
      // 清除旧的动画帧
      cancelAnimationFrame(animationFrameId);
      // 重新初始化游戏
      // initGame(newWidth, newHeight);
      // 重新开始绘制循环
      draw();
  }
};

// --- 监听窗口大小变化 ---
const { width: windowWidth, height: windowHeight } = useWindowSize();
watch([windowWidth, windowHeight], () => {
  // 使用 nextTick 确保容器尺寸已更新
  nextTick(resizeCanvas);
});

// --- 修改 Mounted 钩子 ---
onMounted(() => {
  if (canvasRef.value && canvasContainerRef.value) { // 检查 container ref
    ctx = canvasRef.value.getContext('2d');
    if (ctx) {
      // --- 新增：加载玩家头像 ---
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      // 使用 IIFE (Immediately Invoked Function Expression) 来允许 await
      (async () => {
        try {
          player1Image.value = await loadImage(player1Head);
          player2Image.value = await loadImage(player2Head);
          // <-- 新增：加载心形图片 -->
          heartImage.value = await loadImage(heartSvg);
          console.log('Player images loaded successfully.'); // 添加日志确认加载
          // 图片加载成功后才调整大小并开始游戏，确保图片可用
          resizeCanvas();
        } catch (error) {
          console.error("Error loading player images:", error);
          // 即使图片加载失败，也继续调整大小并开始游戏
          resizeCanvas();
        }
      })();
      // -------------------------
      // 初始调整一次画布大小 (移动到 async IIFE 内部)
      resizeCanvas();
    } else {
      console.error('无法获取 2D 上下文');
    }
  } else {
    console.error('Canvas 元素或容器未找到');
  }

  // 确保不会自动调用startGame()
  // 移除所有可能导致游戏自动开始的代码
  // 初始化时不启动游戏循环
});

// --- 新增游戏循环函数 ---
function gameLoop() {
  if (!ctx || gameOver.value) return;
  
  // 清除画布
  ctx.clearRect(0, 0, canvasRef.value?.width || 0, canvasRef.value?.height || 0);
  
  // 更新游戏状态
  // updateGameState();
  
  // 绘制游戏元素
  drawGameArea();
  if (player1.value) drawBall(player1.value);
  if (player2.value) drawBall(player2.value);
  powerUps.forEach(drawPowerUp);
  
  // 继续循环
  animationFrameId = requestAnimationFrame(gameLoop);
}

// --- onUnmounted (无变化) ---
onUnmounted(() => {
  // 清理动画帧
  cancelAnimationFrame(animationFrameId);
});

</script>

<style scoped>
.canvas-collision-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px; /* 调整内边距 */
  position: relative; /* 为了定位HP和结束信息 */
  width: 100%;
  max-width: 800px; /* 限制最大宽度 */
  margin: 0 auto; /* 居中 */
  box-sizing: border-box; /* 包含 padding */
  color: #fff;
}

/* 新增 HP 条样式 */
.hp-bars-container {
  display: flex;
  justify-content: space-around; /* 或 space-between */
  width: 100%; /* 宽度自适应 */
  max-width: 600px; /* 限制最大宽度，保持与画布协调 */
  margin-bottom: 15px; /* 在 canvas 上方留出间距 */
}

.start-button {
  padding: 10px 20px;
  font-size: 18px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.start-button:hover {
  background-color: #45a049;
}

.player-hp-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #fff; /* 白色字体 */
 color: #333; /* 改为深色字体，适应浅色背景 */
}

.hp-bar {
  display: flex;
  gap: 4px; /* 调整间距 */
}

.hp-segment {
  width: 35px; /* 调整宽度 */
  height: 15px; /* 血量格高度 */
  border-radius: 8px; /* 圆角 */
  background-color: #555; /* 未激活时的灰色 */
  transition: background-color 0.3s ease; /* 过渡效果 */
}

/* 激活时的颜色 (红色) */
.hp-segment.player1.active {
  background-color: #FF0000; /* 红色 */
}

/* 激活时的颜色 (红色) - 保持一致 */
.hp-segment.player2.active {
  background-color: #FF0000; /* 红色 */
}

/* 新增 Canvas 容器样式 */
.canvas-wrapper {
  width: 100%;
  /* height: 0; */ /* 用于保持宽高比，但JS已处理 */
  /* padding-bottom: 75%; */ /* 4:3 宽高比 (600/800)，但JS已处理 */
  position: relative;
  margin-bottom: 15px; /* 与下方内容间距 */
}

/* --- 新增：设置 Canvas 背景色 --- */
canvas {
  display: block; /* 移除默认的 inline 空白 */
  width: 100%; /* 宽度填充容器 */
  height: 100%; /* 高度填充容器 */
  background-color: #121212; /* 设置背景色 */
}
/* ----------------------------- */

h1 {
  margin-bottom: 10px;
  color: #333;
}

/* 移除或注释掉旧的 hp-display 样式 */
/* .hp-display {
    position: absolute;
    top: 30px; 
    left: 30px;
    background-color: rgba(255, 255, 255, 0.7);
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 14px;
} */

.game-over-message {
    position: absolute;
    top: 50%;
    left: 50%;
   transform: translate(-50%, -50%);
   transform: translate(-50%, -100%); /* 向上偏移一点，避免挡住画布中心 */
    /* background-color: rgba(0, 0, 0, 0.7); */
    color: white;
    padding: 20px 40px;
    border-radius: 10px;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
}

/* 媒体查询：针对小屏幕进行调整 */
@media (max-width: 768px) {
  .canvas-collision-container {
    padding: 5px;
  }

  h1 {
    font-size: 1.3em;
    margin-bottom: 10px;
  }

  .hp-bars-container {
    margin-bottom: 10px;
  }

  .player-name {
    font-size: 0.9em;
  }

  .hp-segment {
    width: 25px; /* 进一步缩小血量格 */
    height: 12px;
    border-radius: 6px;
  }

  .hp-bar {
    gap: 3px;
  }

  .game-over-message {
    font-size: 1em;
    padding: 10px 15px;
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: 1.1em;
  }

  .player-name {
    font-size: 0.8em;
  }

  .hp-segment {
    width: 18px; /* 更小屏幕，更小的血量格 */
    height: 10px;
    border-radius: 5px;
  }

  .hp-bar {
    gap: 2px;
  }
}
</style>
