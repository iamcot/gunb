import type { MobileDef } from './types'

/** Nhím Chùm: bắn một chùm gai tỏa quạt, phủ rộng nhưng mỗi quả yếu. */
export const NHIM_CHUM: MobileDef = {
  id: 'nhim-chum', name: 'Nhím Chùm', role: 'Chùm gai tỏa 5 hướng',
  hp: 100, armor: 0.1, radius: 17, speedMul: 1, fuel: 110, angleMin: 10, angleMax: 85,
  shots: [
    { name: 'Chùm gai', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 45, carveRadius: 25, damage: 21, delay: 130, behavior: { kind: 'spread', count: 5, spreadDeg: 7 } },
    { name: 'Gai ba', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 55, carveRadius: 32, damage: 28, delay: 150, behavior: { kind: 'spread', count: 3, spreadDeg: 12 } },
    { name: 'Mưa gai', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 38, damage: 40, delay: 240, behavior: { kind: 'spread', count: 7, spreadDeg: 6 } },
  ],
}
