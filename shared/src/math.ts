export interface Vec2 { x: number; y: number }

export const vec2 = (x = 0, y = 0): Vec2 => ({ x, y })

export function setVec2(out: Vec2, x: number, y: number): Vec2 {
  out.x = x
  out.y = y
  return out
}

export function addVec2(out: Vec2, a: Vec2, b: Vec2): Vec2 {
  out.x = a.x + b.x
  out.y = a.y + b.y
  return out
}

export function scaleVec2(out: Vec2, a: Vec2, k: number): Vec2 {
  out.x = a.x * k
  out.y = a.y * k
  return out
}

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const degToRad = (d: number): number => (d * Math.PI) / 180
export const radToDeg = (r: number): number => (r * 180) / Math.PI

/** RNG có seed (mulberry32). Trả về hàm cho số trong [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Băm chuỗi thành seed 32-bit (FNV-1a). */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
