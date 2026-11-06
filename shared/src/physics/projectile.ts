import type { TerrainMask } from '../terrain/mask'

export interface ProjectileState { x: number; y: number; vx: number; vy: number; t: number; alive: boolean }

export const FLYING = 0
export const HIT_TERRAIN = 1
export const OUT_OF_MAP = 2
export type StepResult = typeof FLYING | typeof HIT_TERRAIN | typeof OUT_OF_MAP

/**
 * Một bước Euler bán ẩn: v += a*dt, p += v*dt. Kiểm tra va chạm dọc đoạn cũ→mới với bước ≤ 1 px
 * nên đạn nhanh không xuyên lớp đất mỏng. Chạm đất: đặt (x, y) tại điểm chạm, alive = false.
 * Ra khỏi biên trái/phải/đáy: OUT_OF_MAP (không nổ). Bay quá cao vẫn tiếp tục.
 */
export function stepProjectile(p: ProjectileState, ax: number, ay: number, dt: number, mask: TerrainMask): StepResult {
  const ox = p.x, oy = p.y
  p.vx += ax * dt
  p.vy += ay * dt
  const nx = ox + p.vx * dt
  const ny = oy + p.vy * dt
  const dx = nx - ox, dy = ny - oy
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dy)))
  for (let i = 1; i <= n; i++) {
    const sx = ox + (dx * i) / n
    const sy = oy + (dy * i) / n
    if (mask.isSolid(sx, sy)) {
      p.x = sx; p.y = sy; p.t += dt; p.alive = false
      return HIT_TERRAIN
    }
  }
  p.x = nx; p.y = ny; p.t += dt
  if (nx < 0 || nx >= mask.width || ny >= mask.height) { p.alive = false; return OUT_OF_MAP }
  return FLYING
}
