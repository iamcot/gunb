import { degToRad } from '../math'
import type { TerrainMask } from '../terrain/mask'
import { groundYBelow, slopeAt } from '../terrain/surface'
import type { Tuning } from '../tuning'

export interface MobileBody {
  x: number           // tâm
  y: number
  radius: number
  facing: 1 | -1
  tilt: number        // radian, dương = dốc lên về bên phải
  fuel: number        // px còn đi được trong lượt
  speedMul: number    // nhân với tuning.move.speed (khác nhau theo pháo)
  vy: number
  onGround: boolean
  alive: boolean
  fallStartBottom: number
}

export interface MoveResult {
  moved: number       // px đã đi
  damage: number      // sát thương do rơi (cộng dồn trong lần gọi)
  died: boolean       // rơi khỏi đáy bản đồ
}

/** Bước con tối đa khi mô phỏng xe (s). */
export const MOVE_DT = 1 / 120
const FALL_OUT_MARGIN = 100

export function createBody(x: number, y: number, radius: number, facing: 1 | -1, speedMul = 1): MobileBody {
  return { x, y, radius, facing, tilt: 0, fuel: 0, speedMul, vy: 0, onGround: true, alive: true, fallStartBottom: y + radius }
}

/** Mặt đất cao nhất ở 3 cột chân (x-hw, x, x+hw), quét xuống từ probeY. Infinity nếu không có đất. */
function surfaceUnder(mask: TerrainMask, x: number, probeY: number, hw: number): number {
  let best = Infinity
  for (let k = -1; k <= 1; k++) {
    const g = groundYBelow(mask, x + k * hw, probeY)
    if (g >= 0 && g < best) best = g
  }
  return best
}

function chunk(b: MobileBody, dir: -1 | 0 | 1, dt: number, mask: TerrainMask, t: Tuning, out: MoveResult): void {
  const m = t.move
  const hw = b.radius * 0.8
  let bottom = b.y + b.radius

  if (b.onGround) {
    if (dir !== 0 && b.fuel > 0) {
      b.facing = dir
      let dx = dir * m.speed * b.speedMul * dt
      if (Math.abs(dx) > b.fuel) dx = dir * b.fuel
      const nx = b.x + dx
      const ang = slopeAt(mask, nx, bottom - 2 * m.stepUp, hw)
      if (dir * ang <= degToRad(m.maxSlopeDeg)) {
        const s = surfaceUnder(mask, nx, bottom - m.stepUp, hw)
        if (s > bottom - m.stepUp) {      // s == probe nghĩa là có vách cao hơn bậc cho phép
          b.x = nx
          b.fuel -= Math.abs(dx)
          out.moved += Math.abs(dx)
        }
      }
    }
    const s = surfaceUnder(mask, b.x, bottom - m.stepUp, hw)
    if (s - bottom > m.snapDown) {        // mất đất dưới chân (kể cả s = Infinity): bắt đầu rơi
      b.onGround = false
      b.vy = 0
      b.fallStartBottom = bottom
    } else bottom = s
  } else {
    b.vy += t.gravity * dt
    const dy = b.vy * dt
    const n = Math.max(1, Math.ceil(Math.abs(dy)))
    for (let i = 0; i < n; i++) {
      bottom += dy / n
      const s = surfaceUnder(mask, b.x, bottom - 2, hw)
      if (s <= bottom) {
        bottom = s
        b.onGround = true
        b.vy = 0
        const dmg = Math.round(Math.max(0, bottom - b.fallStartBottom - m.fallSafePx) * m.fallDamagePerPx)
        out.damage += dmg
        break
      }
    }
    if (!b.onGround && bottom - b.radius > mask.height + FALL_OUT_MARGIN) {
      b.alive = false
      out.died = true
    }
  }
  b.y = bottom - b.radius
  if (b.onGround) b.tilt = slopeAt(mask, b.x, bottom - 2 * m.stepUp, hw)
}

/**
 * Cập nhật một xe trong `dt` giây: đi (dir = -1/0/1, tốn nhiên liệu, bám dốc ≤ maxSlopeDeg, dừng trước vách),
 * rơi khi mất đất (trừ máu theo độ cao), rơi khỏi đáy bản đồ thì chết. Gọi mỗi tick cho mọi xe (dir = 0 với xe đứng yên).
 * Ghi kết quả vào `out` (được reset ở đầu lời gọi).
 */
export function stepMobile(b: MobileBody, dir: -1 | 0 | 1, dt: number, mask: TerrainMask, tuning: Tuning, out: MoveResult): void {
  out.moved = 0
  out.damage = 0
  out.died = false
  if (!b.alive) return
  let rem = dt
  while (rem > 1e-9 && b.alive) {
    const h = Math.min(rem, MOVE_DT)
    chunk(b, dir, h, mask, tuning, out)
    rem -= h
  }
}
