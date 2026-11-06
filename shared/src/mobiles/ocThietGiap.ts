import type { MobileDef } from './types'

/** Ốc Thiết Giáp: cân bằng, dễ chơi. */
export const OC_THIET_GIAP: MobileDef = {
  id: 'oc-thiet-giap', name: 'Ốc Thiết Giáp', role: 'Cân bằng, dễ chơi',
  hp: 110, armor: 0.15, radius: 18, speedMul: 1, fuel: 120, angleMin: 0, angleMax: 90,
  shots: [
    { name: 'Đạn nổ', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 70, carveRadius: 45, damage: 40, delay: 100, behavior: { kind: 'basic' } },
    { name: 'Đạn đôi', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 38, damage: 30, delay: 160, behavior: { kind: 'burst', count: 2, interval: 0.3, angleStepDeg: 0 } },
    { name: 'Đạn khổng lồ', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 120, carveRadius: 90, damage: 90, delay: 220, behavior: { kind: 'basic' } },
  ],
}
