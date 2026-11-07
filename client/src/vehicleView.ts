import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import { TEAM_NAMES, TUNING, aimDir, aimRange, type AimRange, type MatchState, type PlayerState, type Vec2 } from '@gunb/shared'
import type { Fx } from './fx'
import { preloadShotArt } from './shotArt'

export const TEAM_COLORS = [0x3b82f6, 0xef4444] as const
const TEAM_DARK = [0x0a2a5e, 0x5e0a0a] as const
const TEAM_LIGHT = [0xbfe0ff, 0xffc4c4] as const
const BAR_W = 60, BAR_H = 9, BAR_GAP = 8, BAR_SEGS = 4   // thanh máu dưới xe: bề rộng, cao, cách đáy xe, số ô
const RING_IN = 62, RING_OUT = 94   // thước ngắm: bán kính trong / ngoài của cung dày (tâm = gốc nòng; trong 62px là khoảng trống quanh xe)
const ARC_GREEN = 0x4fb35a, ARC_BANDS = 16   // màu cung cho phép (đậm ở mép ngoài); số dải đồng tâm tạo gradient
const ARC_EXTEND2 = 0.2
const ARC_EXTEND = 0.3, DEG = Math.PI / 180   // cung vẽ thêm 30% bề rộng dải góc ở mỗi đầu
const NEEDLE_W = 54, NEEDLE_ANCHOR_X = 0.97, NEEDLE_ANCHOR_Y = 0.446   // ảnh kim: bề rộng khi vẽ (px) và toạ độ mũi trên ảnh (0..1)
const NEEDLE_ALPHA = 0.7   // kim hơi trong suốt cho đỡ thô
let needleTex: Texture | null = null
void loadImage('/ui/aim-needle.png').then(img => { needleTex = Texture.from(img) }).catch(() => { /* dùng mũi tên vẽ bằng code */ })
const NEEDLE_COLOR = 0x5ec4ff
/** Con trỏ mũi tên: các cặp (lùi dọc kim, lệch ngang) quanh mũi ở (0,0). */
const NEEDLE: readonly number[] = [0, 0, 24, 11, 17, 3.5, 34, 3.5, 34, -3.5, 17, -3.5, 24, -11]

interface View {
  root: Container; body: Graphics; barrel: Graphics; bar: Graphics; name: Text; marker: Text; art: Art | null
  // chuyển động phụ (chỉ là hình): lúc lắc khi đi, nhún khi bắn, giật khi trúng đạn
  lastX: number; moveAmt: number; phase: number; dustAcc: number; recoilT: number; hitT: number
  wasAlive: boolean   // để bắt đúng lúc xe chết (hiện hồn thoát xác)
}

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
interface Art { frame: Container; body: Sprite; barrel: Sprite; pilot: Sprite | null; top: number; flip: 1 | -1; catapult: boolean; swingT: number; radius: number; barrelX: number; barrelY: number; barrelSX: number; barrelSY: number }

/** Cú vung của máy bắn đá (chỉ là hình): góc vung (độ), thời gian vung lên / giữ / hạ về (giây). */
const SWING_DEG = 125, SWING_UP = 0.18, SWING_HOLD = 0.12, SWING_BACK = 0.6

/** Nhún khi bắn: nén nhanh trong RECOIL_ATTACK giây rồi bật lại như lò xo tắt dần. */
const RECOIL_ATTACK = 0.05, RECOIL_DAMP = 7, RECOIL_FREQ = 19, RECOIL_S = 0.9
const RECOIL_SQUASH = 0.14    // thân dẹt xuống tối đa 14%
const RECOIL_PUSH = 5         // px: cả xe lùi về sau
const RECOIL_KICK = 7         // px: nòng giật lùi dọc trục nòng
/** Nòng phình ra khi xe bật lên sau cú nhún (phần âm của u): to ngang thêm tối đa 45%, dài thêm 12%. */
const BULGE_FAT = 0.45, BULGE_LONG = 0.12, BULGE_FULL = 0.3   // |u| âm đạt BULGE_FULL thì phình hết cỡ
/** Tụ lực: độ nén thân thêm tối đa, rung ngang tối đa (px), nhịp (vòng/s) lúc lực 0 và lúc đầy. */
const CHARGE_SQUASH = 0.45, CHARGE_SHAKE = 1.2, CHARGE_HZ0 = 3, CHARGE_HZ1 = 8
/** Lúc lắc khi đi: pha tăng theo quãng đường (đi nhanh lắc nhanh). */
const WOBBLE_PER_PX = 0.14    // rad pha / px
const WOBBLE_ROT = 0.045      // rad nghiêng qua lại
const WOBBLE_BOB = 1.8        // px nảy lên
const WOBBLE_EASE = 8         // 1/s: tốc độ bắt đầu / dừng lắc
const DUST_EVERY = 14         // px: mỗi quãng này tung một cụm bụi
const TELEPORT_PX = 30        // dịch chuyển lớn hơn thế trong 1 frame = đặt lại vị trí, không tính là đi
/** Giật khi trúng đạn. */
const HIT_S = 0.35, HIT_SHAKE = 3
/** Hồn thoát xác khi xe chết: bay lên GHOST_RISE px/s trong GHOST_S s, mờ GHOST_ALPHA, to dần thêm GHOST_GROW, lắc ngang GHOST_SWAY px, rồi vỡ. */
const GHOST_S = 1.6, GHOST_RISE = 55, GHOST_ALPHA = 0.5, GHOST_GROW = 0.25, GHOST_SWAY = 10, GHOST_TINT = 0xd6ecff

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

/** Độ cao vệ tinh trên tâm xe (theo đạn `satellite` của xe), hoặc -1 nếu xe không có vệ tinh. */
function satAltitude(mobileId: string): number {
  const def = TUNING.mobiles[mobileId]
  if (!def) return -1
  for (const sh of def.shots) if (sh.behavior.kind === 'satellite') return sh.behavior.altitude
  return -1
}

/** Vẽ xe (hình khối tạm) cho mọi người chơi: thân nghiêng theo dốc, nòng xoay theo góc, tên + thanh máu, mũi tên người đến lượt, hình quạt dải góc. */
export class VehicleViews {
  readonly container = new Container()
  private readonly fan = new Graphics()
  private readonly needle = new Sprite()
  private readonly angleText = new Text({ text: '', style: { fontFamily: 'sans-serif', fontSize: 16, fontWeight: '700', fill: 0xffffff, stroke: { color: 0x1a2b3c, width: 4 } } })
  private readonly views = new Map<number, View>()
  private readonly tmp: Vec2 = { x: 0, y: 0 }
  private readonly range: AimRange = { min: 0, max: 90 }
  private bob = 0
  /** Xe đang tụ lực (id, mức 0..1; id < 0 = không ai): thân nhún và nòng phập phồng, càng đầy càng nhanh/mạnh. */
  private chargeId = -1
  private chargeK = 0
  private chargePhase = 0
  /** Hồn thoát xác đang bay (tạo lúc xe chết, không phải mỗi frame). */
  private readonly ghosts: { s: Sprite; x: number; y: number; t: number; sx: number; sy: number; ph: number }[] = []

  /** `fx`: nếu có thì tung bụi dưới bánh khi xe đi. */
  constructor(match: MatchState, private readonly fx: Fx | null = null) {
    this.container.addChild(this.fan)
    this.angleText.anchor.set(0.5, 0)
    this.angleText.visible = false
    this.container.addChild(this.needle, this.angleText)
    this.needle.visible = false
    for (const p of match.players) {
      const root = new Container()
      const body = new Graphics(), barrel = new Graphics(), bar = new Graphics()
      const name = new Text({ text: p.name, style: { fill: 0xffffff, fontSize: 12, fontWeight: '700', stroke: { color: TEAM_DARK[p.team], width: 3.5 } } })
      name.anchor.set(0.5, 0)
      const marker = new Text({ text: '▼', style: { fill: 0xffe14d, fontSize: 18, stroke: { color: 0x000000, width: 3 } } })
      marker.anchor.set(0.5, 1)
      marker.visible = false
      root.addChild(body, barrel, bar, name, marker)
      this.container.addChild(root)
      const view: View = { root, body, barrel, bar, name, marker, art: null, lastX: p.body.x, moveAmt: 0, phase: 0, dustAcc: 0, recoilT: -1, hitT: -1, wasAlive: p.body.alive }
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
    let pilotSprite: Sprite | null = null
    if (rig.pilot && ra.pilot) {
      // phi công ngồi trên ghế, vẽ trên thân và dưới nòng (nòng sau thân thì vẽ trên cùng); xe lật ngược thì lật lại để phi công nhìn về phía đầu xe
      const pi = ra.pilot.info
      const pilot = new Sprite(ra.pilot.sit)
      pilot.anchor.set(pi.hip[0], pi.hip[1])
      const pk = pi.sitHeight / ra.pilot.sit.height
      pilot.scale.set(pk, pk)   // phi công quay cùng hướng với ảnh thân (đầu xe), kể cả xe bắn bằng đuôi
      pilot.position.set((rig.pilot[0] - rig.ground[0]) * ra.body.width * k, radius + (rig.pilot[1] - rig.ground[1]) * ra.body.height * k)
      frame.addChildAt(pilot, frame.getChildIndex(body) + 1)
      pilotSprite = pilot
    }
    v.root.addChildAt(frame, 0)
    v.body.visible = false
    v.barrel.visible = false
    // xoay/co giãn quanh điểm chạm đất (để nhún không làm xe nhấc khỏi mặt đất); vị trí khung đặt lại mỗi frame
    frame.pivot.set(0, radius)
    v.art = { frame, body, barrel, pilot: pilotSprite, top: radius - ra.body.height * k, flip, catapult: rig.catapult === true, swingT: -1, radius, barrelX: barrel.x, barrelY: barrel.y, barrelSX: barrel.scale.x, barrelSY: barrel.scale.y }
  }

  /** `shownHp`: máu đang hiển thị (có thể chậm hơn trạng thái trận khi đang phát lại phát bắn). */
  update(dt: number, match: MatchState, shownHp: ReadonlyMap<number, number>): void {
    this.bob += dt * 6
    if (this.chargeId < 0) this.chargePhase = 0
    else this.chargePhase += dt * Math.PI * 2 * (CHARGE_HZ0 + (CHARGE_HZ1 - CHARGE_HZ0) * this.chargeK)
    for (const v of this.views.values()) {
      if (v.art && v.art.swingT >= 0) v.art.swingT += dt
      if (v.recoilT >= 0) { v.recoilT += dt; if (v.recoilT > RECOIL_S) v.recoilT = -1 }
      if (v.hitT >= 0) { v.hitT += dt; if (v.hitT > HIT_S) v.hitT = -1 }
    }
    this.updateGhosts(dt)
    this.fan.clear()
    this.angleText.visible = false
    this.needle.visible = false
    for (const p of match.players) {
      const v = this.views.get(p.id)!
      const hp = shownHp.get(p.id) ?? p.hp
      // đang phát lại phát bắn thì theo máu đang hiển thị: xe chỉ chết khi đạn tới nơi, không chết sớm theo kết quả server
      const shown = shownHp.get(p.id)
      const alive = shown !== undefined ? shown > 0 : p.body.alive
      if (v.wasAlive && !alive) this.spawnGhost(v)
      v.wasAlive = alive
      const isCur = p.id === match.turnPlayerId && match.phase === 'aiming'
      this.trackMove(v, p, dt)
      this.drawOne(v, p, hp, alive, isCur)
      // xe có vệ tinh (Cú Thiên Văn): vệ tinh luôn bay theo trên đầu xe, đúng độ cao vệ tinh bắn tia trong shared/
      if (alive && this.fx) {
        const alt = satAltitude(p.mobileId)
        if (alt > 0) this.fx.satHome(p.id, p.body.x, p.body.y - alt, p.body.facing)
      }
      if (isCur) this.drawFan(p)
    }
  }

  /** Báo xe `id` đang tụ lực mức `k` (0..1); gọi với id < 0 khi không tụ. */
  setCharge(id: number, k: number): void { this.chargeId = id; this.chargeK = k }

  private drawOne(v: View, p: PlayerState, hp: number, alive: boolean, isCur: boolean): void {
    const b = p.body, r = b.radius
    v.root.position.set(b.x, b.y)
    v.root.alpha = alive ? 1 : 0.35
    v.root.visible = b.alive || hp > 0 || true
    // chuyển động phụ: u = độ nén khi bắn (âm = bật ngược), lắc khi đi, giật khi trúng đạn
    let u = this.recoilU(v)
    let chargeBulge = 0, shake = 0
    if (alive && p.id === this.chargeId) {   // tụ lực: nhún (nén thân + nòng thụt) và nòng phình theo nhịp, gồng dần
      const k = this.chargeK, ph = this.chargePhase
      u += CHARGE_SQUASH * (0.4 + 0.6 * k) * (0.5 - 0.5 * Math.cos(ph))
      chargeBulge = (0.5 + 0.5 * Math.sin(ph + 1.2)) * (0.25 + 0.6 * k)
      shake = Math.sin(ph * 3.1) * CHARGE_SHAKE * k
    }
    const sinP = Math.sin(v.phase), bounce = (1 - Math.cos(2 * v.phase)) * 0.5
    const rot = -b.tilt + sinP * WOBBLE_ROT * v.moveAmt
    const hitK = v.hitT >= 0 ? 1 - v.hitT / HIT_S : 0
    const ox = -b.facing * RECOIL_PUSH * Math.max(0, u) + Math.sin(v.hitT * 70) * HIT_SHAKE * hitK + shake
    const oy = -bounce * WOBBLE_BOB * v.moveAmt
    const sy = 1 - RECOIL_SQUASH * u - 0.03 * v.moveAmt * (bounce - 0.5)
    const sx = 1 + RECOIL_SQUASH * 0.6 * u
    const tint = !alive ? 0x777777 : hitK > 0 ? lerpTint(0xffffff, 0xff7070, hitK) : 0xffffff
    if (v.art) {
      const a = v.art
      a.frame.rotation = rot
      a.frame.scale.set(b.facing * a.flip * sx, sy)
      // khung xoay quanh điểm chạm đất (pivot) nhưng tương đương xoay quanh tâm xe như trước
      a.frame.position.set(ox - a.radius * Math.sin(rot), oy + a.radius * Math.cos(rot))
      a.body.tint = a.barrel.tint = tint
      if (a.pilot) a.pilot.visible = alive   // hồn đã thoát khỏi xác
      if (a.catapult) {
        a.barrel.rotation = this.swingRad(a)
        this.drawLabels(v, p, hp, alive, isCur, a.top)
        return
      }
      // góc bắn so với phương ngang; khung đã nghiêng theo dốc nên nòng so với thân = góc − độ dốc theo hướng bắn
      const d = aimDir(this.tmp, p.aimAngle, 1, -b.facing * b.tilt)
      // xe lật ngược (reverse): khung bị lật thêm một lần và ảnh nòng cũng lật, nên góc quay đổi dấu
      a.barrel.rotation = Math.atan2(d.y * a.flip, d.x)
      // nòng giật lùi dọc trục (hướng đầu nòng trong khung = flip·(cos, sin) của góc quay)
      const kick = RECOIL_KICK * Math.max(0, u) * a.flip
      a.barrel.position.set(a.barrelX - Math.cos(a.barrel.rotation) * kick, a.barrelY - Math.sin(a.barrel.rotation) * kick)
      const bl = Math.max(chargeBulge, Math.min(1, Math.max(0, -u) / BULGE_FULL))
      a.barrel.scale.set(a.barrelSX * (1 + BULGE_LONG * bl), a.barrelSY * (1 + BULGE_FAT * bl))
      this.drawLabels(v, p, hp, alive, isCur, a.top)
      return
    }
    v.body.position.set(ox, oy)
    v.body.scale.set(sx, sy)
    v.body.tint = v.barrel.tint = tint
    v.barrel.position.set(ox, oy)
    v.body.clear()
    v.body.rotation = rot
    v.body.roundRect(-r, -r * 0.6, r * 2, r * 1.2, 5).fill(alive ? TEAM_COLORS[p.team] : 0x777777).stroke({ color: TEAM_DARK[p.team], width: 2 })
    v.body.roundRect(-r * 0.9, r * 0.45, r * 1.8, r * 0.35, 4).fill(0x1f2937)
    v.barrel.clear()
    const d = aimDir(this.tmp, p.aimAngle, b.facing)
    const bl = Math.max(chargeBulge, Math.min(1, Math.max(0, -u) / BULGE_FULL))
    v.barrel.moveTo(0, -4).lineTo(d.x * 30, -4 + d.y * 30).stroke({ color: 0x1e293b, width: 6 * (1 + BULGE_FAT * bl), cap: 'round' })
    v.barrel.circle(0, -4, 5).fill(0x1e293b)
    this.drawLabels(v, p, hp, alive, isCur, -30)
  }

  /** Hình lúc bắn của xe `id`: nhún + nòng giật lùi; máy bắn đá thì vung cần. */
  fireAnim(id: number): void {
    const v = this.views.get(id)
    if (!v) return
    v.recoilT = 0
    if (v.art && v.art.catapult) v.art.swingT = 0
  }

  /** Xe `id` trúng đạn: giật ngang + ửng đỏ một thoáng. */
  hitAnim(id: number): void {
    const v = this.views.get(id)
    if (!v) return
    v.hitT = 0
    this.fx?.hitImpact(v.root.x + (Math.random() - 0.5) * 10, v.root.y - 6)
  }

  /** Độ nén khi bắn: 0 → 1 rất nhanh, rồi dao động tắt dần quanh 0. */
  private recoilU(v: View): number {
    const t = v.recoilT
    if (t < 0) return 0
    if (t < RECOIL_ATTACK) return t / RECOIL_ATTACK
    const s = t - RECOIL_ATTACK
    return Math.exp(-s * RECOIL_DAMP) * Math.cos(s * RECOIL_FREQ)
  }

  /** Theo dõi xe có đang đi không (so vị trí x giữa các frame) để lắc + tung bụi. */
  private trackMove(v: View, p: PlayerState, dt: number): void {
    const b = p.body
    const dx = b.x - v.lastX
    v.lastX = b.x
    const moving = b.alive && Math.abs(dx) > 0.05 && Math.abs(dx) < TELEPORT_PX
    v.moveAmt += ((moving ? 1 : 0) - v.moveAmt) * Math.min(1, dt * WOBBLE_EASE)
    if (!moving) return
    v.phase += Math.abs(dx) * WOBBLE_PER_PX
    v.dustAcc += Math.abs(dx)
    if (v.dustAcc >= DUST_EVERY && this.fx) {
      v.dustAcc = 0
      const dir = dx > 0 ? 1 : -1
      this.fx.dust(b.x - dir * b.radius * 0.7, b.y + b.radius, dir)
    }
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
    const y0 = p.body.radius + BAR_GAP   // thanh máu + tên nằm dưới xe cho khỏi che nòng súng
    if (alive) {
      const k = Math.max(0, Math.min(1, hp / p.maxHp)), x0 = -BAR_W / 2, col = TEAM_COLORS[p.team], light = TEAM_LIGHT[p.team]
      // quầng sáng nhẹ theo màu đội
      for (let i = 3; i >= 1; i--) v.bar.roundRect(x0 - i * 2, y0 - i * 2, BAR_W + i * 4, BAR_H + i * 4, BAR_H / 2 + i * 2).fill({ color: col, alpha: 0.07 })
      v.bar.roundRect(x0 - 1.5, y0 - 1.5, BAR_W + 3, BAR_H + 3, BAR_H / 2 + 1.5).fill(0x1b2130).stroke({ color: TEAM_DARK[p.team], width: 1 })
      v.bar.roundRect(x0, y0, BAR_W, BAR_H, BAR_H / 2).fill(0x4a4f5c)   // phần máu đã mất
      if (k > 0) {
        v.bar.roundRect(x0, y0, BAR_W * k, BAR_H, BAR_H / 2).fill(col)
        v.bar.roundRect(x0 + 1, y0 + 1, Math.max(0, BAR_W * k - 2), BAR_H * 0.35, BAR_H * 0.17).fill({ color: light, alpha: 0.55 })   // vệt sáng trên
      }
      for (let i = 1; i < BAR_SEGS; i++) v.bar.rect(x0 + (BAR_W * i) / BAR_SEGS - 0.75, y0, 1.5, BAR_H).fill(0x1b2130)   // vạch chia 4 phần
      if (p.maxShield > 0) {   // khiên (máu xanh) là thanh mảnh ngay trên thanh máu
        const sk = Math.max(0, Math.min(1, p.shield / p.maxShield)), sy = y0 - 6
        v.bar.roundRect(x0, sy, BAR_W, 4, 2).fill(0x1b2130)
        if (sk > 0) {
          v.bar.roundRect(x0, sy, BAR_W * sk, 4, 2).fill(0x4fd8ff)
          v.bar.roundRect(x0 + 1, sy + 0.5, Math.max(0, BAR_W * sk - 2), 1.5, 1).fill({ color: 0xffffff, alpha: 0.6 })
        }
      }
    }
    v.name.position.set(0, y0 + BAR_H + 4)
    v.marker.visible = isCur
    v.marker.position.set(0, top - 46 + Math.sin(this.bob) * 3)
  }

  /** Thước ngắm vòng tròn trong mờ, tách khỏi xe: tâm ở gốc nòng súng, dải góc quay được tô xanh lá nhạt, kim ngắm mũi tên xanh chỉ góc hiện tại, số độ hiện dưới vòng. */
  private drawFan(p: PlayerState): void {
    const b = p.body, g = this.fan, a = this.views.get(p.id)?.art
    let cx = b.x, cy = b.y - 4
    const mz = TUNING.mobiles[p.mobileId]!.muzzle
    if (mz) {   // tâm cung = đầu nòng, đúng chỗ đạn xuất phát (cùng công thức với simulateShot trong shared/)
      const d = aimDir(this.tmp, p.aimAngle, b.facing)
      const f = b.facing, c = Math.cos(-b.tilt), sn = Math.sin(-b.tilt)
      const gx = f * mz.px, gy = mz.py, nx = f > 0 ? -d.y : d.y, ny = f > 0 ? d.x : -d.x
      cx = b.x + gx * c - gy * sn + d.x * mz.ox + nx * mz.oy
      cy = b.y + gx * sn + gy * c + d.y * mz.ox + ny * mz.oy
    } else if (a) {   // xe chưa có đầu nòng (Rùa Thành): lấy gốc nòng; khung xe có pivot (0, radius)
      const rot = -b.tilt, sx = b.facing * a.flip, c = Math.cos(rot), sn = Math.sin(rot)
      const lx = a.barrelX * sx, ly = a.barrelY - a.radius
      cx = b.x + lx * c - ly * sn - a.radius * sn
      cy = b.y + lx * sn + ly * c + a.radius * c
    }
    const r = aimRange(this.range, TUNING.mobiles[p.mobileId]!, b.facing, b.tilt)
    const mid = (RING_IN + RING_OUT) / 2, w = RING_OUT - RING_IN
    // chỉ vẽ cung: dải góc cho phép + EXTEND mỗi đầu (góc a so với phương ngang → góc màn hình: phải = -a, trái = π + a)
    const ext = (r.max - r.min) * ARC_EXTEND
    const scr = (deg: number): number => b.facing > 0 ? -deg * DEG : Math.PI + deg * DEG
    // cung chia thành các dải đồng tâm, đục dần từ trong ra ngoài (trong nhạt/trong suốt, ngoài đậm) để có hiệu ứng gradient mà không tạo object mỗi frame
    const arc = (lo: number, hi: number, color: number, aMax: number): void => {
      const s0 = scr(b.facing > 0 ? hi : lo), s1 = scr(b.facing > 0 ? lo : hi), bw = w / ARC_BANDS
      for (let k = 0; k < ARC_BANDS; k++) {
        const rr = RING_IN + (k + 0.5) * bw, t = (k + 1) / ARC_BANDS
        g.moveTo(cx + Math.cos(s0) * rr, cy + Math.sin(s0) * rr)
        g.arc(cx, cy, rr, s0, s1).stroke({ color, width: bw + 0.6, alpha: aMax * t })
      }
    }
    const ext2 = ext + (r.max - r.min) * ARC_EXTEND2   // thêm 20% nữa, mờ bằng nửa phần 30%
    arc(r.min - ext2, r.max + ext2, 0xffffff, 0.15)
    arc(r.min - ext, r.max + ext, 0xffffff, 0.3)
    arc(r.min, r.max, ARC_GREEN, 0.4)
    for (let ang = Math.ceil(r.min / 15) * 15; ang <= r.max; ang += 15) {
      const d = aimDir(this.tmp, ang, b.facing)
      g.circle(cx + d.x * mid, cy + d.y * mid, ang % 45 === 0 ? 2.2 : 1.4).fill({ color: 0xffffff, alpha: 0.95 })
    }
    const lowEnd = scr(r.min - ext)   // số độ nằm dưới đầu thấp của cung
    // kim ngắm: ảnh mũi tên (assets/ui/aim-needle.png, vẽ chĩa sang phải), mũi chạm giữa cung; chưa tải xong thì dùng mũi tên vẽ bằng code
    const d = aimDir(this.tmp, p.aimAngle, b.facing)
    const tx = cx + d.x * (mid + 6), ty = cy + d.y * (mid + 6)
    if (needleTex) {
      const n = this.needle
      if (!n.texture || n.texture !== needleTex) { n.texture = needleTex; n.anchor.set(NEEDLE_ANCHOR_X, NEEDLE_ANCHOR_Y); n.scale.set(NEEDLE_W / needleTex.width) }
      n.alpha = NEEDLE_ALPHA; n.position.set(tx, ty); n.rotation = Math.atan2(d.y, d.x); n.visible = true
    } else {
      for (let i = 0; i < NEEDLE.length; i += 2) {
        const u = NEEDLE[i]!, w2 = NEEDLE[i + 1]!   // u: lùi dọc theo kim, w2: lệch ngang
        const px = tx - d.x * u - d.y * w2, py = ty - d.y * u + d.x * w2
        if (i === 0) g.moveTo(px, py); else g.lineTo(px, py)
      }
      g.closePath().fill({ color: NEEDLE_COLOR }).stroke({ color: 0xffffff, width: 2 })
    }
    this.angleText.text = `${p.aimAngle}°`
    this.angleText.position.set(cx + Math.cos(lowEnd) * mid, cy + Math.sin(lowEnd) * mid + w / 2 + 4)
    this.angleText.visible = true
  }

  /** Hồn thoát xác: bản sao mờ của phi công (xe không có phi công thì của thân xe) bay lên, lắc lư, rồi vỡ thành tia sáng. */
  private spawnGhost(v: View): void {
    const a = v.art
    const src = a ? (a.pilot ?? a.body) : null
    if (!src || !src.texture) return
    const s = new Sprite(src.texture)
    s.anchor.copyFrom(src.anchor)
    s.tint = GHOST_TINT
    s.alpha = GHOST_ALPHA
    const pos = this.container.toLocal(src.getGlobalPosition())
    const ws = src.worldTransform, cs = this.container.worldTransform
    const sx = Math.hypot(ws.a, ws.b) / Math.hypot(cs.a, cs.b) * Math.sign(ws.a || 1)
    const sy = Math.hypot(ws.c, ws.d) / Math.hypot(cs.c, cs.d)
    s.position.set(pos.x, pos.y)
    s.scale.set(sx, sy)
    s.alpha = 0
    this.container.addChild(s)
    this.ghosts.push({ s, x: pos.x, y: pos.y, t: 0, sx, sy, ph: Math.random() * 6 })
  }

  /** Còn hồn thoát xác đang bay (chưa vỡ): màn chơi chờ xong mới hiện bảng kết quả. */
  get dying(): boolean { return this.ghosts.length > 0 }

  private updateGhosts(dt: number): void {
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const g = this.ghosts[i]!
      g.t += dt
      const k = g.t / GHOST_S
      if (k >= 1) {
        this.fx?.soulBurst(g.s.x, g.s.y)
        g.s.destroy()
        this.ghosts.splice(i, 1)
        continue
      }
      const grow = 1 + GHOST_GROW * k
      g.s.position.set(g.x + Math.sin(g.t * 5 + g.ph) * GHOST_SWAY * k, g.y - GHOST_RISE * g.t)
      g.s.scale.set(g.sx * grow, g.sy * grow)
      g.s.rotation = Math.sin(g.t * 4 + g.ph) * 0.12
      g.s.alpha = GHOST_ALPHA * (k < 0.15 ? k / 0.15 : 1) * (1 - 0.3 * k)
    }
  }

  destroy(): void { this.container.destroy({ children: true }) }
}

function lerpTint(a: number, b: number, k: number): number {
  const ar = a >> 16, ag = (a >> 8) & 255, ab = a & 255
  return ((ar + ((b >> 16) - ar) * k) << 16) | ((ag + (((b >> 8) & 255) - ag) * k) << 8) | ((ab + ((b & 255) - ab) * k) | 0)
}

export const teamName = (team: 0 | 1): string => TEAM_NAMES[team]
