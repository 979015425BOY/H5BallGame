import Matter from 'matter-js'
import { GAME_CONFIG } from './config'

export class Player {
  public body: Matter.Body
  public lives: number

  constructor(x: number, y: number, color: string) {
    this.body = Matter.Bodies.circle(x, y, GAME_CONFIG.playerRadius, {
      restitution: 1,
      friction: 0,
      frictionAir: 0,
      render: {
        fillStyle: color
      }
    })
    this.lives = GAME_CONFIG.initialLives
  }

  public move(x: number, y: number) {
    if (!this.body || !this.body.position) return;
    Matter.Body.applyForce(this.body, this.body.position, {
      x: x * GAME_CONFIG.playerSpeed,
      y: y * GAME_CONFIG.playerSpeed
    })
  }

  public damage() {
    this.lives--
    return this.lives
  }

  public heal() {
    if (this.lives < GAME_CONFIG.initialLives) {
      this.lives++
    }
    return this.lives
  }

  public destroy() {
    if (this.body) {
      Matter.Composite.remove(engine.world, this.body);
      this.body = null;
    }
  }
}