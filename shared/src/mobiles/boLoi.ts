import type { MobileDef } from './types'

/** Bọ Lôi: đạn điện, bào giáp. Cốc bắn ở đuôi chỉ nâng tới 45° so với thân; muốn cao hơn phải quay đuôi lên dốc. */
export const BO_LOI: MobileDef = {
  id: 'bo-loi', name: 'Bọ Lôi', role: 'Bào giáp, đạn điện',
  hp: 950, armor: 0.1, radius: 16, speedMul: 1, fuel: 110, angleMin: 20, angleMax: 45, slopeAim: true,
  shots: [
    { name: 'Điện giật', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 35, damage: 350, delay: 275, behavior: { kind: 'basic' }, armorBreak: { turns: 2, amount: 0.25 } },
    { name: 'Chùm ba', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 50, carveRadius: 30, damage: 260, delay: 425, behavior: { kind: 'splitAtApex', count: 3, spreadDeg: 8 } },
    { name: 'Sét giáng', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 35, damage: 300, delay: 575, behavior: { kind: 'lightning', delay: 0.35, damage: 700, blastRadius: 90, carveRadius: 40 } },
  ],
}
