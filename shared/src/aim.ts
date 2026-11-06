import { clamp, degToRad, radToDeg, type Vec2 } from './math'
import type { MobileDef } from './mobiles/types'

/**
 * Hướng bắn (vector đơn vị, Y hướng xuống). `angle` là độ nâng (0 = ngang),
 * `facing` = 1 (phải) hoặc -1 (trái), `tilt` (radian) cộng thêm vào độ nâng nếu cần đổi hệ (vd. so với thân xe nghiêng).
 * Góc bắn trong game là độ nâng so với phương ngang của bản đồ, không cộng độ dốc.
 * Đây là nơi duy nhất đổi độ sang radian.
 */
export function aimDir(out: Vec2, angle: number, facing: 1 | -1, tilt = 0): Vec2 {
  const elev = degToRad(angle) + facing * tilt
  out.x = facing * Math.cos(elev)
  out.y = -Math.sin(elev)
  return out
}

/** Dải góc bắn hợp lệ (độ, so với phương ngang). Xe `slopeAim` có dải đi theo thân: đứng dốc chĩa lên thì góc tối đa cao hơn. */
export interface AimRange { min: number; max: number }
export function aimRange(out: AimRange, def: Pick<MobileDef, 'angleMin' | 'angleMax' | 'slopeAim'>, facing: 1 | -1, tilt: number): AimRange {
  const shift = def.slopeAim ? Math.round(radToDeg(facing * tilt)) : 0
  out.min = clamp(def.angleMin + shift, 0, 90)
  out.max = clamp(def.angleMax + shift, 0, 90)
  if (out.min > out.max) out.min = out.max
  return out
}
