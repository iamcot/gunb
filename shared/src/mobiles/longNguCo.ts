import type { MobileDef } from './types'

/** Long Ngư Cơ (xe ẩn, chỉ có qua nút Ngẫu nhiên): đạn 1 cầu lửa, đạn 2 bốn cầu lửa tỏa, SS cầu đỏ triệu hồi 4 con rồng nhỏ xếp nửa vòng tròn rồi bò vào tâm nổ. */
export const LONG_NGU_CO: MobileDef = {
  id: 'long-ngu-co', name: 'Long Ngư Cơ', role: 'Cầu lửa, rồng con bò vào tâm',
  hp: 1250, armor: 0.1, radius: 20, speedMul: 0.95, fuel: 100, angleMin: 10, angleMax: 80, muzzle: { px: 30, py: -16, ox: 35, oy: 0 },
  shots: [
    { name: 'Cầu lửa', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 55, carveRadius: 32, damage: 400, delay: 275, behavior: { kind: 'basic' } },
    { name: 'Bốn cầu lửa', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 45, carveRadius: 26, damage: 140, delay: 440, behavior: { kind: 'spread', count: 4, spreadDeg: 6 } },
    { name: 'Rồng con', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 30, carveRadius: 0, damage: 0, delay: 880, behavior: { kind: 'converge', count: 4, radius: 90, delay: 0.7, interval: 0.12, damage: 250, blastRadius: 55, carveRadius: 30 } },
  ],
}
