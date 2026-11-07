import { Container, Graphics, Text } from 'pixi.js'
import { groundYBelow, slopeAt, type ShotVehicle, type TerrainMask } from '@gunb/shared'

const SHOOTER_R = 18
const TARGET_R = 20
const SHOOTER_HALF_W = 14

interface TargetView { v: ShotVehicle; g: Graphics; label: Text }

/** Chế độ tập bắn: một xe đứng yên ở đầu trái phần đất liền và 3 bia cách 450 / 800 / 1200 px (bia rơi ra ngoài đất thì dời về cột có đất gần nhất).
 *  Xe bắn được vẽ bằng VehicleViews ở PracticeMode (đúng ảnh xe đã chọn); lớp này chỉ giữ vị trí + vẽ bia. */
export class Practice {
  readonly container = new Container()
  readonly shooter: ShotVehicle
  readonly vehicles: ShotVehicle[]
  facing: 1 | -1 = 1
  private readonly targets: TargetView[] = []

  constructor(private readonly mask: TerrainMask) {
    // bản đồ có thể là đảo nổi giữa trời: chỉ xét các cột có đất
    let left = -1, right = -1
    for (let x = 0; x < mask.width; x += 10) if (groundYBelow(mask, x, 0) >= 0) { if (left < 0) left = x; right = x }
    if (left < 0) { left = 0; right = mask.width - 1 }
    const sx = this.flattestX(Math.min(left + 60, right), Math.min(left + 450, right))
    this.shooter = { id: 1, mobileId: 'oc-thiet-giap', x: sx, y: this.groundCenterY(sx, SHOOTER_R), radius: SHOOTER_R, hp: 1000, armor: 0 }
    this.vehicles = [this.shooter]
    ;[450, 800, 1200].forEach((dx, i) => {
      const x = this.nearestGroundX(Math.min(sx + dx, right - TARGET_R))
      const v: ShotVehicle = { id: 2 + i, mobileId: 'oc-thiet-giap', x, y: this.groundCenterY(x, TARGET_R), radius: TARGET_R, hp: 1000, armor: 0 }
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
      if (groundYBelow(this.mask, x, 0) < 0) continue
      const s = Math.abs(slopeAt(this.mask, x, 0, SHOOTER_HALF_W))
      if (s < bestSlope) { bestSlope = s; best = x }
    }
    return best
  }

  /** Cột có đất gần `x` nhất (quét ra hai bên mỗi 5 px). */
  private nearestGroundX(x: number): number {
    for (let d = 0; d < this.mask.width; d += 5) {
      if (groundYBelow(this.mask, x - d, 0) >= 0) return x - d
      if (groundYBelow(this.mask, x + d, 0) >= 0) return x + d
    }
    return x
  }

  private groundCenterY(x: number, r: number): number {
    const gy = groundYBelow(this.mask, x, 0)
    return (gy < 0 ? this.mask.height : gy) - r
  }

  get tilt(): number { return slopeAt(this.mask, this.shooter.x, 0, SHOOTER_HALF_W) }

  /** Đổi xe bắn: bán kính theo xe, đặt lại trên mặt đất. */
  setMobile(id: string, radius: number): void {
    const s = this.shooter
    s.mobileId = id; s.radius = radius; s.y = this.groundCenterY(s.x, radius)
  }

  applyDamage(id: number, hpAfter: number): void {
    const v = this.vehicles.find(t => t.id === id)
    if (v) v.hp = hpAfter
    this.drawTargets()
  }

  resetHp(): void {
    for (const v of this.vehicles) v.hp = 1000
    this.drawTargets()
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
