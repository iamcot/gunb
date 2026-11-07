import type { MobileDef } from './types'

/** Nhím Chùm: bắn một chùm gai tỏa quạt, phủ rộng nhưng mỗi quả yếu. */
export const NHIM_CHUM: MobileDef = {
  id: 'nhim-chum', name: 'Nhím Chùm', role: 'Chùm gai tỏa 5 hướng',
  hp: 1000, armor: 0.1, radius: 17, speedMul: 1, fuel: 110, angleMin: 10, angleMax: 85, muzzle: { px: 11, py: -64, ox: 54, oy: 0 },
  shots: [
    { name: 'Chùm gai', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 45, carveRadius: 42, damage: 260, delay: 325, behavior: { kind: 'spread', count: 4, spreadDeg: 8 } },
    { name: 'Gai sáu', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 55, carveRadius: 46, damage: 140, delay: 375, behavior: { kind: 'spread', count: 6, spreadDeg: 10 } },
    { name: 'Mưa gai', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 52, damage: 310, delay: 600, behavior: { kind: 'spread', count: 9, spreadDeg: 6 } },
  ],
}
