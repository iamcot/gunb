import type { MobileDef } from './types'

/** Sứa Đèn: đạn 1 một tia laser, đạn 2 hai tia xoắn rồi chụm (mỗi tia sát thương riêng); có khiên hồi mỗi vòng; SS quả cầu sáng nổ rộng xoá khiên mọi xe trong vùng. */
export const SUA_DEN: MobileDef = {
  id: 'sua-den', name: 'Sứa Đèn', role: 'Tia laser, tia đôi xoắn chụm',
  hp: 1030, armor: 0.08, radius: 17, speedMul: 1, fuel: 100, angleMin: 20, angleMax: 85, shield: { max: 150, regen: 50 }, muzzle: { px: 37, py: -22, ox: 42, oy: 0 },
  shots: [
    { name: 'Tia laser', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 35, damage: 390, delay: 275, behavior: { kind: 'basic' } },
    { name: 'Tia đôi', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 50, carveRadius: 28, damage: 234, delay: 440, behavior: { kind: 'twin', count: 2, radius: 34, convergeS: 2.2, turns: 2.5 } },
    { name: 'Đèn khổng lồ', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 140, carveRadius: 70, damage: 700, delay: 880, behavior: { kind: 'basic' }, shieldBreak: true },
  ],
}
