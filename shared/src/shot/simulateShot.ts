import { ANGLE_MAX, ANGLE_MIN, DT_SIM, MUZZLE_DIST, SHOT_MAX_TIME_S, SHOT_SAMPLE_EVERY } from '../constants'
import { aimDir } from '../aim'
import { clamp, type Vec2 } from '../math'
import { FLYING, HIT_TERRAIN, stepProjectile, type ProjectileState } from '../physics/projectile'
import { TUNING, type Tuning } from '../tuning'
import type { FireCmd, ShotEvent, ShotInput, ShotResult, ShotVehicle } from './types'

const dir: Vec2 = { x: 0, y: 0 }
const proj: ProjectileState = { x: 0, y: 0, vx: 0, vy: 0, t: 0, alive: true }

/** Kẹp lệnh bắn về giá trị hợp lệ (server dùng trước khi mô phỏng). */
export function sanitizeFire(f: FireCmd): FireCmd {
  return { angle: Math.round(clamp(f.angle, ANGLE_MIN, ANGLE_MAX)), power: clamp(f.power, 0, 100), shotType: f.shotType }
}

/**
 * Mô phỏng trọn một phát bắn, thuần và xác định: cùng input ⇒ cùng kết quả.
 * Hiện có kiểu đạn `basic` (1 đạn, nổ khi chạm đất hoặc chạm xe).
 */
export function simulateShot(input: ShotInput, tuning: Tuning = TUNING): ShotResult {
  const fire = sanitizeFire(input.fire)
  const sh = tuning.shots[fire.shotType]
  const mask = input.mask.clone()
  const shooter = input.vehicles.find(v => v.id === input.shooterId)
  if (!shooter) throw new Error('không thấy xe bắn')
  const hp = new Map<number, number>(input.vehicles.map(v => [v.id, v.hp]))

  aimDir(dir, fire.angle, input.facing, input.tilt)
  const speed = (fire.power / 100) * sh.maxSpeed
  proj.x = shooter.x + dir.x * MUZZLE_DIST
  proj.y = shooter.y + dir.y * MUZZLE_DIST
  proj.vx = dir.x * speed
  proj.vy = dir.y * speed
  proj.t = 0
  proj.alive = true
  const ax = input.wind.x * tuning.windScale * sh.windFactor
  const ay = tuning.gravity * sh.gravityFactor + input.wind.y * tuning.windScale * sh.windFactor

  const path: number[] = [0, proj.x, proj.y]
  const events: ShotEvent[] = []
  let exploded = false

  const explode = (x: number, y: number, t: number): void => {
    exploded = true
    events.push({ t, kind: 'explode', x, y, r: sh.blastRadius })
    mask.carveCircle(x, y, sh.carveRadius)
    events.push({ t, kind: 'carve', x, y, r: sh.carveRadius })
    for (const v of input.vehicles) {
      const cur = hp.get(v.id) ?? 0
      if (cur <= 0) continue
      const d = Math.max(0, Math.hypot(v.x - x, v.y - y) - v.radius)
      if (d >= sh.blastRadius) continue
      const amount = Math.round(sh.damage * (1 - d / sh.blastRadius) * (1 - v.armor))
      if (amount <= 0) continue
      const after = Math.max(0, cur - amount)
      hp.set(v.id, after)
      events.push({ t, kind: 'damage', id: v.id, amount, hpAfter: after })
    }
  }

  const hitsVehicle = (): ShotVehicle | undefined => {
    for (const v of input.vehicles) {
      if (v.id === input.shooterId && proj.t < 0.3) continue   // chưa ra khỏi nòng
      if ((hp.get(v.id) ?? 0) > 0 && Math.hypot(v.x - proj.x, v.y - proj.y) <= v.radius) return v
    }
    return undefined
  }

  if (mask.isSolid(proj.x, proj.y)) {
    explode(proj.x, proj.y, 0)
  } else {
    const maxSteps = Math.round(SHOT_MAX_TIME_S / DT_SIM)
    for (let i = 1; i <= maxSteps; i++) {
      const r = stepProjectile(proj, ax, ay, DT_SIM, mask)
      if (r === FLYING) {
        if (hitsVehicle()) { path.push(proj.t, proj.x, proj.y); explode(proj.x, proj.y, proj.t); break }
        if (i % SHOT_SAMPLE_EVERY === 0) path.push(proj.t, proj.x, proj.y)
        continue
      }
      path.push(proj.t, proj.x, proj.y)
      if (r === HIT_TERRAIN) explode(proj.x, proj.y, proj.t)
      else events.push({ t: proj.t, kind: 'out', x: proj.x, y: proj.y })
      break
    }
    if (!exploded && !events.some(e => e.kind === 'out')) events.push({ t: proj.t, kind: 'out', x: proj.x, y: proj.y })   // hết giờ mô phỏng
  }

  return { paths: [path], events, endT: proj.t, terrainHashAfter: mask.hash(), maskAfter: mask }
}
