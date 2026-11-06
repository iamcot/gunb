import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import { TEAM_NAMES, TUNING, aimDir, type MatchState, type PlayerState, type Vec2 } from '@gunb/shared'

export const TEAM_COLORS = [0x3b82f6, 0xef4444] as const
const TEAM_DARK = [0x0a2a5e, 0x5e0a0a] as const
const FAN_RADIUS = 80

interface View { root: Container; body: Graphics; barrel: Graphics; bar: Graphics; name: Text; marker: Text; art: Art | null }

/** `assets/mobiles/<id>/rig.json`. Toạ độ chuẩn hoá 0..1 theo ảnh tương ứng. */
interface Rig {
  body: string; barrel: string
  width: number                 // bề rộng thân khi vẽ (px bản đồ)
  ground: [number, number]      // điểm trên ảnh thân đặt tại đáy xe (b.x, b.y + radius)
  pivot: [number, number]       // điểm gắn nòng trên ảnh thân
  barrelPivot: [number, number] // tâm xoay trên ảnh nòng (nòng vẽ nằm ngang, chĩa sang phải)
  muzzle: [number, number]      // đầu nòng trên ảnh nòng
  pilot?: [number, number]      // chỗ ngồi phi công (chưa dùng)
  reverse?: boolean             // xe bắn bằng đuôi: khi ngắm thì quay đít về phía địch (ảnh bị lật so với hướng bắn)
  barrelMax?: number            // độ: nòng chỉ tự xoay tới góc này, cao hơn thì cả thân nghiêng thêm phần còn lại (chỉ là hình)
  tiltPivot?: [number, number]  // điểm trên ảnh thân làm trục khi nghiêng cả thân (thường là chân phía đầu)
}
interface RigArt { rig: Rig; body: Texture; barrel: Texture }
/** Sprite của một xe: `frame` nghiêng theo dốc và lật theo hướng, chứa thân + nòng. */
interface Art { frame: Container; tilt: Container; body: Sprite; barrel: Sprite; top: number; flip: 1 | -1; barrelMax: number }

const rigCache = new Map<string, Promise<RigArt | null>>()

async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = url
  await img.decode()
  return img
}

/** Tải ảnh xe nếu có (`/mobiles/<id>/rig.json`); không có thì trả null để vẽ hình khối. */
function loadRig(mobileId: string): Promise<RigArt | null> {
  let p = rigCache.get(mobileId)
  if (!p) {
    const base = `/mobiles/${encodeURIComponent(mobileId)}/`
    p = (async () => {
      const res = await fetch(base + 'rig.json')
      if (!res.ok) return null
      const rig = await res.json() as Rig
      const [body, barrel] = await Promise.all([loadImage(base + rig.body), loadImage(base + rig.barrel)])
      return { rig, body: Texture.from(body), barrel: Texture.from(barrel) }
    })().catch(() => null)
    rigCache.set(mobileId, p)
  }
  return p
}

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
      const view: View = { root, body, barrel, bar, name, marker, art: null }
      this.views.set(p.id, view)
      void loadRig(p.mobileId).then(ra => { if (ra && !root.destroyed) this.attachArt(view, ra, p.body.radius) })
    }
  }

  private attachArt(v: View, ra: RigArt, radius: number): void {
    const { rig } = ra
    const k = rig.width / ra.body.width
    const frame = new Container()
    const body = new Sprite(ra.body)
    body.anchor.set(rig.ground[0], rig.ground[1])
    body.scale.set(k)
    body.position.set(0, radius)
    const barrel = new Sprite(ra.barrel)
    barrel.anchor.set(rig.barrelPivot[0], rig.barrelPivot[1])
    const flip = rig.reverse ? -1 : 1
    barrel.scale.set(k * flip, k)
    barrel.position.set((rig.pivot[0] - rig.ground[0]) * ra.body.width * k, radius + (rig.pivot[1] - rig.ground[1]) * ra.body.height * k)
    const tilt = new Container()
    const tp = rig.tiltPivot ?? rig.ground
    const tx = (tp[0] - rig.ground[0]) * ra.body.width * k, ty = radius + (tp[1] - rig.ground[1]) * ra.body.height * k
    tilt.pivot.set(tx, ty)
    tilt.position.set(tx, ty)
    tilt.addChild(body, barrel)
    frame.addChild(tilt)
    v.root.addChildAt(frame, 0)
    v.body.visible = false
    v.barrel.visible = false
    v.art = { frame, tilt, body, barrel, top: radius - ra.body.height * k, flip, barrelMax: rig.barrelMax ?? 90 }
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
    if (v.art) {
      const a = v.art
      a.frame.rotation = -b.tilt
      a.frame.scale.x = b.facing * a.flip
      a.body.tint = a.barrel.tint = alive ? 0xffffff : 0x777777
      // nòng tự xoay tới barrelMax độ; góc cao hơn thì cả thân nghiêng thêm phần còn lại (phía có nòng nhấc lên)
      const bodyDeg = Math.max(0, p.aimAngle - a.barrelMax)
      const t = aimDir(this.tmp, bodyDeg, 1, 0)
      a.tilt.rotation = -a.flip * Math.atan2(-t.y, t.x)
      const d = aimDir(this.tmp, p.aimAngle - bodyDeg, 1, 0)   // hướng nòng so với thân (khung đã lật + nghiêng)
      // xe lật ngược (reverse): khung bị lật thêm một lần và ảnh nòng cũng lật, nên góc quay đổi dấu
      a.barrel.rotation = Math.atan2(d.y * a.flip, d.x)
      this.drawLabels(v, p, hp, alive, isCur, a.top)
      return
    }
    v.body.clear()
    v.body.rotation = -b.tilt
    v.body.roundRect(-r, -r * 0.6, r * 2, r * 1.2, 5).fill(alive ? TEAM_COLORS[p.team] : 0x777777).stroke({ color: TEAM_DARK[p.team], width: 2 })
    v.body.roundRect(-r * 0.9, r * 0.45, r * 1.8, r * 0.35, 4).fill(0x1f2937)
    v.barrel.clear()
    const d = aimDir(this.tmp, p.aimAngle, b.facing, b.tilt)
    v.barrel.moveTo(0, -4).lineTo(d.x * 30, -4 + d.y * 30).stroke({ color: 0x1e293b, width: 6, cap: 'round' })
    v.barrel.circle(0, -4, 5).fill(0x1e293b)
    this.drawLabels(v, p, hp, alive, isCur, -30)
  }

  /** Thanh máu, tên, mũi tên lượt; `top` là mép trên của hình xe (so với tâm). */
  private drawLabels(v: View, p: PlayerState, hp: number, alive: boolean, isCur: boolean, top: number): void {
    v.bar.clear()
    if (alive) {
      const w = 40, k = Math.max(0, Math.min(1, hp / p.maxHp))
      v.bar.rect(-w / 2, top - 8, w, 5).fill(0x000000)
      v.bar.rect(-w / 2 + 1, top - 7, (w - 2) * k, 3).fill(k > 0.5 ? 0x4ade80 : k > 0.25 ? 0xfacc15 : 0xef4444)
    }
    v.name.position.set(0, top - 14)
    v.marker.visible = isCur
    v.marker.position.set(0, top - 28 + Math.sin(this.bob) * 3)
  }

  /** Hình quạt dải góc hợp lệ (angleMin..angleMax của pháo) + vạch góc hiện tại của người đến lượt. */
  private drawFan(p: PlayerState): void {
    const b = p.body, g = this.fan
    const def = TUNING.mobiles[p.mobileId]!
    g.moveTo(b.x, b.y - 4)
    for (let a = def.angleMin; a <= def.angleMax; a += 5) {
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
