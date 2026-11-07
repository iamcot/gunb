import { BlurFilter, Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import type { ShotArt } from './shotArt'

interface Boom { x: number; y: number; age: number; r: number; core: Sprite | null; ring: Sprite | null }
interface Bolt { g: Graphics; age: number }
/** Vệ tinh Cú Thiên Văn. `home` = vệ tinh của một xe (luôn bay theo trên đầu xe, `hx`/`hy`), không thì vệ tinh tạm (hiện ra rồi bay mất).
 *  `busy`: đang ngắm/bắn (bay tới `tx`/`ty`, xoay mắt kính về `ax`/`ay`); `beam` < 0 = đang ngắm; `idle` = thời gian từ lúc tia cuối tắt. */
interface Sat { x: number; y: number; tx: number; ty: number; ax: number; ay: number; rot: number; w: number; age: number; charge: number; beam: number; idle: number; spr: Sprite | null
  home: boolean; hx: number; hy: number; facing: 1 | -1; busy: boolean; seen: number; sky: boolean }

/** Một hạt hiệu ứng (tái sử dụng trong vùng nhớ cố định, không cấp phát mỗi frame). */
interface Particle { kind: number; x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; color: number; alive: boolean
  rot: number; vr: number; spr: boolean }   // spr = vẽ bằng ảnh (Sprite cùng chỉ số trong pool)
const SOUL_COLORS = [0xffffff, 0xcfe8ff, 0xfff3b0] as const
const P_DEBRIS = 0, P_SPARK = 1, P_SMOKE = 2, P_FIRE = 3, P_DUST = 4, P_EMBER = 5, P_BIT = 6, P_IMPACT = 7, P_MUZZLE = 8

// Thông số hình ảnh của vụ nổ (chỉ là hình, không ảnh hưởng gameplay)
const BOOM_S = 0.4          // phần "lõi" vụ nổ: playback chờ hết phần này mới chuyển lượt
const BOOM_LIFE = 0.6       // chớp sáng + sóng xung kích tắt hẳn
const FLASH_S = 0.12
const BOLT_S = 0.42
/** Đạn xuyên đất dưới đất: màu tối, độ mờ, độ nhòe, biên độ rung (px). Đạn SS: số vệt xé gió, số đoạn mỗi vệt. */
const DIG_TINT = 0x4a3326, DIG_ALPHA = 0.7, DIG_BLUR = 3, DIG_SHAKE = 2.2
const STREAKS = 7, STREAK_SEGS = 5
const BOLT_HEIGHT = 900
const MAX_PARTICLES = 700
const GRAVITY = 900         // px/s² cho mảnh đất, tia lửa
const SMOKE_RISE = 40       // px/s khói bay lên
const DIRT_FALLBACK = 0x8a5a36
/** Vệ tinh: tia từ trời thì bay ở độ cao SAT_ALT px trên điểm laser chạm (tia chéo thì ở chỗ shared/ báo), hiện ra SAT_LEAD_S s trước tia, tia sáng BEAM_S s, tắt tia SAT_OUT_S s sau thì bay mất. */
const SAT_ALT = 300, BEAM_S = 0.45, SAT_OUT_S = 0.35, SAT_SIZE = 96
/** Lúc rảnh vệ tinh nghiêng mắt kính chéo xuống phía trước xe SAT_IDLE_TILT rad; bay theo xe với tốc độ bám SAT_FOLLOW (1/s). */
const SAT_IDLE_TILT = Math.PI / 6, SAT_FOLLOW = 6
/** Mắt kính trên ảnh vệ tinh nằm dưới tâm ảnh SAT_LENS × chiều cao ảnh (tia laser bắt đầu từ đó). */
const SAT_LENS = 0.33
export const SAT_LEAD_S = 0.45
const BEAM_OUTER = 0x6fe3ff, BEAM_CORE = 0xf4fdff

/** Ảnh hiệu ứng vẽ tay (plan/14-prompt-no-khoi.md, assets/fx/). Thiếu ảnh nào thì phần đó vẽ bằng code. */
const ART = {
  fireball: null as Texture | null, shockwave: null as Texture | null, impact: null as Texture | null,
  muzzle: null as Texture | null, spark: null as Texture | null, satellite: null as Texture | null,
  smoke: [] as Texture[], dirt: [] as Texture[], bits: [] as Texture[],
}
function loadArt(file: string, done: (t: Texture) => void): void {
  const img = new Image()
  img.onload = () => done(Texture.from(img))
  img.src = '/fx/' + file
}
loadArt('fireball.png', t => { ART.fireball = t })
loadArt('shockwave.png', t => { ART.shockwave = t })
loadArt('hit-impact.png', t => { ART.impact = t })
loadArt('muzzle-flash.png', t => { ART.muzzle = t })
loadArt('spark.png', t => { ART.spark = t })
loadArt('satellite.png', t => { ART.satellite = t })
for (let i = 0; i < 4; i++) loadArt(`smoke-${i}.png`, t => { ART.smoke.push(t) })
for (let i = 0; i < 8; i++) loadArt(`dirt-${i}.png`, t => { ART.dirt.push(t) })
for (let i = 0; i < 8; i++) loadArt(`bits-${i}.png`, t => { ART.bits.push(t) })
const pick = (a: Texture[]): Texture | null => a.length ? a[(Math.random() * a.length) | 0]! : null

/** Lõi cầu lửa của vụ nổ (ảnh): nở tới CORE_GROW × bán kính trong CORE_POP s, giữ tới CORE_HOLD s rồi tắt hẳn ở CORE_END s. */
const CORE_GROW = 1.15, CORE_POP = 0.12, CORE_HOLD = 0.18, CORE_END = 0.45
/** Va chạm đạn với xe: "bụp" rộng IMPACT_SIZE px, sống IMPACT_S s, văng IMPACT_BITS mảnh kim loại. */
const IMPACT_SIZE = 56, IMPACT_S = 0.3, IMPACT_BITS = 6
/** Lửa đầu nòng: dài MUZZLE_LEN px, sống MUZZLE_S s. */
const MUZZLE_LEN = 40, MUZZLE_S = 0.12

/** Khói đuôi đạn (Ốc Thiết Giáp...): nhả một đám khói + một đốm lửa mỗi TRAIL_STEP px bay được. */
const TRAIL_STEP = 6, TRAIL_MAX_PER_CALL = 6, TRAIL_SMOKE = 0x8a7b6c
/** Số sát thương nhảy lên khi trúng: mỗi phát một số (không cộng dồn), bay lên POP_RISE px trong POP_S s. */
const POP_POOL = 16, POP_S = 1.1, POP_RISE = 56, POP_STACK = 28

const FIRE_HOT = 0xfff3b0, FIRE_MID = 0xff8a20, FIRE_COOL = 0xa8280e

function lerpColor(a: number, b: number, k: number): number {
  const ar = a >> 16, ag = (a >> 8) & 255, ab = a & 255
  const r = ar + ((b >> 16) - ar) * k, g = ag + (((b >> 8) & 255) - ag) * k, bl = ab + ((b & 255) - ab) * k
  return (r << 16) | (g << 8) | (bl | 0)
}
/** Đổi độ sáng màu (k < 1 tối đi). */
function shade(c: number, k: number): number {
  const r = Math.min(255, ((c >> 16) * k) | 0), g = Math.min(255, (((c >> 8) & 255) * k) | 0), b = Math.min(255, ((c & 255) * k) | 0)
  return (r << 16) | (g << 8) | b
}
const rnd = (a: number, b: number): number => a + Math.random() * (b - a)

/** Hiệu ứng tạm: đạn đang bay (nhiều viên), vụ nổ (chớp, cầu lửa, sóng xung kích, khói, mảnh đất, tia lửa), tia sét, khói đầu nòng, bụi bánh xe, rung màn hình. */
export class Fx {
  readonly container = new Container()
  shakeX = 0
  shakeY = 0
  private booms: Boom[] = []
  /** Lớp thường: khói, mảnh đất, bụi. */
  private readonly back = new Graphics()
  /** Lớp cầu lửa (hoà trộn thường để không cháy trắng trên nền trời sáng). */
  private readonly fire = new Graphics()
  /** Lớp cộng sáng: tia lửa, chớp, sóng xung kích, than hồng. */
  private readonly glow = new Graphics()
  /** Các lớp ảnh tương ứng (đặt ngay trên lớp vẽ cùng loại) + lớp trên cùng cho "bụp" va chạm. */
  private readonly backArt = new Container()
  private readonly fireArt = new Container()
  private readonly glowArt = new Container()
  private readonly topArt = new Container()
  private readonly psprites: (Sprite | null)[] = []
  private readonly parts: Particle[] = []
  private nextPart = 0
  private bolts: Bolt[] = []
  private sats: Sat[] = []
  /** Vệ tinh bay theo từng xe Cú Thiên Văn (theo id người chơi). */
  private readonly homeSats = new Map<number, Sat>()
  private shake = 0
  private readonly shells: Graphics[] = []
  private readonly shellSprites: Sprite[] = []
  private shellArt: ShotArt | null = null
  private readonly shellPos: { x: number; y: number; visible: boolean }[] = []
  private readonly shellGrown: boolean[] = []
  private readonly trailD: number[] = []
  private readonly shellRot: number[] = []
  private readonly shellDig: boolean[] = []   // đạn xuyên đất đang ở dưới đất
  private readonly shellBlur: BlurFilter[] = []
  private readonly popArt = new Container()
  private readonly pops: { text: Text; age: number; alive: boolean; baseY: number; k: number }[] = []
  private nextPop = 0

  constructor() {
    this.glow.blendMode = 'add'
    this.container.addChild(this.back, this.backArt, this.fire, this.fireArt, this.glow, this.glowArt, this.topArt, this.popArt)
    for (let i = 0; i < POP_POOL; i++) {
      const text = new Text({ text: '', style: { fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: 30, fontWeight: '900', fill: 0xffb52e, stroke: { color: 0x3a1200, width: 6, join: 'round' } } })
      text.anchor.set(0.5)
      text.visible = false
      this.popArt.addChild(text)
      this.pops.push({ text, age: 0, alive: false, baseY: 0, k: 1 })
    }
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.parts.push({ kind: 0, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, size: 1, color: 0, alive: false, rot: 0, vr: 0, spr: false })
      this.psprites.push(null)
    }
  }

  /** Lấy một hạt từ vùng nhớ (vòng tròn: hết chỗ thì đè hạt cũ nhất). */
  private spawn(kind: number, x: number, y: number, vx: number, vy: number, life: number, size: number, color: number): void {
    const i = this.nextPart, p = this.parts[i]!
    this.nextPart = (this.nextPart + 1) % MAX_PARTICLES
    p.kind = kind; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.age = 0; p.life = life; p.size = size; p.color = color; p.alive = true
    p.rot = Math.random() * Math.PI * 2; p.vr = 0; p.spr = false
    const s = this.psprites[i]
    if (s) s.visible = false
    let t: Texture | null = null, layer = this.backArt
    switch (kind) {
      case P_FIRE: t = ART.fireball; layer = this.fireArt; break
      case P_SMOKE: case P_DUST: t = pick(ART.smoke); p.vr = rnd(-0.6, 0.6); break
      case P_SPARK: t = ART.spark; layer = this.glowArt; break
      case P_DEBRIS: t = pick(ART.dirt); p.vr = rnd(-10, 10); break
      case P_BIT: t = pick(ART.bits); p.vr = rnd(-14, 14); break
      case P_IMPACT: t = ART.impact; layer = this.topArt; break
      case P_MUZZLE: t = ART.muzzle; layer = this.fireArt; p.rot = vx; p.vx = 0; break   // vx mang hướng nòng
      default: break
    }
    if (!t) return
    let sp = s
    if (!sp) { sp = new Sprite(); this.psprites[i] = sp }
    sp.texture = t
    sp.anchor.set(kind === P_MUZZLE ? 0.12 : 0.5, 0.5)
    sp.blendMode = kind === P_SPARK ? 'add' : 'normal'
    sp.tint = 0xffffff
    if (sp.parent !== layer) layer.addChild(sp)
    sp.visible = true
    p.spr = true
  }

  /** Ảnh đạn cho phát bắn sắp phát lại (null = đạn tròn mặc định). */
  setShellArt(art: ShotArt | null): void {
    this.shellArt = art
    for (let i = 0; i < this.shellSprites.length; i++) {
      const s = this.shellSprites[i]!
      this.shellGrown[i] = false
      s.tint = 0xffffff
      if (art) { s.texture = art.tex; s.scale.set(art.length / art.tex.width) }
    }
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
      this.shellGrown.push(false)
      this.trailD.push(0)
      this.shellRot.push(0); this.shellDig.push(false)
      this.shellBlur.push(new BlurFilter({ strength: DIG_BLUR }))
    }
    const g = this.shells[i]!, s = this.shellSprites[i]!, p = this.shellPos[i]!
    const art = this.shellArt !== null
    g.visible = visible && !art
    s.visible = visible && art
    g.position.set(x, y)
    s.position.set(x, y)
    const a = this.shellArt
    const grown = this.shellGrown[i] === true && a?.grow != null
    const ga = grown ? a!.grow! : null
    if (a && ga) { s.tint = ga.tint; if (ga.tex && s.texture !== ga.tex) s.texture = ga.tex }
    this.shellRot[i] = rot
    if (a && (a.trail || a.streak !== 0) && visible) this.trail(i, p, x, y, rot, a.length, a.streak !== 0)
    // đạn xuyên đất đang ở dưới đất: tối, nhòe, rung
    const under = visible && this.shellDig[i] === true
    s.filters = under ? [this.shellBlur[i]!] : []
    if (under) { s.tint = DIG_TINT; s.alpha = DIG_ALPHA; s.position.set(x + rnd(-DIG_SHAKE, DIG_SHAKE), y + rnd(-DIG_SHAKE, DIG_SHAKE)) } else s.alpha = 1
    if (a && a.upright) {
      const k = (ga?.tex ? ga.length / ga.tex.width : a.length / a.tex.width) * (ga?.scale ?? 1)
      s.rotation = 0
      s.scale.set(Math.cos(rot) < 0 ? -k : k, k)
    } else if (a) {
      // xoay theo hướng bay; bay sang trái thì lật dọc để ảnh không bị lộn ngược
      const k = (ga?.tex ? ga.length / ga.tex.width : a.length / a.tex.width) * (ga?.scale ?? 1)
      s.rotation = rot
      s.scale.set(k, Math.cos(rot) < 0 ? -k : k)
    } else s.rotation = rot
    if (under) s.rotation += rnd(-0.12, 0.12)
    if (!visible) this.trailD[i] = 0
    p.x = x; p.y = y; p.visible = visible
  }

  /** Nhả khói + lửa ở đuôi viên đạn `i` theo quãng đã bay kể từ lần trước (p = vị trí cũ, chưa cập nhật). */
  private trail(i: number, p: { x: number; y: number; visible: boolean }, x: number, y: number, rot: number, length: number, streak: boolean): void {
    if (!p.visible) { this.trailD[i] = 0; return }
    let d = this.trailD[i]! + Math.hypot(x - p.x, y - p.y)
    const cx = Math.cos(rot), cy = Math.sin(rot)
    for (let n = 0; d >= TRAIL_STEP && n < TRAIL_MAX_PER_CALL; n++, d -= TRAIL_STEP) {
      const tx = x - cx * length * 0.5, ty = y - cy * length * 0.5
      this.spawn(P_SMOKE, tx + rnd(-3, 3), ty + rnd(-3, 3), rnd(-8, 8) - cx * 20, rnd(-8, 8) - cy * 20, rnd(1.0, 1.5), rnd(8, 12), TRAIL_SMOKE)
      this.spawn(P_FIRE, tx, ty, -cx * 30, -cy * 30, 0.18, 9, FIRE_HOT)
      if (streak) {   // đạn SS: thêm lửa to và tàn lửa văng ra
        this.spawn(P_FIRE, tx, ty, -cx * 60 + rnd(-30, 30), -cy * 60 + rnd(-30, 30), rnd(0.25, 0.4), rnd(11, 16), FIRE_HOT)
        this.spawn(P_EMBER, tx, ty, -cx * 90 + rnd(-60, 60), -cy * 90 + rnd(-60, 60), rnd(0.4, 0.8), rnd(1.5, 2.6), 0xffa030)
      }
    }
    this.trailD[i] = d >= TRAIL_STEP ? 0 : d
  }

  /** Vân sét quanh các viên đạn điện (`arcs` trong shots.json): mỗi frame vẽ lại vài tia gấp khúc ngắn toả ra từ viên đạn nên nhìn như điện nhoáng. */
  private drawShellArcs(glow: Graphics): void {
    const a = this.shellArt
    if (!a || a.arcs <= 0) return
    for (let i = 0; i < this.shellPos.length; i++) {
      const p = this.shellPos[i]!
      if (!p.visible) continue
      for (let n = 0; n < a.arcs; n++) {
        let ang = Math.random() * Math.PI * 2
        const rr = a.length * rnd(0.8, 1.5)
        let cx = p.x + Math.cos(ang) * a.length * 0.2, cy = p.y + Math.sin(ang) * a.length * 0.2
        glow.moveTo(cx, cy)
        for (let s = 0; s < 3; s++) {
          ang += rnd(-0.9, 0.9)
          cx += Math.cos(ang) * rr / 3; cy += Math.sin(ang) * rr / 3
          glow.lineTo(cx, cy)
        }
        glow.stroke({ color: 0xcfe8ff, width: 2.2, alpha: 0.9, join: 'round' })
      }
    }
  }

  /** Vệt xé gió / xé lửa của đạn SS (`streak` trong shots.json): quầng sáng quanh đạn + vài vệt dài mỏng nhạt dần ra sau, nhoáng mỗi frame. */
  private drawShellStreaks(glow: Graphics): void {
    const a = this.shellArt
    if (!a || a.streak === 0) return
    for (let i = 0; i < this.shellPos.length; i++) {
      const p = this.shellPos[i]!
      if (!p.visible) continue
      const rot = this.shellRot[i]!, cx = Math.cos(rot), cy = Math.sin(rot), nx = -cy, ny = cx
      glow.circle(p.x, p.y, a.length * 0.75).fill({ color: a.streak, alpha: 0.12 })
      glow.circle(p.x, p.y, a.length * 0.4).fill({ color: 0xffffff, alpha: 0.07 })
      for (let n = 0; n < STREAKS; n++) {
        const off = rnd(-a.length * 0.5, a.length * 0.5), len = a.length * rnd(1.4, 3.2), core = n < 2
        const sx = p.x - cx * a.length * 0.3 + nx * off, sy = p.y - cy * a.length * 0.3 + ny * off
        for (let k = 0; k < STREAK_SEGS; k++) {
          const f0 = k / STREAK_SEGS, f1 = (k + 1) / STREAK_SEGS
          glow.moveTo(sx - cx * len * f0, sy - cy * len * f0).lineTo(sx - cx * len * f1, sy - cy * len * f1)
            .stroke({ color: core ? 0xfff2c0 : a.streak, width: (core ? 3.2 : 2.4) * (1 - f0 * 0.7), alpha: 0.85 * (1 - f0), cap: 'round' })
        }
      }
    }
  }

  /** Đạn `i` (đạn xuyên đất) đang ở dưới đất hay không (do playback xét theo mask). */
  setShellDig(i: number, under: boolean): void { if (i < this.shellDig.length) this.shellDig[i] = under }

  /** Đất bụi bắn ra từ đạn xuyên đất đang chui dưới đất. */
  digPuff(x: number, y: number, color: number | null): void {
    this.spawn(P_DUST, x + rnd(-4, 4), y + rnd(-4, 4), rnd(-40, 40), rnd(-60, -10), rnd(0.35, 0.6), rnd(3, 6), color ?? DIRT_FALLBACK)
  }

  /** Viên đạn `i` (airGrow) bay đủ lâu: đổi sang dạng lớn (ảnh `grow` trong shots.json) + chớp sáng nhỏ. */
  growShell(i: number, x: number, y: number): void {
    this.shellGrown[i] = true
    this.explosion(x, y, 22, false, null)
  }

  /** Số sát thương nhảy lên trên đầu xe tại (x, y). Mỗi phát một số; số tới gần nhau thì xếp chồng lên để không đè. */
  damageText(x: number, y: number, amount: number): void {
    const pop = this.pops[this.nextPop]!
    this.nextPop = (this.nextPop + 1) % POP_POOL
    let stack = 0
    for (const o of this.pops) if (o !== pop && o.alive && o.age < 0.6 && Math.abs(o.text.x - x) < 70 && Math.abs(o.baseY - y) < POP_STACK * 4) stack++
    const t = pop.text
    t.text = String(amount)
    pop.k = 0.8 + 0.8 * Math.min(1, amount / 600)
    pop.baseY = y - stack * POP_STACK
    pop.age = 0
    pop.alive = true
    t.position.set(x, pop.baseY)
    t.alpha = 1
    t.visible = true
  }

  hideProjectiles(): void {
    for (let i = 0; i < this.shells.length; i++) { this.shells[i]!.visible = false; this.shellSprites[i]!.visible = false; this.shellPos[i]!.visible = false; this.shellDig[i] = false; this.shellSprites[i]!.filters = [] }
  }

  /** Viên đạn đầu tiên đang hiện (camera bám theo), hoặc null. */
  lead(): { x: number; y: number } | null {
    for (const p of this.shellPos) if (p.visible) return p
    return null
  }

  /** Vụ nổ bán kính `r`. `dirt` = màu đất tại chỗ nổ (null = nổ giữa không trung, không bắn mảnh đất). */
  explosion(x: number, y: number, r: number, shake = true, dirt: number | null = DIRT_FALLBACK): void {
    const b: Boom = { x, y, age: 0, r, core: null, ring: null }
    if (ART.fireball) { b.core = new Sprite(ART.fireball); b.core.anchor.set(0.5); b.core.rotation = Math.random() * Math.PI * 2; this.fireArt.addChild(b.core) }
    if (ART.shockwave) { b.ring = new Sprite(ART.shockwave); b.ring.anchor.set(0.5); b.ring.blendMode = 'add'; this.glowArt.addChild(b.ring) }
    this.booms.push(b)
    if (shake) this.shake = Math.max(this.shake, Math.min(14, r / 5))
    const nFire = 6 + Math.round(r / 6)
    for (let i = 0; i < nFire; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.45, sp = rnd(20, 70) * (r / 40)
      this.spawn(P_FIRE, x + Math.cos(a) * d, y + Math.sin(a) * d, Math.cos(a) * sp, Math.sin(a) * sp - 30, rnd(0.3, 0.55), r * rnd(0.22, 0.4), FIRE_HOT)
    }
    const nSmoke = 4 + Math.round(r / 10)
    for (let i = 0; i < nSmoke; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.5
      this.spawn(P_SMOKE, x + Math.cos(a) * d, y + Math.sin(a) * d - r * 0.2, rnd(-15, 15), -rnd(0.6, 1.4) * SMOKE_RISE, rnd(1.0, 1.7), r * rnd(0.25, 0.4), Math.random() < 0.5 ? 0x3b3531 : 0x524a44)
    }
    const nSpark = 8 + Math.round(r / 5)
    for (let i = 0; i < nSpark; i++) {
      const a = -Math.PI * rnd(0.05, 0.95), sp = rnd(220, 560)
      this.spawn(P_SPARK, x, y, Math.cos(a) * sp, Math.sin(a) * sp, rnd(0.25, 0.5), rnd(1.2, 2.2), Math.random() < 0.5 ? 0xffe08a : 0xffb347)
    }
    if (dirt !== null) {
      const nDebris = 8 + Math.round(r / 4)
      for (let i = 0; i < nDebris; i++) {
        const a = -Math.PI * rnd(0.08, 0.92), sp = rnd(140, 420)
        this.spawn(P_DEBRIS, x + rnd(-r, r) * 0.4, y + rnd(-r, r) * 0.3, Math.cos(a) * sp, Math.sin(a) * sp, rnd(0.8, 1.4), rnd(1.6, 4.2), shade(dirt, rnd(0.55, 1.1)))
      }
      // than hồng còn cháy âm ỉ dọc đáy hố
      const nEmber = 5 + Math.round(r / 8)
      for (let i = 0; i < nEmber; i++) {
        const a = Math.PI * rnd(0.1, 0.9)
        this.spawn(P_EMBER, x + Math.cos(a) * r, y + Math.sin(a) * r, 0, 0, rnd(0.7, 1.4), rnd(1.2, 2.4), 0xff7a1a)
      }
    }
  }

  /** Khói + chớp lửa ở đầu nòng lúc bắn; `dir` = hướng bay ban đầu (radian, trục màn hình). */
  muzzle(x: number, y: number, dir: number): void {
    const cx = Math.cos(dir), cy = Math.sin(dir)
    if (ART.muzzle) this.spawn(P_MUZZLE, x, y, dir, 0, MUZZLE_S, MUZZLE_LEN, 0xffffff)
    for (let i = 0; i < 5; i++) {
      const sp = rnd(40, 160)
      this.spawn(P_FIRE, x + cx * 4, y + cy * 4, cx * sp + rnd(-20, 20), cy * sp + rnd(-20, 20), rnd(0.08, 0.16), rnd(4, 8), FIRE_HOT)
    }
    for (let i = 0; i < 6; i++) {
      const sp = rnd(15, 70)
      this.spawn(P_SMOKE, x + cx * 6, y + cy * 6, cx * sp + rnd(-12, 12), cy * sp - rnd(5, 20), rnd(0.5, 0.9), rnd(4, 7), 0x8c847c)
    }
  }

  /** Hồn thoát xác vỡ tung: chùm tia sáng nhạt + vài cụm khói trắng. */
  soulBurst(x: number, y: number): void {
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2, sp = rnd(60, 200)
      this.spawn(P_SPARK, x, y, Math.cos(a) * sp, Math.sin(a) * sp - 40, rnd(0.4, 0.8), rnd(1.5, 3), SOUL_COLORS[i % SOUL_COLORS.length]!)
    }
    for (let i = 0; i < 5; i++) this.spawn(P_DUST, x + rnd(-8, 8), y + rnd(-8, 8), rnd(-20, 20), -rnd(10, 40), rnd(0.5, 0.9), rnd(5, 9), 0xe8f2ff)
  }

  /** Một cụm bụi nhỏ dưới bánh xe khi di chuyển. */
  dust(x: number, y: number, dirX: number): void {
    for (let i = 0; i < 2; i++) this.spawn(P_DUST, x + rnd(-3, 3), y - rnd(0, 3), -dirX * rnd(10, 35), -rnd(10, 30), rnd(0.35, 0.6), rnd(2.5, 4.5), 0xc9b08a)
  }

  /** Tia sét giáng xuống (x, y) từ (x0, y0) (không có thì thẳng từ trên cao): đường gấp khúc dày ba lớp (quầng xanh, thân xanh sáng, lõi trắng) + các nhánh rẽ ra hai bên (vân sét). */
  bolt(x: number, y: number, x0?: number, y0?: number): void {
    const g = new Graphics()
    const sx = x0 ?? x + 10, sy = y0 ?? y - BOLT_HEIGHT
    const dx = x - sx, dy = y - sy, len = Math.hypot(dx, dy) || 1
    const ux = dx / len, uy = dy / len, nx = -uy, ny = ux          // hướng tia và pháp tuyến
    const segs = Math.max(10, Math.round(len / 45))
    const px: number[] = [sx], py: number[] = [sy]
    for (let i = 1; i <= segs; i++) {
      const k = i / segs, off = i === segs ? 0 : rnd(-16, 16)
      px.push(sx + dx * k + nx * off); py.push(sy + dy * k + ny * off)
    }
    const strokePath = (xs: number[], ys: number[], color: number, width: number, alpha: number): void => {
      g.moveTo(xs[0]!, ys[0]!)
      for (let i = 1; i < xs.length; i++) g.lineTo(xs[i]!, ys[i]!)
      g.stroke({ color, width, join: 'round', cap: 'round', alpha })
    }
    // nhánh rẽ: từ các đỉnh gấp khúc, lệch 25–55° so với hướng tia, dài 40–130 px, gấp khúc 3 đoạn, thưa dần về phía chạm
    const branches: { xs: number[]; ys: number[] }[] = []
    for (let i = 2; i < segs - 1; i += 2) {
      if (Math.random() < 0.2) continue
      const side = Math.random() < 0.5 ? -1 : 1, ang = side * rnd(0.45, 0.95), blen = rnd(40, 130)
      const ca = Math.cos(ang), sa = Math.sin(ang)
      const bx = ux * ca - uy * sa, by = ux * sa + uy * ca        // hướng nhánh
      const xs = [px[i]!], ys = [py[i]!]
      for (let n = 1; n <= 3; n++) { xs.push(xs[n - 1]! + bx * blen / 3 + rnd(-7, 7) * nx); ys.push(ys[n - 1]! + by * blen / 3 + rnd(-7, 7) * ny) }
      branches.push({ xs, ys })
    }
    for (const b of branches) strokePath(b.xs, b.ys, 0x7fb8ff, 7, 0.35)
    strokePath(px, py, 0x6fb0ff, 24, 0.28)
    strokePath(px, py, 0x9fd0ff, 12, 0.6)
    for (const b of branches) strokePath(b.xs, b.ys, 0xe8f4ff, 2.5, 0.95)
    strokePath(px, py, 0xffffff, 5.5, 1)
    // chớp sáng tại điểm chạm
    g.circle(x, y, 26).fill({ color: 0xbfe0ff, alpha: 0.5 })
    g.circle(x, y, 11).fill({ color: 0xffffff, alpha: 0.9 })
    this.container.addChild(g)
    this.bolts.push({ g, age: 0 })
    this.shake = Math.max(this.shake, 6)
  }

  /** Vệ tinh của xe `id` luôn bay theo ở (x, y) (gọi mỗi frame khi xe còn sống; ngừng gọi thì vệ tinh biến mất). */
  satHome(id: number, x: number, y: number, facing: 1 | -1): void {
    let s = this.homeSats.get(id)
    if (!s) {
      s = this.newSat(x, y, x, y + SAT_ALT, 0)
      s.home = true; s.age = 1
      this.homeSats.set(id, s)
    }
    s.hx = x; s.hy = y; s.facing = facing; s.seen = 0
  }

  private newSat(sx: number, sy: number, x: number, y: number, w: number): Sat {
    const s: Sat = { x: sx, y: sy, tx: sx, ty: sy, ax: x, ay: y, rot: 0, w, age: 0, charge: 0, beam: -1, idle: 0, spr: null,
      home: false, hx: sx, hy: sy, facing: 1, busy: false, seen: 0, sky: false }
    if (ART.satellite) { s.spr = new Sprite(ART.satellite); s.spr.anchor.set(0.5); s.spr.scale.set(SAT_SIZE / ART.satellite.width); this.topArt.addChild(s.spr) }
    this.sats.push(s)
    return s
  }

  /** Vệ tinh nào bắn tia này: vệ tinh bay theo xe gần (x0, y0) nhất (chỗ vệ tinh trên đầu xe bắn), không có thì vệ tinh tạm đang bận gần đó. */
  private pickSat(x: number, y: number, x0: number, y0: number): Sat | undefined {
    let s: Sat | undefined, best = 200
    for (const q of this.homeSats.values()) { const d = Math.hypot(q.hx - x0, q.hy - y0); if (d < best) { best = d; s = q } }
    if (!s) for (const q of this.sats) if (!q.home && q.idle < SAT_OUT_S && Math.hypot(q.ax - x, q.ay - y) < 200) s = q
    return s
  }

  /** Vệ tinh chuẩn bị bắn laser tới (x, y): tia chéo (đạn 1, 2) thì ở yên trên đầu xe (x0, y0) và xoay mắt kính về điểm nhắm;
   *  tia từ trời (SS) thì bay tới SAT_ALT px phía trên điểm nhắm và xoay ngang. Gọi trước tia SAT_LEAD_S s. */
  satCharge(x: number, y: number, w: number, sky: boolean, x0: number, y0: number): void {
    const sx = sky ? x : x0, sy = sky ? y - SAT_ALT : y0
    const s = this.pickSat(x, y, x0, y0) ?? this.newSat(sx, sy, x, y, w)
    s.tx = sx; s.ty = sy; s.ax = x; s.ay = y; s.w = w; s.sky = sky; s.charge = 0; s.beam = -1; s.idle = 0; s.busy = true
  }

  /** Tia laser vệ tinh bắn tới (x, y), nửa bề rộng `w` (tham số như satCharge). */
  beam(x: number, y: number, w: number, sky: boolean, x0: number, y0: number): void {
    let s = this.pickSat(x, y, x0, y0)
    if (!s) { this.satCharge(x, y, w, sky, x0, y0); s = this.pickSat(x, y, x0, y0)! }
    s.ax = x; s.ay = y; s.w = w; s.sky = sky; s.beam = 0; s.idle = 0; s.busy = true
    this.shake = Math.max(this.shake, 4 + w / 5)
    for (let i = 0; i < 10 + w; i++) {
      const a = -Math.PI * rnd(0.05, 0.95), sp = rnd(160, 420)
      this.spawn(P_SPARK, x + rnd(-w, w) * 0.5, y, Math.cos(a) * sp, Math.sin(a) * sp, rnd(0.25, 0.5), rnd(1.2, 2.2), Math.random() < 0.5 ? BEAM_OUTER : BEAM_CORE)
    }
  }

  /** Dải sáng thẳng từ (x0, y0) tới (x1, y1), rộng `ww` (vẽ đường kín, không cấp phát mảng). */
  private beamQuad(x0: number, y0: number, x1: number, y1: number, ww: number, color: number, alpha: number): void {
    const n = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / n * ww / 2, ny = (x1 - x0) / n * ww / 2
    this.glow.moveTo(x0 + nx, y0 + ny).lineTo(x1 + nx, y1 + ny).lineTo(x1 - nx, y1 - ny).lineTo(x0 - nx, y0 - ny).closePath().fill({ color, alpha })
  }

  /** Vẽ vệ tinh + tia laser (gọi trong update, vẽ lên lớp đã clear đầu frame). */
  private drawSats(dt: number): void {
    const fire = this.fire, glow = this.glow
    for (let i = this.sats.length - 1; i >= 0; i--) {
      const s = this.sats[i]!
      s.age += dt
      s.charge += dt
      if (s.beam >= 0) {
        s.beam += dt
        if (s.beam >= BEAM_S) s.idle += dt
      }
      if (s.busy && s.idle >= SAT_OUT_S) { s.busy = false; s.beam = -1 }
      if (s.home) {
        s.seen += dt
        if (s.seen > 0.3) { s.spr?.destroy(); this.sats.splice(i, 1); for (const [id, q] of this.homeSats) if (q === s) this.homeSats.delete(id); continue }
        if (!s.busy) { s.tx = s.hx; s.ty = s.hy }
      } else if (!s.busy) { s.spr?.destroy(); this.sats.splice(i, 1); continue }
      const k = Math.min(1, dt * (s.busy ? 10 : SAT_FOLLOW))
      s.x += (s.tx - s.x) * k
      s.y += (s.ty - s.y) * k
      const alpha = s.home ? 1 : Math.min(1, s.age / 0.2) * (1 - s.idle / SAT_OUT_S)
      const by = s.y + Math.sin(s.age * 4) * 3 - (s.home ? 0 : s.idle * 220)    // nhấp nhô; vệ tinh tạm xong thì bay vút lên
      // hướng mắt kính (phía dưới ảnh): rảnh thì chéo xuống phía trước xe, tia từ trời thì nằm ngang (mắt kính chĩa thẳng xuống), tia chéo thì theo tia
      const want = !s.busy ? -s.facing * SAT_IDLE_TILT : s.sky ? 0 : Math.atan2(s.ay - by, s.ax - s.x) - Math.PI / 2
      s.rot += (want - s.rot) * Math.min(1, dt * 12)
      // thân vệ tinh (ảnh assets/fx/satellite.png nếu có, không thì vẽ khối)
      if (s.spr) { s.spr.position.set(s.x, by); s.spr.rotation = s.rot; s.spr.alpha = alpha }
      else {
        fire.rect(s.x - 34, by - 5, 22, 10).fill({ color: 0x3f6fb5, alpha }).stroke({ color: 0x2a2a3a, width: 1.5, alpha })
        fire.rect(s.x + 12, by - 5, 22, 10).fill({ color: 0x3f6fb5, alpha }).stroke({ color: 0x2a2a3a, width: 1.5, alpha })
        fire.circle(s.x, by, 12).fill({ color: 0xf6e7c8, alpha }).stroke({ color: 0x5a3d22, width: 2, alpha })
      }
      const lens = s.spr ? s.spr.texture.height * s.spr.scale.y * SAT_LENS : 8
      const lx = s.x - Math.sin(s.rot) * lens, ly = by + Math.cos(s.rot) * lens
      if (!s.busy) continue
      // mắt kính sáng dần khi ngắm + vạch ngắm mờ tới điểm nhắm
      const ch = Math.min(1, s.charge / SAT_LEAD_S)
      glow.circle(lx, ly, 4 + 8 * ch).fill({ color: BEAM_OUTER, alpha: (0.3 + 0.6 * ch) * alpha })
      if (s.beam < 0) this.beamQuad(lx, ly, s.ax, s.ay, 2, BEAM_OUTER, 0.25 * ch * alpha)
      // tia laser: bùng to nhanh rồi thu nhỏ dần
      if (s.beam >= 0 && s.beam < BEAM_S) {
        const kb = s.beam / BEAM_S
        const wk = kb < 0.15 ? kb / 0.15 : 1 - ((kb - 0.15) / 0.85) * 0.8
        const ww = 2 * s.w * wk * (0.92 + 0.08 * Math.sin(s.beam * 80))
        this.beamQuad(lx, ly, s.ax, s.ay, ww * 1.6, BEAM_OUTER, 0.25 * (1 - kb))
        this.beamQuad(lx, ly, s.ax, s.ay, ww, BEAM_OUTER, 0.6 * (1 - kb * 0.5))
        this.beamQuad(lx, ly, s.ax, s.ay, ww * 0.36, BEAM_CORE, 0.95)
        glow.circle(s.ax, s.ay, s.w * 1.4 * wk).fill({ color: BEAM_CORE, alpha: 0.7 * (1 - kb) })
      }
    }
  }

  update(dt: number): void {
    const back = this.back, fire = this.fire, glow = this.glow
    back.clear()
    fire.clear()
    glow.clear()
    this.drawShellArcs(glow)
    this.drawShellStreaks(glow)
    for (let i = this.booms.length - 1; i >= 0; i--) {
      const b = this.booms[i]!
      b.age += dt
      if (b.age >= BOOM_LIFE) { b.core?.destroy(); b.ring?.destroy(); this.booms.splice(i, 1); continue }
      if (b.core) {
        const c = b.core, w = c.texture.width
        c.position.set(b.x, b.y)
        c.scale.set((2 * b.r * CORE_GROW * (0.35 + 0.65 * Math.min(1, b.age / CORE_POP))) / w)
        c.alpha = b.age < CORE_HOLD ? 1 : Math.max(0, 1 - (b.age - CORE_HOLD) / (CORE_END - CORE_HOLD))
        c.tint = lerpColor(0xffffff, 0xff9a70, Math.min(1, b.age / CORE_END))
      }
      // chớp sáng
      if (b.age < FLASH_S) {
        const f = 1 - b.age / FLASH_S
        glow.circle(b.x, b.y, b.r * (0.35 + 0.5 * (1 - f))).fill({ color: 0xfff6d0, alpha: 0.55 * f })
      }
      // sóng xung kích: vòng mỏng nở nhanh rồi tan
      const k = b.age / BOOM_LIFE, e = 1 - (1 - k) * (1 - k) * (1 - k)
      if (b.ring) {
        b.ring.position.set(b.x, b.y)
        b.ring.scale.set((2 * b.r * (0.5 + 1.3 * e)) / b.ring.texture.width)
        b.ring.alpha = 0.7 * (1 - k)
      } else glow.circle(b.x, b.y, b.r * (0.5 + 1.3 * e)).stroke({ color: 0xffe2a8, width: Math.max(1, 4 * (1 - k)), alpha: 0.5 * (1 - k) })
    }
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.parts[i]!
      if (!p.alive) continue
      p.age += dt
      if (p.age >= p.life) { p.alive = false; const s = this.psprites[i]; if (s) s.visible = false; continue }
      const k = p.age / p.life
      if (p.spr) { this.drawArt(p, this.psprites[i]!, k, dt); continue }
      switch (p.kind) {
        case P_FIRE: {
          p.vx *= 1 - 3 * dt; p.vy = p.vy * (1 - 3 * dt) - 40 * dt
          p.x += p.vx * dt; p.y += p.vy * dt
          const c = k < 0.35 ? lerpColor(FIRE_HOT, FIRE_MID, k / 0.35) : lerpColor(FIRE_MID, FIRE_COOL, (k - 0.35) / 0.65)
          fire.circle(p.x, p.y, p.size * (0.7 + 0.6 * k) * (1 - 0.5 * k * k)).fill({ color: c, alpha: 0.95 * (1 - k * k) })
          break
        }
        case P_SMOKE: case P_DUST: {
          p.vx *= 1 - 1.5 * dt; p.vy *= 1 - 1.2 * dt
          if (p.kind === P_SMOKE) p.vy -= 12 * dt
          p.x += p.vx * dt; p.y += p.vy * dt
          const fadeIn = Math.min(1, p.age / 0.12)
          back.circle(p.x, p.y, p.size * (1 + 1.2 * k)).fill({ color: p.color, alpha: (p.kind === P_SMOKE ? 0.5 : 0.45) * fadeIn * (1 - k) })
          break
        }
        case P_SPARK: {
          p.vy += GRAVITY * 0.6 * dt
          p.x += p.vx * dt; p.y += p.vy * dt
          glow.moveTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025).lineTo(p.x, p.y).stroke({ color: p.color, width: p.size, alpha: 1 - k })
          break
        }
        case P_DEBRIS: {
          p.vy += GRAVITY * dt
          p.x += p.vx * dt; p.y += p.vy * dt
          const s = p.size
          back.rect(p.x - s / 2, p.y - s / 2, s, s).fill({ color: p.color, alpha: k < 0.75 ? 1 : (1 - k) / 0.25 })
          break
        }
        case P_EMBER: {
          const fl = 0.6 + 0.4 * Math.sin(p.age * 30 + i)
          glow.circle(p.x, p.y, p.size).fill({ color: lerpColor(0xffc060, p.color, k), alpha: fl * (1 - k) })
          break
        }
        default: break
      }
    }
    this.drawSats(dt)
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i]!
      b.age += dt
      if (b.age >= BOLT_S) { b.g.destroy(); this.bolts.splice(i, 1); continue }
      b.g.alpha = 1 - b.age / BOLT_S
    }
    for (const o of this.pops) {
      if (!o.alive) continue
      o.age += dt
      if (o.age >= POP_S) { o.alive = false; o.text.visible = false; continue }
      const k = o.age / POP_S, t = o.text
      t.y = o.baseY - POP_RISE * (1 - (1 - k) * (1 - k))
      t.alpha = k < 0.65 ? 1 : (1 - k) / 0.35
      const pop = o.age < 0.12 ? 1.35 - 0.35 * (o.age / 0.12) : 1       // nảy to lúc mới hiện
      t.scale.set(o.k * pop)
    }
    this.shake = Math.max(0, this.shake - dt * 30)
    this.shakeX = this.shake > 0 ? (Math.random() * 2 - 1) * this.shake : 0
    this.shakeY = this.shake > 0 ? (Math.random() * 2 - 1) * this.shake : 0
  }

  /** Vẽ + di chuyển một hạt bằng ảnh. */
  private drawArt(p: Particle, s: Sprite, k: number, dt: number): void {
    const w = s.texture.width
    switch (p.kind) {
      case P_FIRE: {
        p.vx *= 1 - 3 * dt; p.vy = p.vy * (1 - 3 * dt) - 40 * dt
        s.scale.set((2 * p.size * (0.7 + 0.6 * k) * (1 - 0.5 * k * k)) / w)
        s.tint = lerpColor(0xffffff, 0xff8a60, k)
        s.alpha = 0.95 * (1 - k * k)
        break
      }
      case P_SMOKE: case P_DUST: {
        p.vx *= 1 - 1.5 * dt; p.vy *= 1 - 1.2 * dt
        if (p.kind === P_SMOKE) p.vy -= 12 * dt
        s.scale.set((2 * p.size * (1 + 1.2 * k)) / w)
        s.tint = lerpColor(p.color, 0xffffff, 0.5)
        s.alpha = 0.7 * Math.min(1, p.age / 0.12) * (1 - k)
        break
      }
      case P_SPARK: {
        p.vy += GRAVITY * 0.6 * dt
        s.scale.set((p.size * 5) / w)
        s.alpha = 1 - k
        break
      }
      case P_DEBRIS: case P_BIT: {
        p.vy += GRAVITY * dt
        s.scale.set((p.size * 3) / w)
        if (p.kind === P_DEBRIS) s.tint = lerpColor(p.color, 0xffffff, 0.45)
        s.alpha = k < 0.75 ? 1 : (1 - k) / 0.25
        break
      }
      case P_IMPACT: {
        s.scale.set((p.size * (0.55 + 0.45 * Math.min(1, k / 0.3))) / w)
        s.alpha = 1 - k * k
        break
      }
      case P_MUZZLE: {
        s.scale.set((p.size * (0.7 + 0.5 * k)) / w)
        s.alpha = 1 - k
        break
      }
      default: break
    }
    p.x += p.vx * dt; p.y += p.vy * dt
    p.rot += p.vr * dt
    s.position.set(p.x, p.y)
    s.rotation = p.rot
  }

  /** Đạn trúng xe: "bụp" kiểu truyện tranh + vài mảnh kim loại văng lên. */
  hitImpact(x: number, y: number): void {
    this.spawn(P_IMPACT, x, y, 0, 0, IMPACT_S, IMPACT_SIZE, 0xffffff)
    if (!ART.bits.length) return
    for (let i = 0; i < IMPACT_BITS; i++) {
      const a = -Math.PI * rnd(0.15, 0.85), sp = rnd(120, 300)
      this.spawn(P_BIT, x, y, Math.cos(a) * sp, Math.sin(a) * sp, rnd(0.7, 1.1), rnd(2.5, 4), 0xffffff)
    }
  }

  /** Còn phần chính của vụ nổ / tia sét đang chạy (khói, mảnh đất bay tiếp không tính, để không làm chậm lượt). */
  get busy(): boolean {
    for (const b of this.booms) if (b.age < BOOM_S) return true
    for (const s of this.sats) if (s.beam >= 0 && s.beam < BEAM_S) return true
    return this.bolts.length > 0
  }
}
