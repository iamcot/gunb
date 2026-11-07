import type { MobileDef } from './types'

/** Ốc Thiết Giáp: cân bằng, dễ chơi. Đạn SS bay đủ lâu (afterS) thì phình to, nổ rộng và đau hơn hẳn. */
export const OC_THIET_GIAP: MobileDef = {
  id: 'oc-thiet-giap', name: 'Ốc Thiết Giáp', role: 'Cân bằng, dễ chơi',
  hp: 1050, armor: 0.15, radius: 18, speedMul: 1, fuel: 120, angleMin: 0, angleMax: 90, muzzle: { px: -27, py: -33, ox: 43, oy: 0 },
  shots: [
    { name: 'Đạn nổ', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 70, carveRadius: 45, damage: 370, delay: 250, behavior: { kind: 'basic' } },
    { name: 'Đạn đôi', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 38, damage: 300, delay: 400, behavior: { kind: 'burst', count: 2, interval: 0.3, angleStepDeg: 0 } },
    { name: 'Đạn khổng lồ', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 70, carveRadius: 45, damage: 370, delay: 550, behavior: { kind: 'airGrow', afterS: 1.8, blastMul: 1.7, carveMul: 2, damageMul: 2.43 } },
  ],
}
