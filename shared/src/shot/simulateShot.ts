import { DT_SIM, MUZZLE_DIST, SHOT_MAX_TIME_S, SHOT_SAMPLE_EVERY } from '../constants'
import { aimDir, aimRange, type AimRange } from '../aim'
import { clamp, degToRad, type Vec2 } from '../math'
import type { MobileDef } from '../mobiles'
import { FLYING, HIT_TERRAIN, stepProjectile, type ProjectileState } from '../physics/projectile'
import type { ShotDef } from '../shots'
import { TUNING, type Tuning } from '../tuning'
import type { Weather } from '../weather'
import type { FireCmd, ShotEvent, ShotInput, ShotResult, ShotVehicle } from './types'

const dir: Vec2 = { x: 0, y: 0 }
const IMMUNE_S = 0.3        // sau khi rời nòng, đạn chưa va chạm với chính xe bắn

interface Shell {
  p: ProjectileState
  path: number[]
  tStart: number
  child: boolean          // quả con sau khi tách: không tách nữa
  mode: 'fly' | 'drill' | 'roll'
  rising: boolean         // drill.resurface: đang ở pha trồi lên
  dx: number; dy: number  // hướng khoan
  remaining: number       // px khoan còn lại
  sinceCarve: number
  samples: number
  alive: boolean
  grown: boolean          // airGrow: đã bay đủ lâu
  pierced: number         // số lần đã xuyên đất (pierce)
  tp: number              // lần cuối qua cổng (portal)
  fuseAt: number          // roller.crawl: thời điểm tự nổ (-1 = chưa chạm đất)
  head: number            // tandem: 1 = đầu 1, 2 = đầu 2 (0 = không phải tandem)
  twinK: number           // twin: số thứ tự viên (-1 = không xoắn)
  off: number             // twin: độ lệch hiện tại khỏi trục bay (px, theo phương vuông góc vận tốc)
}

interface Pending { tStart: number; angleDeg: number; head: number }
type LightningBeh = Extract<ShotDef['behavior'], { kind: 'lightning' }>
/** Tia sét chờ giáng: `ang` = lệch khỏi phương thẳng đứng (rad); `march` = tia đi từ trời xuống và dừng ở vật rắn đầu tiên (không thì nổ thẳng tại (x, y), như sét của thời tiết). */
interface Bolt { t: number; x: number; y: number; ang: number; march: boolean; after: { delay: number; damage: number } | null; def: { damage: number; blastRadius: number; carveRadius: number } }
interface After { t: number; id: number; damage: number }
const BOLT_STEP = 3, BOLT_MAX_ANG = degToRad(70), ZERO_ANGLES: readonly number[] = [0]
type SatelliteBeh = Extract<ShotDef['behavior'], { kind: 'satellite' }>
interface Beam { t: number; x: number; y: number; def: SatelliteBeh }

const sanRange: AimRange = { min: 0, max: 90 }

/** Kẹp lệnh bắn về giá trị hợp lệ theo dải góc của pháo (tính cả độ dốc với xe `slopeAim`; server dùng trước khi mô phỏng). */
export function sanitizeFire(f: FireCmd, mobile: MobileDef, facing: 1 | -1 = 1, tilt = 0): FireCmd {
  const slot = f.slot === 1 || f.slot === 2 ? f.slot : 0
  const r = aimRange(sanRange, mobile, facing, tilt)
  return { angle: Math.round(clamp(f.angle, r.min, r.max)), power: clamp(f.power, 0, 100), slot }
}

/**
 * Mô phỏng trọn một phát bắn, thuần và xác định: cùng input ⇒ cùng kết quả.
 * Có thể nhiều viên đạn (bắn liền, tách ở đỉnh) và vụ nổ trễ (sét); kết thúc khi hết đạn đang bay/đang chờ.
 */
export function simulateShot(input: ShotInput, tuning: Tuning = TUNING): ShotResult {
  const shooter = input.vehicles.find(v => v.id === input.shooterId)
  if (!shooter) throw new Error('không thấy xe bắn')
  const mobile = tuning.mobiles[shooter.mobileId]
  if (!mobile) throw new Error(`không có pháo ${shooter.mobileId}`)
  const fire = sanitizeFire(input.fire, mobile, input.facing, input.tilt)
  const def = input.shotDef ?? mobile.shots[fire.slot]
  const beh = def.behavior
  const mask = input.mask.clone()
  const hp = new Map<number, number>(input.vehicles.map(v => [v.id, v.hp]))
  const shield = new Map<number, number>(input.vehicles.map(v => [v.id, v.shield ?? 0]))
  const ax = input.wind.x * tuning.windScale * def.windFactor
  const ay = tuning.gravity * def.gravityFactor + input.wind.y * tuning.windScale * def.windFactor
  const speed = (fire.power / 100) * def.maxSpeed
  const wax = input.wind.x * tuning.windScale * def.windFactor      // phần gia tốc do gió (để Gương nước đảo chiều)
  const way = input.wind.y * tuning.windScale * def.windFactor
  const W: Weather | null = input.weather ?? null
  const wt = tuning.weather
  let stormUsed = false

  const events: ShotEvent[] = []
  const shells: Shell[] = []
  const pending: Pending[] = []
  const bolts: Bolt[] = []
  const afters: After[] = []
  const aftered = new Set<number>()
  const tandemHit = new Set<number>()   // tandem: xe đã trúng đầu 1 (đầu 2 bỏ qua giáp của chúng)
  const hitNow: number[] = []
  const strike = { x: 0, y: 0, x0: 0, y0: 0 }
  const beams: Beam[] = []

  const newShell = (x: number, y: number, vx: number, vy: number, t: number, child: boolean): Shell => {
    const s: Shell = {
      p: { x, y, vx, vy, t, alive: true }, path: [t, x, y], tStart: t, child, mode: 'fly',
      rising: false, dx: 0, dy: 0, remaining: 0, sinceCarve: 0, samples: 0, alive: true, grown: false, pierced: 0, tp: -1, twinK: -1, off: 0, head: 0, fuseAt: -1,
    }
    shells.push(s)
    return s
  }

  /** Trừ `amount` sát thương (đã tính giáp) của xe `id`: khiên hấp thụ trước, phần dư trừ máu. Báo event damage (amount = tổng, kèm máu và khiên còn lại). */
  const hurt = (id: number, amount: number, t: number): void => {
    const sh = shield.get(id) ?? 0
    const absorbed = Math.min(sh, amount)
    shield.set(id, sh - absorbed)
    const after = Math.max(0, (hp.get(id) ?? 0) - (amount - absorbed))
    hp.set(id, after)
    events.push({ t, kind: 'damage', id, amount, hpAfter: after, shieldAfter: sh - absorbed })
  }

  /** Nổ: khoét hố + sát thương lên mọi xe trong bán kính + (nếu có) giảm giáp. */
  const blast = (x: number, y: number, t: number, blastR: number, carveR: number, damage: number, breakArmor: boolean, bypass: Set<number> | null = null): void => {
    events.push({ t, kind: 'explode', x, y, r: blastR })
    if (carveR > 0) {
      mask.carveCircle(x, y, carveR)
      events.push({ t, kind: 'carve', x, y, r: carveR })
    }
    for (const v of input.vehicles) {
      const cur = hp.get(v.id) ?? 0
      if (cur <= 0) continue
      const d = Math.max(0, Math.hypot(v.x - x, v.y - y) - v.radius)
      if (d >= blastR) continue
      if (def.shieldBreak && (shield.get(v.id) ?? 0) > 0) { shield.set(v.id, 0); events.push({ t, kind: 'shield', id: v.id, shieldAfter: 0 }) }   // xoá khiên của mọi xe trong vùng nổ trước khi tính sát thương
      const amount = Math.round(damage * (1 - d / blastR) * (1 - (bypass?.has(v.id) ? 0 : v.armor)))
      if (amount <= 0) continue
      hitNow.push(v.id)
      hurt(v.id, amount, t)
      if (breakArmor && def.armorBreak) events.push({ t, kind: 'armorBreak', id: v.id, turns: def.armorBreak.turns, amount: def.armorBreak.amount })
    }
  }

  /** Lên lịch các tia sét của đạn lightning sau khi đạn chạm (x, y): các tia chéo/thẳng ở chỗ chạm + (SS) một tia vào đầu mỗi xe trong vùng. */
  const scheduleLightning = (b: LightningBeh, x: number, y: number, t: number): void => {
    for (const a of b.angles ?? ZERO_ANGLES) {
      bolts.push({ t: t + b.delay, x: x - Math.sign(a) * (b.spread ?? 0), y, ang: clamp(degToRad(a), -BOLT_MAX_ANG, BOLT_MAX_ANG), march: true, after: b.aftershock ?? null, def: b })
    }
    if (b.area) {
      let k = 0
      for (const v of input.vehicles) {
        if (v.id === input.shooterId || (hp.get(v.id) ?? 0) <= 0 || Math.hypot(v.x - x, v.y - y) > b.area.radius) continue
        bolts.push({ t: t + b.delay + k * b.area.stagger, x: v.x, y: v.y, ang: 0, march: true, after: b.aftershock ?? null, def: b.area })
        k++
      }
    }
    bolts.sort((p, q) => p.t - q.t)
  }

  /** Điểm chạm của tia sét: đi từ trời (y = -20) tới (b.x, b.y) theo góc `b.ang`, dừng ở vật rắn đầu tiên (đất hoặc xe còn sống). Kết quả ở `strike`. */
  const boltTarget = (b: Bolt): void => {
    if (!b.march) { strike.x = b.x; strike.y = b.y; strike.x0 = b.x; strike.y0 = -20; return }
    const sa = Math.sin(b.ang), ca = Math.cos(b.ang)
    const len = Math.max(30, (b.y + 20) / ca)
    const x0 = b.x - sa * len, y0 = b.y - ca * len
    strike.x0 = x0; strike.y0 = y0
    strike.x = b.x; strike.y = b.y
    for (let d = 0; d < len; d += BOLT_STEP) {
      const px = x0 + sa * d, py = y0 + ca * d
      let stop = mask.isSolid(px, py)
      if (!stop) for (const v of input.vehicles) if ((hp.get(v.id) ?? 0) > 0 && Math.hypot(v.x - px, v.y - py) <= v.radius) { stop = true; break }
      if (stop) { strike.x = px; strike.y = py; return }
    }
  }

  const explodeShell = (s: Shell, x: number, y: number, t: number): void => {
    s.alive = false
    s.path.push(t, x, y)
    if (beh.kind === 'teleport') { events.push({ t, kind: 'teleport', x, y }); return }
    const g = beh.kind === 'airGrow' && s.grown ? beh : null
    const c = beh.kind === 'splitAfter' && s.child ? beh.child : null
    const dmg = c?.damage ?? (beh.kind === 'tandem' && s.head === 2 ? beh.secondDamage : def.damage * (g?.damageMul ?? 1))
    hitNow.length = 0
    blast(x, y, t, c?.blastRadius ?? def.blastRadius * (g?.blastMul ?? 1), beh.kind === 'build' ? 0 : c?.carveRadius ?? def.carveRadius * (g?.carveMul ?? 1), dmg, true, s.head === 2 ? tandemHit : null)
    if (s.head === 1) for (const id of hitNow) tandemHit.add(id)
    if (beh.kind === 'lightning') scheduleLightning(beh, x, y, t)
    if (beh.kind === 'build') build(x, y, t, beh)
    if (beh.kind === 'satellite') {
      for (let k = 0; k < beh.count; k++) {
        const off = k === 0 ? 0 : (k % 2 === 1 ? 1 : -1) * Math.ceil(k / 2) * beh.spacing
        beams.push({ t: t + beh.delay + k * beh.interval, x: x + off, y, def: beh })
      }
      beams.sort((a, b) => a.t - b.t)
    }
  }

  /** Tia laser vệ tinh (Cú Thiên Văn) nhắm (ax, ay): từ tận trời thẳng xuống, hoặc từ trên đầu xe bắn chéo tới. Tia đi thẳng qua điểm nhắm, đốt xuyên
   *  `depth` px đất tính từ chỗ chạm đất đầu tiên (khoét rãnh dọc theo tia), trúng mọi xe nằm trên đoạn tia. */
  const beamRay = (ax: number, ay: number, t: number, b: SatelliteBeh): void => {
    const sky = b.from === 'sky'
    const hx = shooter.x, hy = shooter.y - b.altitude      // chỗ vệ tinh bay theo trên đầu xe (báo cho client trong event)
    let x0 = ax, y0 = 0, dx = 0, dy = 1
    if (!sky) {
      x0 = hx; y0 = hy
      const n = Math.hypot(ax - x0, ay - y0) || 1
      dx = (ax - x0) / n; dy = (ay - y0) / n
    }
    // đi từng px dọc tia (từ trời thì bắt đầu ở mép trên bản đồ) tới khi đủ `depth` px đất hoặc ra khỏi bản đồ
    let px = x0, py = y0, topX = -1, topY = -1, solid = 0
    const maxSteps = mask.width + mask.height * 2
    for (let i = 0; i < maxSteps; i++) {
      if (px < 0 || px >= mask.width || py >= mask.height || (py < 0 && dy <= 0)) break
      if (mask.isSolid(px, py)) {
        if (topX < 0) { topX = px; topY = py }
        if (++solid >= b.depth) break
      }
      px += dx; py += dy
    }
    const hitGround = solid >= b.depth
    events.push({ t, kind: 'beam', x: px, y: py, w: b.halfWidth, sky, x0: hx, y0: hy })
    if (topX >= 0) {
      const len = Math.hypot(px - topX, py - topY), step = Math.max(3, b.halfWidth / 2)
      for (let d = 0; ; d += step) {
        const k = Math.min(d, len)
        const cx = topX + dx * k, cy = topY + dy * k
        mask.carveCircle(cx, cy, b.halfWidth)
        events.push({ t, kind: 'carve', x: cx, y: cy, r: b.halfWidth })
        if (k >= len) break
      }
    }
    if (hitGround) events.push({ t, kind: 'explode', x: px, y: py, r: b.halfWidth * 1.6 })
    // trúng xe nằm trên đoạn tia (từ trời thì đoạn bắt đầu từ rất cao)
    const ox = x0, oy = sky ? -1e6 : y0
    const segX = px - ox, segY = py - oy, seg2 = segX * segX + segY * segY || 1
    for (const v of input.vehicles) {
      const cur = hp.get(v.id) ?? 0
      if (cur <= 0) continue
      const u = Math.max(0, Math.min(1, ((v.x - ox) * segX + (v.y - oy) * segY) / seg2))
      const d = Math.max(0, Math.hypot(v.x - (ox + segX * u), v.y - (oy + segY * u)) - v.radius)
      if (d >= b.halfWidth) continue
      const amount = Math.round(b.damage * (1 - d / b.halfWidth) * (1 - v.armor))
      if (amount <= 0) continue
      hurt(v.id, amount, t)
    }
  }

  /** Đắp tường đất: bỏ qua nếu chạm bất kỳ xe nào (tránh chôn xe), để server và client ra cùng mask. */
  const build = (x: number, y: number, t: number, b: Extract<ShotDef['behavior'], { kind: 'build' }>): void => {
    for (let k = 0; k < b.count; k++) {
      const cy = y - k * b.radius * 1.2
      if (input.vehicles.some(v => Math.hypot(v.x - x, v.y - cy) < b.radius + v.radius + 3)) continue
      mask.fillCircle(x, cy, b.radius)
      events.push({ t, kind: 'fill', x, y: cy, r: b.radius })
    }
  }

  /** Mặt đất đầu tiên dưới (x, y0) trong phạm vi `maxDown` px; -1 nếu không có. */
  const groundBelow = (x: number, y0: number, maxDown: number): number => {
    for (let y = Math.floor(y0); y <= y0 + maxDown; y++) if (mask.isSolid(x, y)) return y
    return -1
  }

  const hitsVehicle = (s: Shell, x: number, y: number, corpses = false): ShotVehicle | undefined => {
    for (const v of input.vehicles) {
      if (v.id === input.shooterId && s.p.t - s.tStart < IMMUNE_S) continue
      if ((corpses || (hp.get(v.id) ?? 0) > 0) && Math.hypot(v.x - x, v.y - y) <= v.radius) return v
    }
    return undefined
  }

  const spawn = (t: number, angleDeg: number, twinK = -1, head = 0): void => {
    aimDir(dir, angleDeg, input.facing)   // góc so với phương ngang, không cộng độ dốc
    let x = shooter.x + dir.x * MUZZLE_DIST, y = shooter.y + dir.y * MUZZLE_DIST
    const mz = mobile.muzzle
    if (mz) {   // đạn ra từ đầu nòng: gốc nòng xoay theo dốc xe, đầu nòng = gốc + ox dọc nòng + oy vuông góc nòng
      const f = input.facing, c = Math.cos(-input.tilt), sn = Math.sin(-input.tilt)
      const gx = f * mz.px, gy = mz.py
      const nx = f > 0 ? -dir.y : dir.y, ny = f > 0 ? dir.x : -dir.x
      x = shooter.x + gx * c - gy * sn + dir.x * mz.ox + nx * mz.oy
      y = shooter.y + gx * sn + gy * c + dir.y * mz.ox + ny * mz.oy
    }
    const s = newShell(x, y, dir.x * speed, dir.y * speed, t, false)
    if (twinK >= 0) s.twinK = twinK
    s.head = head
    if (beh.kind !== 'ghost' && mask.isSolid(x, y)) explodeShell(s, x, y, t)   // nòng chĩa thẳng vào đất (đạn xuyên địa hình thì cứ bay)
  }

  const split = (s: Shell, t: number, b: { count: number; spreadDeg: number }): void => {
    s.alive = false
    s.path.push(t, s.p.x, s.p.y)
    events.push({ t, kind: 'split', x: s.p.x, y: s.p.y })
    for (let k = 0; k < b.count; k++) {
      const a = ((k - (b.count - 1) / 2) * b.spreadDeg * Math.PI) / 180
      const c = Math.cos(a), sn = Math.sin(a)
      newShell(s.p.x, s.p.y, s.p.vx * c - s.p.vy * sn, s.p.vx * sn + s.p.vy * c, t, true)
    }
  }

  const stepDrill = (s: Shell, t: number, b: Extract<ShotDef['behavior'], { kind: 'drill' }>): void => {
    const adv = Math.min(b.speed * DT_SIM, s.remaining)
    if (s.rising && b.resurface) {   // pha trồi: hướng đào quay dần về hướng chếch lên (cua mềm, không gấp khúc)
      const up = degToRad(b.resurface.riseDeg), tx = (Math.sign(s.p.vx) || input.facing) * Math.cos(up), ty = -Math.sin(up)
      const cur = Math.atan2(s.dy, s.dx)
      let diff = Math.atan2(ty, tx) - cur
      if (diff > Math.PI) diff -= 2 * Math.PI
      else if (diff < -Math.PI) diff += 2 * Math.PI
      const turn = Math.sign(diff) * Math.min(Math.abs(diff), adv / b.resurface.turnRadius)
      s.dx = Math.cos(cur + turn); s.dy = Math.sin(cur + turn)
    }
    const nx = s.p.x + s.dx * adv, ny = s.p.y + s.dy * adv
    const inside = nx >= 0 && nx < mask.width && ny >= 0 && ny < mask.height
    // Mỗi lần khoan khoét hố bán kính R quanh đầu khoan nên "đất phía trước" phải xét cách R: hết đất trong phạm vi đó thì nổ luôn.
    const ahead = b.tunnelRadius + 1
    const diving = !!b.resurface && !s.rising   // đang lặn: chưa xét chuyện ra khỏi đất
    if (!inside || (!diving && !mask.isSolid(nx + s.dx * ahead, ny + s.dy * ahead)) || hitsVehicle(s, nx, ny)) { explodeShell(s, inside ? nx : s.p.x, inside ? ny : s.p.y, t); return }
    s.p.x = nx; s.p.y = ny; s.p.t = t
    s.remaining -= adv
    s.sinceCarve += adv
    if (!b.resurface && s.sinceCarve >= Math.max(4, b.tunnelRadius / 2)) {   // lặn trồi thì chui xuyên đất, không khoét hầm
      s.sinceCarve = 0
      mask.carveCircle(nx, ny, b.tunnelRadius)
      events.push({ t, kind: 'carve', x: nx, y: ny, r: b.tunnelRadius })
    }
    if (++s.samples % SHOT_SAMPLE_EVERY === 0) s.path.push(t, nx, ny)
    if (s.remaining <= 1e-6) {
      if (diving) {   // hết đoạn lặn: quay đầu đào chếch lên
        s.rising = true; s.remaining = b.resurface!.riseMax
      } else explodeShell(s, nx, ny, t)
    }
  }

  /** Lăn theo mặt đất (Cua Lăn): bám mặt đất, rơi tiếp khi hết đất, nổ khi gặp xe/vách cao/hết quãng. */
  const stepRoll = (s: Shell, t: number, b: Extract<ShotDef['behavior'], { kind: 'roller' }>): void => {
    if (b.crawl && t >= s.fuseAt) { explodeShell(s, s.p.x, s.p.y, t); return }
    const adv = b.crawl ? b.speed * DT_SIM : Math.min(b.speed * DT_SIM, s.remaining)
    const nx = s.p.x + s.dx * adv
    const up = tuning.move.stepUp, down = tuning.move.snapDown + 6
    let gy = -1
    for (let y = Math.floor(s.p.y) - up; y <= s.p.y + down; y++) if (mask.isSolid(nx, y)) { gy = y; break }
    if (gy === Math.floor(s.p.y) - up) {                                                       // vách cao: nổ (crawl: quay đầu)
      if (b.crawl) { s.dx = -s.dx; if (++s.samples % SHOT_SAMPLE_EVERY === 0) s.path.push(t, s.p.x, s.p.y); return }
      explodeShell(s, s.p.x, s.p.y, t); return
    }
    if (gy < 0) {                                                                              // hết đất: rơi tiếp
      s.mode = 'fly'; s.p.x = nx; s.p.vx = s.dx * b.speed; s.p.vy = 0
      s.path.push(t, s.p.x, s.p.y)
      return
    }
    s.p.x = nx; s.p.y = gy - 3; s.p.t = t
    if (hitsVehicle(s, s.p.x, s.p.y)) { explodeShell(s, s.p.x, s.p.y, t); return }
    s.remaining -= adv
    if (++s.samples % SHOT_SAMPLE_EVERY === 0) s.path.push(t, s.p.x, s.p.y)
    if (!b.crawl && s.remaining <= 1e-6) explodeShell(s, s.p.x, s.p.y, t)
  }

  /** Xuyên lớp đất mỏng (Sứa Đèn). Trả true nếu xuyên được (đạn tiếp tục bay). */
  const tryPierce = (s: Shell, t: number, b: Extract<ShotDef['behavior'], { kind: 'pierce' }>): boolean => {
    if (s.pierced >= b.maxPierce) return false
    const n = Math.hypot(s.p.vx, s.p.vy) || 1
    const ux = s.p.vx / n, uy = s.p.vy / n
    for (let d = 1; d <= b.maxThickness; d++) {
      const ex = s.p.x + ux * d, ey = s.p.y + uy * d
      if (mask.isSolid(ex, ey)) continue
      s.path.push(t, s.p.x, s.p.y)
      mask.carveCircle(s.p.x, s.p.y, b.holeRadius)
      events.push({ t, kind: 'carve', x: s.p.x, y: s.p.y, r: b.holeRadius })
      mask.carveCircle(ex, ey, b.holeRadius)
      events.push({ t, kind: 'carve', x: ex, y: ey, r: b.holeRadius })
      s.p.x = ex + ux * 2; s.p.y = ey + uy * 2; s.p.alive = true; s.p.t = t
      s.pierced++
      s.path.push(t, s.p.x, s.p.y)
      return true
    }
    return false
  }

  /** Đạn xuyên địa hình: bay theo trọng lực/gió như thường nhưng không va đất và không khoét đất, nổ khi chạm xe (kể cả xác). */
  const stepGhost = (s: Shell, t: number, sax: number, say: number): void => {
    s.p.vx += sax * DT_SIM; s.p.vy += say * DT_SIM
    s.p.x += s.p.vx * DT_SIM; s.p.y += s.p.vy * DT_SIM; s.p.t = t
    if (s.p.x < 0 || s.p.x >= mask.width || s.p.y >= mask.height) {
      s.alive = false; s.path.push(t, s.p.x, s.p.y); events.push({ t, kind: 'out', x: s.p.x, y: s.p.y }); return
    }
    if (hitsVehicle(s, s.p.x, s.p.y, true)) { explodeShell(s, s.p.x, s.p.y, t); return }
    if (++s.samples % SHOT_SAMPLE_EVERY === 0) s.path.push(t, s.p.x, s.p.y)
  }

  const stepFly = (s: Shell, t: number): void => {
    let sax = ax, say = ay
    if (W) {
      if (W.kind === 'whirl' && Math.abs(s.p.x - W.x) <= W.hw) say -= wt.whirl.lift
      else if (W.kind === 'mirror' && Math.abs(s.p.x - W.x) <= W.hw) { sax = ax - 2 * wax; say = ay - 2 * way }
    }
    if (def.curve) sax -= input.facing * def.curve.returnAccel * Math.min(1, (t - s.tStart) / def.curve.rampS)   // boomerang: kéo ngược về phía người bắn
    if (beh.kind === 'ghost') { stepGhost(s, t, sax, say); return }
    const r = stepProjectile(s.p, sax, say, DT_SIM, mask)
    s.p.t = t
    if (beh.kind === 'airGrow' && !s.grown && t - s.tStart >= beh.afterS) {
      s.grown = true
      events.push({ t, kind: 'grow', shell: shells.indexOf(s), x: s.p.x, y: s.p.y })
    }
    if (r === FLYING && W) {
      if (W.kind === 'storm' && !stormUsed && Math.abs(s.p.x - W.x) <= W.hw && Math.abs(s.p.y - W.y) <= W.hh) {
        const gy = groundBelow(s.p.x, s.p.y, mask.height)
        if (gy >= 0) { stormUsed = true; bolts.push({ t: t + wt.storm.delay, x: s.p.x, y: gy, ang: 0, march: false, after: null, def: wt.storm }); bolts.sort((a, b) => a.t - b.t) }
      } else if (W.kind === 'portal' && t - s.tp > 0.3) {
        const inA = Math.hypot(s.p.x - W.x, s.p.y - W.y) <= W.hw
        const inB = !inA && Math.hypot(s.p.x - W.x2, s.p.y - W.y2) <= W.hw
        if (inA || inB) {
          s.alive = false
          s.path.push(t, s.p.x, s.p.y)
          const c = newShell(inA ? W.x2 : W.x, inA ? W.y2 : W.y, s.p.vx, s.p.vy, t, s.child)
          c.tp = t; c.pierced = s.pierced
          return
        }
      }
    }
    if (r === FLYING && s.twinK >= 0 && beh.kind === 'twin') {   // xoắn quanh trục: dịch viên đạn thêm phần chênh của độ lệch so với bước trước
      const tt = Math.min(t - s.tStart, beh.convergeS)
      const off = beh.radius * (1 - tt / beh.convergeS) * Math.sin((2 * Math.PI * s.twinK) / beh.count + (2 * Math.PI * beh.turns * tt) / beh.convergeS)
      const sp = Math.hypot(s.p.vx, s.p.vy) || 1
      const d = off - s.off
      s.p.x += (-s.p.vy / sp) * d; s.p.y += (s.p.vx / sp) * d; s.off = off
      if (mask.isSolid(s.p.x, s.p.y)) { explodeShell(s, s.p.x, s.p.y, t); return }
    }
    if (r === FLYING) {
      if (hitsVehicle(s, s.p.x, s.p.y)) { explodeShell(s, s.p.x, s.p.y, t); return }
      if (beh.kind === 'splitAtApex' && !s.child && s.p.vy >= 0) { split(s, t, beh); return }
      if (beh.kind === 'splitAfter' && !s.child && t - s.tStart >= beh.afterS) { split(s, t, beh); return }
      if (++s.samples % SHOT_SAMPLE_EVERY === 0) s.path.push(t, s.p.x, s.p.y)
      return
    }
    if (r === HIT_TERRAIN) {
      if (beh.kind === 'drill') {
        let dx = s.p.vx, dy = s.p.vy
        if (beh.direction === 'horizontal') { dx = Math.sign(s.p.vx) || input.facing; dy = 0 }
        else if (beh.direction === 'down') { dx = 0; dy = 1 }
        const n = Math.hypot(dx, dy) || 1
        s.mode = 'drill'; s.dx = dx / n; s.dy = dy / n; s.remaining = beh.resurface ? beh.resurface.diveLength : beh.length; s.sinceCarve = 0
        s.path.push(t, s.p.x, s.p.y)
        return
      }
      if (beh.kind === 'roller') {
        s.mode = 'roll'; s.dx = Math.sign(s.p.vx) || input.facing; s.remaining = beh.distance
        if (beh.crawl && s.fuseAt < 0) s.fuseAt = t + beh.crawl.fuseS
        s.p.alive = true; s.p.y -= 3
        s.path.push(t, s.p.x, s.p.y)
        return
      }
      if (beh.kind === 'pierce' && tryPierce(s, t, beh)) return
      explodeShell(s, s.p.x, s.p.y, t)
      return
    }
    s.alive = false
    s.path.push(t, s.p.x, s.p.y)
    events.push({ t, kind: 'out', x: s.p.x, y: s.p.y })
  }

  // Lịch bắn: đạn đầu ở t = 0; chùm liền thì các quả sau theo `interval`.
  if (beh.kind === 'spread') {
    for (let k = 0; k < beh.count; k++) spawn(0, fire.angle + (k - (beh.count - 1) / 2) * beh.spreadDeg)
  } else if (beh.kind === 'tandem') {
    spawn(0, fire.angle, -1, 1)
    pending.push({ tStart: beh.gapS, angleDeg: fire.angle, head: 2 })
  } else if (beh.kind === 'twin') {
    for (let k = 0; k < beh.count; k++) spawn(0, fire.angle, k)
  } else spawn(0, fire.angle)
  if (beh.kind === 'burst') for (let k = 1; k < beh.count; k++) pending.push({ tStart: k * beh.interval, angleDeg: fire.angle + k * beh.angleStepDeg, head: 0 })

  let t = 0
  const maxSteps = Math.round(SHOT_MAX_TIME_S / DT_SIM)
  for (let i = 1; i <= maxSteps; i++) {
    t = i * DT_SIM
    while (pending.length && pending[0]!.tStart <= t + 1e-9) { const q = pending.shift()!; spawn(t, q.angleDeg, -1, q.head) }
    while (bolts.length && bolts[0]!.t <= t + 1e-9) {
      const b = bolts.shift()!
      boltTarget(b)
      events.push(b.march ? { t, kind: 'bolt', x: strike.x, y: strike.y, x0: strike.x0, y0: strike.y0 } : { t, kind: 'bolt', x: strike.x, y: strike.y })
      hitNow.length = 0
      blast(strike.x, strike.y, t, b.def.blastRadius, b.def.carveRadius, b.def.damage, false)
      if (b.after) {
        for (const id of hitNow) if (!aftered.has(id)) { aftered.add(id); afters.push({ t: t + b.after.delay, id, damage: b.after.damage }) }
        afters.sort((p, q) => p.t - q.t)
      }
    }
    while (afters.length && afters[0]!.t <= t + 1e-9) {
      const a = afters.shift()!
      const v = input.vehicles.find(q => q.id === a.id)
      const cur = hp.get(a.id) ?? 0
      if (!v || cur <= 0) continue
      const amount = Math.round(a.damage * (1 - v.armor))
      if (amount <= 0) continue
      hurt(a.id, amount, t)
    }
    while (beams.length && beams[0]!.t <= t + 1e-9) { const b = beams.shift()!; beamRay(b.x, b.y, t, b.def) }
    for (let k = 0; k < shells.length; k++) {   // vòng for theo chỉ số: quả con có thể được thêm vào cuối khi đang lặp
      const s = shells[k]!
      if (!s.alive) continue
      if (s.mode === 'drill') stepDrill(s, t, beh as Extract<ShotDef['behavior'], { kind: 'drill' }>)
      else if (s.mode === 'roll') stepRoll(s, t, beh as Extract<ShotDef['behavior'], { kind: 'roller' }>)
      else stepFly(s, t)
    }
    if (!pending.length && !bolts.length && !afters.length && !beams.length && shells.every(s => !s.alive)) break
  }
  // hết giờ mô phỏng: đạn còn bay coi như ra ngoài
  for (const s of shells) if (s.alive) { s.alive = false; s.path.push(t, s.p.x, s.p.y); events.push({ t, kind: 'out', x: s.p.x, y: s.p.y }) }

  events.sort((a, b) => a.t - b.t)   // sort ổn định: giữ thứ tự sinh ra khi cùng t
  return { paths: shells.map(s => s.path), events, endT: t, terrainHashAfter: input.skipHash ? 0 : mask.hash(), maskAfter: mask }
}
