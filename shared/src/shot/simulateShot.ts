import { DT_SIM, MUZZLE_DIST, SHOT_MAX_TIME_S, SHOT_SAMPLE_EVERY } from '../constants'
import { aimDir } from '../aim'
import { clamp, type Vec2 } from '../math'
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
  dx: number; dy: number  // hướng khoan
  remaining: number       // px khoan còn lại
  sinceCarve: number
  samples: number
  alive: boolean
  pierced: number         // số lần đã xuyên đất (pierce)
  tp: number              // lần cuối qua cổng (portal)
}

interface Pending { tStart: number; angleDeg: number }
interface Bolt { t: number; x: number; y: number; def: { damage: number; blastRadius: number; carveRadius: number } }

/** Kẹp lệnh bắn về giá trị hợp lệ theo dải góc của pháo (server dùng trước khi mô phỏng). */
export function sanitizeFire(f: FireCmd, mobile: MobileDef): FireCmd {
  const slot = f.slot === 1 || f.slot === 2 ? f.slot : 0
  return { angle: Math.round(clamp(f.angle, mobile.angleMin, mobile.angleMax)), power: clamp(f.power, 0, 100), slot }
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
  const fire = sanitizeFire(input.fire, mobile)
  const def = mobile.shots[fire.slot]
  const beh = def.behavior
  const mask = input.mask.clone()
  const hp = new Map<number, number>(input.vehicles.map(v => [v.id, v.hp]))
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

  const newShell = (x: number, y: number, vx: number, vy: number, t: number, child: boolean): Shell => {
    const s: Shell = {
      p: { x, y, vx, vy, t, alive: true }, path: [t, x, y], tStart: t, child, mode: 'fly',
      dx: 0, dy: 0, remaining: 0, sinceCarve: 0, samples: 0, alive: true, pierced: 0, tp: -1,
    }
    shells.push(s)
    return s
  }

  /** Nổ: khoét hố + sát thương lên mọi xe trong bán kính + (nếu có) giảm giáp. */
  const blast = (x: number, y: number, t: number, blastR: number, carveR: number, damage: number, breakArmor: boolean): void => {
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
      const amount = Math.round(damage * (1 - d / blastR) * (1 - v.armor))
      if (amount <= 0) continue
      const after = Math.max(0, cur - amount)
      hp.set(v.id, after)
      events.push({ t, kind: 'damage', id: v.id, amount, hpAfter: after })
      if (breakArmor && def.armorBreak) events.push({ t, kind: 'armorBreak', id: v.id, turns: def.armorBreak.turns, amount: def.armorBreak.amount })
    }
  }

  const explodeShell = (s: Shell, x: number, y: number, t: number): void => {
    s.alive = false
    s.path.push(t, x, y)
    blast(x, y, t, def.blastRadius, beh.kind === 'build' ? 0 : def.carveRadius, def.damage, true)
    if (beh.kind === 'lightning') bolts.push({ t: t + beh.delay, x, y, def: beh })
    if (beh.kind === 'build') build(x, y, t, beh)
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

  const hitsVehicle = (s: Shell, x: number, y: number): ShotVehicle | undefined => {
    for (const v of input.vehicles) {
      if (v.id === input.shooterId && s.p.t - s.tStart < IMMUNE_S) continue
      if ((hp.get(v.id) ?? 0) > 0 && Math.hypot(v.x - x, v.y - y) <= v.radius) return v
    }
    return undefined
  }

  const spawn = (t: number, angleDeg: number): void => {
    aimDir(dir, angleDeg, input.facing, input.tilt)
    const x = shooter.x + dir.x * MUZZLE_DIST, y = shooter.y + dir.y * MUZZLE_DIST
    const s = newShell(x, y, dir.x * speed, dir.y * speed, t, false)
    if (mask.isSolid(x, y)) explodeShell(s, x, y, t)   // nòng chĩa thẳng vào đất
  }

  const split = (s: Shell, t: number, b: Extract<ShotDef['behavior'], { kind: 'splitAtApex' }>): void => {
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
    const nx = s.p.x + s.dx * adv, ny = s.p.y + s.dy * adv
    const inside = nx >= 0 && nx < mask.width && ny >= 0 && ny < mask.height
    // Mỗi lần khoan khoét hố bán kính R quanh đầu khoan nên "đất phía trước" phải xét cách R: hết đất trong phạm vi đó thì nổ luôn.
    const ahead = b.tunnelRadius + 1
    if (!inside || !mask.isSolid(nx + s.dx * ahead, ny + s.dy * ahead) || hitsVehicle(s, nx, ny)) { explodeShell(s, inside ? nx : s.p.x, inside ? ny : s.p.y, t); return }
    s.p.x = nx; s.p.y = ny; s.p.t = t
    s.remaining -= adv
    s.sinceCarve += adv
    if (s.sinceCarve >= Math.max(4, b.tunnelRadius / 2)) {
      s.sinceCarve = 0
      mask.carveCircle(nx, ny, b.tunnelRadius)
      events.push({ t, kind: 'carve', x: nx, y: ny, r: b.tunnelRadius })
    }
    if (++s.samples % SHOT_SAMPLE_EVERY === 0) s.path.push(t, nx, ny)
    if (s.remaining <= 1e-6) explodeShell(s, nx, ny, t)
  }

  /** Lăn theo mặt đất (Cua Lăn): bám mặt đất, rơi tiếp khi hết đất, nổ khi gặp xe/vách cao/hết quãng. */
  const stepRoll = (s: Shell, t: number, b: Extract<ShotDef['behavior'], { kind: 'roller' }>): void => {
    const adv = Math.min(b.speed * DT_SIM, s.remaining)
    const nx = s.p.x + s.dx * adv
    const up = tuning.move.stepUp, down = tuning.move.snapDown + 6
    let gy = -1
    for (let y = Math.floor(s.p.y) - up; y <= s.p.y + down; y++) if (mask.isSolid(nx, y)) { gy = y; break }
    if (gy === Math.floor(s.p.y) - up) { explodeShell(s, s.p.x, s.p.y, t); return }          // vách cao: nổ
    if (gy < 0) {                                                                              // hết đất: rơi tiếp
      s.mode = 'fly'; s.p.x = nx; s.p.vx = s.dx * b.speed; s.p.vy = 0
      s.path.push(t, s.p.x, s.p.y)
      return
    }
    s.p.x = nx; s.p.y = gy - 3; s.p.t = t
    if (hitsVehicle(s, s.p.x, s.p.y)) { explodeShell(s, s.p.x, s.p.y, t); return }
    s.remaining -= adv
    if (++s.samples % SHOT_SAMPLE_EVERY === 0) s.path.push(t, s.p.x, s.p.y)
    if (s.remaining <= 1e-6) explodeShell(s, s.p.x, s.p.y, t)
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

  const stepFly = (s: Shell, t: number): void => {
    let sax = ax, say = ay
    if (W) {
      if (W.kind === 'whirl' && Math.abs(s.p.x - W.x) <= W.hw) say -= wt.whirl.lift
      else if (W.kind === 'mirror' && Math.abs(s.p.x - W.x) <= W.hw) { sax = ax - 2 * wax; say = ay - 2 * way }
    }
    const r = stepProjectile(s.p, sax, say, DT_SIM, mask)
    s.p.t = t
    if (r === FLYING && W) {
      if (W.kind === 'storm' && !stormUsed && Math.abs(s.p.x - W.x) <= W.hw && Math.abs(s.p.y - W.y) <= W.hh) {
        const gy = groundBelow(s.p.x, s.p.y, mask.height)
        if (gy >= 0) { stormUsed = true; bolts.push({ t: t + wt.storm.delay, x: s.p.x, y: gy, def: wt.storm }); bolts.sort((a, b) => a.t - b.t) }
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
    if (r === FLYING) {
      if (hitsVehicle(s, s.p.x, s.p.y)) { explodeShell(s, s.p.x, s.p.y, t); return }
      if (beh.kind === 'splitAtApex' && !s.child && s.p.vy >= 0) { split(s, t, beh); return }
      if (++s.samples % SHOT_SAMPLE_EVERY === 0) s.path.push(t, s.p.x, s.p.y)
      return
    }
    if (r === HIT_TERRAIN) {
      if (beh.kind === 'drill') {
        let dx = s.p.vx, dy = s.p.vy
        if (beh.direction === 'horizontal') { dx = Math.sign(s.p.vx) || input.facing; dy = 0 }
        else if (beh.direction === 'down') { dx = 0; dy = 1 }
        const n = Math.hypot(dx, dy) || 1
        s.mode = 'drill'; s.dx = dx / n; s.dy = dy / n; s.remaining = beh.length; s.sinceCarve = 0
        s.path.push(t, s.p.x, s.p.y)
        return
      }
      if (beh.kind === 'roller') {
        s.mode = 'roll'; s.dx = Math.sign(s.p.vx) || input.facing; s.remaining = beh.distance
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
  } else spawn(0, fire.angle)
  if (beh.kind === 'burst') for (let k = 1; k < beh.count; k++) pending.push({ tStart: k * beh.interval, angleDeg: fire.angle + k * beh.angleStepDeg })

  let t = 0
  const maxSteps = Math.round(SHOT_MAX_TIME_S / DT_SIM)
  for (let i = 1; i <= maxSteps; i++) {
    t = i * DT_SIM
    while (pending.length && pending[0]!.tStart <= t + 1e-9) { const q = pending.shift()!; spawn(t, q.angleDeg) }
    while (bolts.length && bolts[0]!.t <= t + 1e-9) {
      const b = bolts.shift()!
      events.push({ t, kind: 'bolt', x: b.x, y: b.y })
      blast(b.x, b.y, t, b.def.blastRadius, b.def.carveRadius, b.def.damage, false)
    }
    for (let k = 0; k < shells.length; k++) {   // vòng for theo chỉ số: quả con có thể được thêm vào cuối khi đang lặp
      const s = shells[k]!
      if (!s.alive) continue
      if (s.mode === 'drill') stepDrill(s, t, beh as Extract<ShotDef['behavior'], { kind: 'drill' }>)
      else if (s.mode === 'roll') stepRoll(s, t, beh as Extract<ShotDef['behavior'], { kind: 'roller' }>)
      else stepFly(s, t)
    }
    if (!pending.length && !bolts.length && shells.every(s => !s.alive)) break
  }
  // hết giờ mô phỏng: đạn còn bay coi như ra ngoài
  for (const s of shells) if (s.alive) { s.alive = false; s.path.push(t, s.p.x, s.p.y); events.push({ t, kind: 'out', x: s.p.x, y: s.p.y }) }

  events.sort((a, b) => a.t - b.t)   // sort ổn định: giữ thứ tự sinh ra khi cùng t
  return { paths: shells.map(s => s.path), events, endT: t, terrainHashAfter: input.skipHash ? 0 : mask.hash(), maskAfter: mask }
}
