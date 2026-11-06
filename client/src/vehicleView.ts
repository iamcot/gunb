import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import { TEAM_NAMES, TUNING, aimDir, aimRange, type AimRange, type MatchState, type PlayerState, type Vec2 } from '@gunb/shared'
import { preloadShotArt } from './shotArt'

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
  pilot?: [number, number]      // chỗ phi công ngồi (điểm hông đặt lên ghế)
  reverse?: boolean             // xe bắn bằng đuôi: khi ngắm thì quay đít về phía địch (ảnh bị lật so với hướng bắn)
  barrelBehind?: boolean        // nòng vẽ sau thân (bệ súng che đuôi nòng)
  catapult?: boolean            // máy bắn đá: cần đứng yên khi ngắm (chỉ tia ngắm xoay), lúc bắn vung qua đầu rồi về
}
interface RigArt { rig: Rig; body: Texture; barrel: Texture; pilot: PilotArt | null }
/** Sprite của một xe: `frame` nghiêng theo dốc và lật theo hướng, chứa thân + nòng. */
interface Art { frame: Container; body: Sprite; barrel: Sprite; top: number; flip: 1 | -1; catapult: boolean; swingT: number }

/** Cú vung của máy bắn đá (chỉ là hình): góc vung (độ), thời gian vung lên / giữ / hạ về (giây). */
const SWING_DEG = 125, SWING_UP = 0.18, SWING_HOLD = 0.12, SWING_BACK = 0.6

const rigCache = new Map<string, Promise<RigArt | null>>()

/** `assets/pilots/<id>/pilot.json`: ảnh phi công ngồi, điểm hông (chuẩn hoá 0..1), chiều cao khi ngồi (px bản đồ). */
interface PilotInfo { sit: string; hip: [number, number]; sitHeight: number }
interface PilotArt { info: PilotInfo; sit: Texture }
const PILOT_ID = 'nam'   // chưa có chọn nhân vật: mọi xe dùng phi công nam
let pilotPromise: Promise<PilotArt | null> | null = null
function loadPilot(): Promise<PilotArt | null> {
  if (!pilotPromise) {
    const base = `/pilots/${PILOT_ID}/`
    pilotPromise = (async () => {
      const res = await fetch(base + 'pilot.json')
      if (!res.ok) return null
      const info = await res.json() as PilotInfo
      return { info, sit: Texture.from(await loadImage(base + info.sit)) }
    })().catch(() => null)
  }
  return pilotPromise
}

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
      const [body, barrel, pilot] = await Promise.all([loadImage(base + rig.body), loadImage(base + rig.barrel), rig.pilot ? loadPilot() : null])
      return { rig, body: Texture.from(body), barrel: Texture.from(barrel), pilot }
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
  private readonly range: AimRange = { min: 0, max: 90 }
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
      preloadShotArt(p.mobileId)
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
    if (rig.barrelBehind) frame.addChild(barrel, body)
    else frame.addChild(body, barrel)
    if (rig.pilot && ra.pilot) {
      // phi công ngồi trên ghế, vẽ trên thân và dưới nòng (nòng sau thân thì vẽ trên cùng); xe lật ngược thì lật lại để phi công nhìn về phía đầu xe
      const pi = ra.pilot.info
      const pilot = new Sprite(ra.pilot.sit)
      pilot.anchor.set(pi.hip[0], pi.hip[1])
      const pk = pi.sitHeight / ra.pilot.sit.height
      pilot.scale.set(pk * flip, pk)
      pilot.position.set((rig.pilot[0] - rig.ground[0]) * ra.body.width * k, radius + (rig.pilot[1] - rig.ground[1]) * ra.body.height * k)
      frame.addChildAt(pilot, frame.getChildIndex(body) + 1)
    }
    v.root.addChildAt(frame, 0)
    v.body.visible = false
    v.barrel.visible = false
    v.art = { frame, body, barrel, top: radius - ra.body.height * k, flip, catapult: rig.catapult === true, swingT: -1 }
  }

  /** `shownHp`: máu đang hiển thị (có thể chậm hơn trạng thái trận khi đang phát lại phát bắn). */
  update(dt: number, match: MatchState, shownHp: ReadonlyMap<number, number>): void {
    this.bob += dt * 6
    for (const v of this.views.values()) if (v.art && v.art.swingT >= 0) v.art.swingT += dt
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
      if (a.catapult) {
        a.barrel.rotation = this.swingRad(a)
        this.drawLabels(v, p, hp, alive, isCur, a.top)
        return
      }
      // góc bắn so với phương ngang; khung đã nghiêng theo dốc nên nòng so với thân = góc − độ dốc theo hướng bắn
      const d = aimDir(this.tmp, p.aimAngle, 1, -b.facing * b.tilt)
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
    const d = aimDir(this.tmp, p.aimAngle, b.facing)
    v.barrel.moveTo(0, -4).lineTo(d.x * 30, -4 + d.y * 30).stroke({ color: 0x1e293b, width: 6, cap: 'round' })
    v.barrel.circle(0, -4, 5).fill(0x1e293b)
    this.drawLabels(v, p, hp, alive, isCur, -30)
  }

  /** Phát hình vung cần (máy bắn đá) của xe `id` khi bắn; xe khác không làm gì. */
  fireAnim(id: number): void {
    const a = this.views.get(id)?.art
    if (a && a.catapult) a.swingT = 0
  }

  /** Góc quay cần máy bắn đá theo thời gian vung (radian, dương = theo chiều kim đồng hồ: hất về phía trước). */
  private swingRad(a: Art): number {
    const t = a.swingT
    let k = 0
    if (t < 0) k = 0
    else if (t < SWING_UP) { const u = t / SWING_UP; k = 1 - (1 - u) * (1 - u) }
    else if (t < SWING_UP + SWING_HOLD) k = 1
    else if (t < SWING_UP + SWING_HOLD + SWING_BACK) k = 1 - (t - SWING_UP - SWING_HOLD) / SWING_BACK
    else a.swingT = -1
    const d = aimDir(this.tmp, SWING_DEG * k, 1)
    return Math.atan2(-d.y, d.x)
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

  /** Hình quạt dải góc hợp lệ (aimRange của pháo, so với phương ngang) + vạch góc hiện tại của người đến lượt. */
  private drawFan(p: PlayerState): void {
    const b = p.body, g = this.fan
    const r = aimRange(this.range, TUNING.mobiles[p.mobileId]!, b.facing, b.tilt)
    g.moveTo(b.x, b.y - 4)
    for (let a = r.min; ; a = Math.min(a + 5, r.max)) {
      const d = aimDir(this.tmp, a, b.facing)
      g.lineTo(b.x + d.x * FAN_RADIUS, b.y - 4 + d.y * FAN_RADIUS)
      if (a >= r.max) break
    }
    g.closePath().fill({ color: 0xffffff, alpha: 0.14 })
    const d = aimDir(this.tmp, p.aimAngle, b.facing)
    g.moveTo(b.x, b.y - 4).lineTo(b.x + d.x * FAN_RADIUS, b.y - 4 + d.y * FAN_RADIUS).stroke({ color: 0xffffff, width: 2, alpha: 0.8 })
  }

  destroy(): void { this.container.destroy({ children: true }) }
}

export const teamName = (team: 0 | 1): string => TEAM_NAMES[team]
