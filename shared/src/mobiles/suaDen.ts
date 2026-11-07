import type { MobileDef } from './types'

/** Sứa Đèn: đạn bay chậm, xuyên được lớp đất mỏng (đánh kẻ nấp sau vách mỏng). */
export const SUA_DEN: MobileDef = {
  id: 'sua-den', name: 'Sứa Đèn', role: 'Đạn chậm, xuyên đất mỏng',
  hp: 1030, armor: 0.08, radius: 17, speedMul: 1, fuel: 100, angleMin: 20, angleMax: 85, muzzle: { px: 37, py: -22, ox: 42, oy: 0 },
  shots: [
    { name: 'Bóng đèn', maxSpeed: 720, windFactor: 0.8, gravityFactor: 0.8, blastRadius: 60, carveRadius: 35, damage: 390, delay: 275, behavior: { kind: 'pierce', maxThickness: 40, maxPierce: 2, holeRadius: 14 } },
    { name: 'Chùm đèn', maxSpeed: 720, windFactor: 0.8, gravityFactor: 0.8, blastRadius: 55, carveRadius: 30, damage: 320, delay: 375, behavior: { kind: 'pierce', maxThickness: 70, maxPierce: 2, holeRadius: 16 } },
    { name: 'Đèn khổng lồ', maxSpeed: 720, windFactor: 0.8, gravityFactor: 0.8, blastRadius: 100, carveRadius: 70, damage: 800, delay: 575, behavior: { kind: 'pierce', maxThickness: 120, maxPierce: 3, holeRadius: 22 } },
  ],
}
