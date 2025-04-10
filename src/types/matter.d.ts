import * as Matter from 'matter-js'

declare module 'matter-js' {
  interface Body {
    isWall?: boolean
    label?: string
    circleRadius?: number
  }
} 