import { Container, Graphics, Text } from 'pixi.js'
import { ANGLE_MAX, ANGLE_MIN, TEAM_NAMES, aimDir, type MatchState, type PlayerState, type Vec2 } from '@gunb/shared'

export const TEAM_COLORS = [0x3b82f6, 0xef4444] as const
const TEAM_DARK = [0x0a2a5e, 0x5e0a0a] as const
const FAN_RADIUS = 80

interface View { root: Container; body: Graphics; barrel: Graphics; bar: Graphics; marker: Text }

/** Vẽ xe (hình khối tạm) cho mọi người chơi: thân nghiêng theo dốc, nòng xoay theo góc, tên + thanh máu, mũi tên người đến lượt, hình quạt dải góc. */
export class VehicleViews {
  readonly container = new Container()
  private readonly fan = new Graphics()
  private readonly views = new Map<number, View>()
  private readonly tmp: Vec2 = { x: 0, y: 0 }
  private bob = 0

  constructor(match: MatchState) {
    this.container.addChild(this.fan)
    for (const p of match.players) {
      const root = new Container()
      const body = new Graphics(), barrel = new Graphics(), bar = new Graphics()
      const name = new Text({ text: p.name, style: { fill: 0xffffff, fontSize: 12, fontWeight: '700', stroke: { color: 0x000000, width: 3 } } })
      name.anchor.set(0.5, 1)
      name.position.set(0, -44)
      const marker = new Text({ text: '▼', style: { fill: 0xffe14d, fontSize: 18, stroke: { color: 0x000000, width: 3 } } })
      marker.anchor.set(0.5, 1)
      marker.visible = false
      root.addChild(body, barrel, bar, name, marker)
      this.container.addChild(root)
      this.views.set(p.id, { root, body, barrel, bar, marker })
    }
  }

  /** `shownHp`: máu đang hiển thị (có thể chậm hơn trạng thái trận khi đang phát lại phát bắn). */
  update(dt: number, match: MatchState, shownHp: ReadonlyMap<number, number>): void {
    this.bob += dt * 6
    this.fan.clear()
    for (const p of match.players) {
      const v = this.views.get(p.id)!
      const hp = shownHp.get(p.id) ?? p.hp
      const alive = p.body.alive && (hp > 0 || p.hp > 0)
      const isCur = p.id === match.turnPlayerId && match.phase === 'aiming'
      this.drawOne(v, p, hp, alive, isCur)
      if (isCur) this.drawFan(p)
    }
  }

  private drawOne(v: View, p: PlayerState, hp: number, alive: boolean, isCur: boolean): void {
    const b = p.body, r = b.radius
    v.root.position.set(b.x, b.y)
    v.root.alpha = alive ? 1 : 0.35
    v.root.visible = b.alive || hp > 0 || true
    v.body.clear()
    v.body.rotation = -b.tilt
    v.body.roundRect(-r, -r * 0.6, r * 2, r * 1.2, 5).fill(alive ? TEAM_COLORS[p.team] : 0x777777).stroke({ color: TEAM_DARK[p.team], width: 2 })
    v.body.roundRect(-r * 0.9, r * 0.45, r * 1.8, r * 0.35, 4).fill(0x1f2937)
    v.barrel.clear()
    const d = aimDir(this.tmp, p.aimAngle, b.facing, b.tilt)
    v.barrel.moveTo(0, -4).lineTo(d.x * 30, -4 + d.y * 30).stroke({ color: 0x1e293b, width: 6, cap: 'round' })
    v.barrel.circle(0, -4, 5).fill(0x1e293b)
    v.bar.clear()
    if (alive) {
      const w = 40, k = Math.max(0, Math.min(1, hp / p.maxHp))
      v.bar.rect(-w / 2, -38, w, 5).fill(0x000000)
      v.bar.rect(-w / 2 + 1, -37, (w - 2) * k, 3).fill(k > 0.5 ? 0x4ade80 : k > 0.25 ? 0xfacc15 : 0xef4444)
    }
    v.marker.visible = isCur
    v.marker.position.set(0, -58 + Math.sin(this.bob) * 3)
  }

  /** Hình quạt dải góc hợp lệ (ANGLE_MIN..ANGLE_MAX) + vạch góc hiện tại của người đến lượt. */
  private drawFan(p: PlayerState): void {
    const b = p.body, g = this.fan
    g.moveTo(b.x, b.y - 4)
    for (let a = ANGLE_MIN; a <= ANGLE_MAX; a += 5) {
      const d = aimDir(this.tmp, a, b.facing, b.tilt)
      g.lineTo(b.x + d.x * FAN_RADIUS, b.y - 4 + d.y * FAN_RADIUS)
    }
    g.closePath().fill({ color: 0xffffff, alpha: 0.14 })
    const d = aimDir(this.tmp, p.aimAngle, b.facing, b.tilt)
    g.moveTo(b.x, b.y - 4).lineTo(b.x + d.x * FAN_RADIUS, b.y - 4 + d.y * FAN_RADIUS).stroke({ color: 0xffffff, width: 2, alpha: 0.8 })
  }

  destroy(): void { this.container.destroy({ children: true }) }
}

export const teamName = (team: 0 | 1): string => TEAM_NAMES[team]
