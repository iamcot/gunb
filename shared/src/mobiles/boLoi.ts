import type { MobileDef } from './types'

/** Bọ Lôi: đạn điện, bào giáp. Cốc bắn ở đuôi chỉ nâng tới 45° so với thân; muốn cao hơn phải quay đuôi lên dốc. */
export const BO_LOI: MobileDef = {
  id: 'bo-loi', name: 'Bọ Lôi', role: 'Bào giáp, đạn điện',
  hp: 95, armor: 0.1, radius: 16, speedMul: 1, fuel: 110, angleMin: 20, angleMax: 45, slopeAim: true,
  shots: [
    { name: 'Điện giật', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 35, damage: 35, delay: 110, behavior: { kind: 'basic' }, armorBreak: { turns: 2, amount: 0.25 } },
    { name: 'Chùm ba', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 50, carveRadius: 30, damage: 26, delay: 170, behavior: { kind: 'splitAtApex', count: 3, spreadDeg: 8 } },
    { name: 'Sét giáng', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 35, damage: 30, delay: 230, behavior: { kind: 'lightning', delay: 0.35, damage: 70, blastRadius: 90, carveRadius: 40 } },
  ],
}
