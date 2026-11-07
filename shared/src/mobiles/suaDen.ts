import type { MobileDef } from './types'

/** Sứa Đèn: đạn 1 một tia laser, đạn 2 hai tia xoắn rồi chụm (mỗi tia sát thương riêng); SS còn xuyên đất (khiên: C1). */
export const SUA_DEN: MobileDef = {
  id: 'sua-den', name: 'Sứa Đèn', role: 'Tia laser, tia đôi xoắn chụm',
  hp: 1030, armor: 0.08, radius: 17, speedMul: 1, fuel: 100, angleMin: 20, angleMax: 85, muzzle: { px: 37, py: -22, ox: 42, oy: 0 },
  shots: [
    { name: 'Tia laser', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 35, damage: 390, delay: 275, behavior: { kind: 'basic' } },
    { name: 'Tia đôi', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 50, carveRadius: 28, damage: 200, delay: 375, behavior: { kind: 'twin', count: 2, radius: 34, convergeS: 1.6, turns: 1.5 } },
    { name: 'Đèn khổng lồ', maxSpeed: 720, windFactor: 0.8, gravityFactor: 0.8, blastRadius: 100, carveRadius: 70, damage: 800, delay: 575, behavior: { kind: 'pierce', maxThickness: 120, maxPierce: 3, holeRadius: 22 } },
  ],
}
