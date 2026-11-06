import { Container, Graphics } from 'pixi.js'

interface Boom { g: Graphics; age: number; r: number }

const BOOM_S = 0.4

/** Hiệu ứng tạm: vòng nổ mở rộng + rung màn hình. */
export class Fx {
  readonly container = new Container()
  shakeX = 0
  shakeY = 0
  private booms: Boom[] = []
  private shake = 0

  explosion(x: number, y: number, r: number): void {
    const g = new Graphics()
    g.position.set(x, y)
    this.container.addChild(g)
    this.booms.push({ g, age: 0, r })
    this.shake = Math.max(this.shake, Math.min(14, r / 5))
  }

  update(dt: number): void {
    for (let i = this.booms.length - 1; i >= 0; i--) {
      const b = this.booms[i]!
      b.age += dt
      const k = b.age / BOOM_S
      if (k >= 1) { b.g.destroy(); this.booms.splice(i, 1); continue }
      b.g.clear()
      b.g.circle(0, 0, b.r * (0.3 + 0.7 * k)).fill({ color: 0xffb030, alpha: 0.7 * (1 - k) })
      b.g.circle(0, 0, b.r * (0.15 + 0.5 * k)).fill({ color: 0xfff2b0, alpha: 0.9 * (1 - k) })
    }
    this.shake = Math.max(0, this.shake - dt * 30)
    this.shakeX = this.shake > 0 ? (Math.random() * 2 - 1) * this.shake : 0
    this.shakeY = this.shake > 0 ? (Math.random() * 2 - 1) * this.shake : 0
  }

  get busy(): boolean { return this.booms.length > 0 }
}
