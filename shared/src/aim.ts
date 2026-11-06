import { degToRad, type Vec2 } from './math'

/**
 * Hướng bắn (vector đơn vị, Y hướng xuống). `angle` là độ nâng so với thân xe (0 = ngang),
 * `facing` = 1 (phải) hoặc -1 (trái), `tilt` là góc dốc thân xe (radian, dương = dốc lên về bên phải).
 * Đây là nơi duy nhất đổi độ sang radian.
 */
export function aimDir(out: Vec2, angle: number, facing: 1 | -1, tilt = 0): Vec2 {
  const elev = degToRad(angle) + facing * tilt
  out.x = facing * Math.cos(elev)
  out.y = -Math.sin(elev)
  return out
}
