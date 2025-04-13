import Matter from 'matter-js'
import { GAME_CONFIG } from './config'

export class PowerUp {
  public body: Matter.Body
  public type: 'spike' | 'heart'

  constructor() {
    this.type = Math.random() > 0.5 ? 'spike' : 'heart'
    
    this.body = Matter.Bodies.circle(
      this.getRandomPosition().x,
      this.getRandomPosition().y,
      GAME_CONFIG.powerUpRadius,
      {
        isSensor: true,
        render: {
          fillStyle: this.type === 'spike' ? '#ff0000' : '#ff69b4'
        }
      }
    )
  }

  private getRandomPosition() {
    const boundary = GAME_CONFIG.boundaryThickness;
    const minX = boundary;
    const maxX = GAME_CONFIG.gameWidth - boundary;
    const minY = boundary;
    const maxY = GAME_CONFIG.gameHeight - boundary;
    
    return {
      x: Math.random() * (maxX - minX) + minX,
      y: Math.random() * (maxY - minY) + minY
    };
  }
}