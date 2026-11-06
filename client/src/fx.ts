import { Container, Graphics, Sprite } from 'pixi.js'
import type { ShotArt } from './shotArt'

interface Boom { g: Graphics; age: number; r: number }
interface Bolt { g: Graphics; age: number }

const BOOM_S = 0.4
const BOLT_S = 0.3
const BOLT_HEIGHT = 900

/** Hiệu ứng tạm: đạn đang bay (nhiều viên), vòng nổ mở rộng, tia sét, rung màn hình. */
export class Fx {
  readonly container = new Container()
  shakeX = 0
  shakeY = 0
  private booms: Boom[] = []
  private bolts: Bolt[] = []
  private shake = 0
  private readonly shells: Graphics[] = []
  private readonly shellSprites: Sprite[] = []
  private shellArt: ShotArt | null = null
  private readonly shellPos: { x: number; y: number; visible: boolean }[] = []

  /** Ảnh đạn cho phát bắn sắp phát lại (null = đạn tròn mặc định). */
  setShellArt(art: ShotArt | null): void {
    this.shellArt = art
    for (const s of this.shellSprites) if (art) { s.texture = art.tex; s.scale.set(art.length / art.tex.width) }
  }

  /** Đặt vị trí/hiện-ẩn viên đạn thứ `i` (tạo mới nếu chưa có); `rot` = hướng bay (radian, theo trục màn hình). */
  setProjectile(i: number, x: number, y: number, visible: boolean, rot = 0): void {
    while (this.shells.length <= i) {
      const g = new Graphics().circle(0, 0, 5).fill(0x111111).stroke({ color: 0xffffff, width: 1.5 })
      g.visible = false
      this.container.addChild(g)
      this.shells.push(g)
      const s = new Sprite()
      s.anchor.set(0.5)
      s.visible = false
      if (this.shellArt) { s.texture = this.shellArt.tex; s.scale.set(this.shellArt.length / this.shellArt.tex.width) }
      this.container.addChild(s)
      this.shellSprites.push(s)
      this.shellPos.push({ x: 0, y: 0, visible: false })
    }
    const g = this.shells[i]!, s = this.shellSprites[i]!, p = this.shellPos[i]!
    const art = this.shellArt !== null
    g.visible = visible && !art
    s.visible = visible && art
    g.position.set(x, y)
    s.position.set(x, y)
    const a = this.shellArt
    if (a && a.upright) {
      const k = a.length / a.tex.width
      s.rotation = 0
      s.scale.set(Math.cos(rot) < 0 ? -k : k, k)
    } else s.rotation = rot
    p.x = x; p.y = y; p.visible = visible
  }

  hideProjectiles(): void {
    for (let i = 0; i < this.shells.length; i++) { this.shells[i]!.visible = false; this.shellSprites[i]!.visible = false; this.shellPos[i]!.visible = false }
  }

  /** Viên đạn đầu tiên đang hiện (camera bám theo), hoặc null. */
  lead(): { x: number; y: number } | null {
    for (const p of this.shellPos) if (p.visible) return p
    return null
  }

  explosion(x: number, y: number, r: number, shake = true): void {
    const g = new Graphics()
    g.position.set(x, y)
    this.container.addChild(g)
    this.booms.push({ g, age: 0, r })
    if (shake) this.shake = Math.max(this.shake, Math.min(14, r / 5))
  }

  /** Tia sét giáng thẳng xuống (x, y) từ trên cao. */
  bolt(x: number, y: number): void {
    const g = new Graphics()
    let cx = x + 10
    g.moveTo(cx, y - BOLT_HEIGHT)
    for (let i = 1; i <= 12; i++) {
      cx = i === 12 ? x : x + (((i * 7) % 5) - 2) * 9
      g.lineTo(cx, y - BOLT_HEIGHT + (BOLT_HEIGHT * i) / 12)
    }
    g.stroke({ color: 0xcfe8ff, width: 6, join: 'round' })
    this.container.addChild(g)
    this.bolts.push({ g, age: 0 })
    this.shake = Math.max(this.shake, 6)
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
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i]!
      b.age += dt
      if (b.age >= BOLT_S) { b.g.destroy(); this.bolts.splice(i, 1); continue }
      b.g.alpha = 1 - b.age / BOLT_S
    }
    this.shake = Math.max(0, this.shake - dt * 30)
    this.shakeX = this.shake > 0 ? (Math.random() * 2 - 1) * this.shake : 0
    this.shakeY = this.shake > 0 ? (Math.random() * 2 - 1) * this.shake : 0
  }

  get busy(): boolean { return this.booms.length > 0 || this.bolts.length > 0 }
}
