import { Container, Graphics, Text } from 'pixi.js'
import { aimDir, groundYBelow, slopeAt, type ShotVehicle, type TerrainMask } from '@gunb/shared'

const SHOOTER_R = 18
const TARGET_R = 20
const SHOOTER_HALF_W = 14

interface TargetView { v: ShotVehicle; g: Graphics; label: Text }

/** Chế độ tập bắn (Phase 1): một xe đứng yên ở bên trái và 3 bia cách 450 / 800 / 1200 px. Chưa có di chuyển/rơi (Phase 2). */
export class Practice {
  readonly container = new Container()
  readonly shooter: ShotVehicle
  readonly vehicles: ShotVehicle[]
  facing: 1 | -1 = 1
  private readonly shooterGfx = new Graphics()
  private readonly barrelGfx = new Graphics()
  private readonly targets: TargetView[] = []
  private readonly dirTmp = { x: 0, y: 0 }
  private angle = 45

  constructor(private readonly mask: TerrainMask) {
    const sx = this.flattestX(150, 600)
    this.shooter = { id: 1, x: sx, y: this.groundCenterY(sx, SHOOTER_R), radius: SHOOTER_R, hp: 100, armor: 0 }
    this.vehicles = [this.shooter]
    this.container.addChild(this.shooterGfx, this.barrelGfx)
    ;[450, 800, 1200].forEach((dx, i) => {
      const x = sx + dx
      const v: ShotVehicle = { id: 2 + i, x, y: this.groundCenterY(x, TARGET_R), radius: TARGET_R, hp: 100, armor: 0 }
      const g = new Graphics()
      const label = new Text({ text: '100', style: { fill: 0xffffff, fontSize: 14, fontWeight: '700', stroke: { color: 0x000000, width: 3 } } })
      label.anchor.set(0.5, 1)
      label.position.set(x, v.y - TARGET_R - 4)
      this.container.addChild(g, label)
      this.targets.push({ v, g, label })
      this.vehicles.push(v)
    })
    this.drawTargets()
  }

  /** Cột phẳng nhất trong [x1, x2] (quét mỗi 10 px) để xe bắt đầu không đứng trên dốc gắt. */
  private flattestX(x1: number, x2: number): number {
    let best = x1, bestSlope = Infinity
    for (let x = x1; x <= x2; x += 10) {
      const s = Math.abs(slopeAt(this.mask, x, 0, SHOOTER_HALF_W))
      if (s < bestSlope) { bestSlope = s; best = x }
    }
    return best
  }

  private groundCenterY(x: number, r: number): number {
    const gy = groundYBelow(this.mask, x, 0)
    return (gy < 0 ? this.mask.height : gy) - r
  }

  get tilt(): number { return slopeAt(this.mask, this.shooter.x, 0, SHOOTER_HALF_W) }

  setAngle(angle: number): void { this.angle = angle }

  applyDamage(id: number, hpAfter: number): void {
    const v = this.vehicles.find(t => t.id === id)
    if (v) v.hp = hpAfter
    this.drawTargets()
  }

  resetHp(): void {
    for (const v of this.vehicles) v.hp = 100
    this.drawTargets()
  }

  /** Vẽ lại xe bắn: thân nghiêng theo dốc, nòng theo góc bắn. */
  draw(): void {
    const s = this.shooter, tilt = this.tilt
    const body = this.shooterGfx, barrel = this.barrelGfx
    body.clear()
    body.position.set(s.x, s.y)
    body.rotation = -tilt   // dốc lên bên phải = quay ngược chiều kim đồng hồ trên màn hình
    body.roundRect(-SHOOTER_R, -SHOOTER_R * 0.6, SHOOTER_R * 2, SHOOTER_R * 1.2, 5).fill(s.hp > 0 ? 0x3b82f6 : 0x555555).stroke({ color: 0x0a2a5e, width: 2 })
    barrel.clear()
    barrel.position.set(s.x, s.y)
    const d = aimDir(this.dirTmp, this.angle, this.facing, tilt)
    barrel.moveTo(0, -4).lineTo(d.x * 30, -4 + d.y * 30).stroke({ color: 0x1e293b, width: 6, cap: 'round' })
    barrel.circle(0, -4, 5).fill(0x1e293b)
  }

  private drawTargets(): void {
    for (const t of this.targets) {
      t.g.clear()
      t.g.position.set(t.v.x, t.v.y)
      const alive = t.v.hp > 0
      t.g.circle(0, 0, TARGET_R).fill(alive ? 0xdc2626 : 0x4b5563).stroke({ color: 0x450a0a, width: 3 })
      t.g.circle(0, 0, TARGET_R * 0.55).stroke({ color: 0xffffff, width: 2 })
      t.label.text = String(t.v.hp)
      t.label.alpha = alive ? 1 : 0.5
    }
  }
}
