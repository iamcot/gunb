import type { TerrainMask } from './mask'

/** Y của ô đất đầu tiên có y >= yFrom tại cột x (quét xuống). Trả -1 nếu không có đất bên dưới. */
export function groundYBelow(mask: TerrainMask, x: number, yFrom: number): number {
  const ix = Math.floor(x)
  if (ix < 0 || ix >= mask.width) return -1
  for (let y = Math.max(0, Math.floor(yFrom)); y < mask.height; y++) {
    if (mask.data[y * mask.width + ix] === 1) return y
  }
  return -1
}

/**
 * Góc dốc (radian) quanh cột x: lấy mặt đất ở x-halfWidth và x+halfWidth (quét từ yFrom xuống).
 * Dương = dốc đi lên về bên phải (Y hướng xuống nên bên phải cao hơn = y nhỏ hơn). Thiếu đất ở một bên thì trả 0.
 */
export function slopeAt(mask: TerrainMask, x: number, yFrom: number, halfWidth: number): number {
  const yl = groundYBelow(mask, x - halfWidth, yFrom)
  const yr = groundYBelow(mask, x + halfWidth, yFrom)
  if (yl < 0 || yr < 0) return 0
  return Math.atan2(yl - yr, 2 * halfWidth)
}
