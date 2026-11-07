import type { MobileDef } from './types'

/** Rùa Thành: máu trâu, chậm, dải góc hẹp; đạn 1 một dòng nước, đạn 2 hai dòng nước xoắn rồi nhập một, SS quả nước lớn tách thành 6 quả nhỏ. */
export const RUA_THANH: MobileDef = {
  id: 'rua-thanh', name: 'Rùa Thành', role: 'Máu trâu, đắp đất dựng tường',
  hp: 1480, armor: 0.22, radius: 22, speedMul: 0.7, fuel: 80, angleMin: 35, angleMax: 75,
  shots: [
    { name: 'Dòng nước', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 38, damage: 340, delay: 288, behavior: { kind: 'basic' } },
    { name: 'Nước đôi', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 50, carveRadius: 30, damage: 205, delay: 375, behavior: { kind: 'twin', count: 2, radius: 30, convergeS: 3, turns: 2 } },
    { name: 'Sóng vỡ', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 90, carveRadius: 50, damage: 560, delay: 600, behavior: { kind: 'splitAfter', afterS: 1.5, count: 6, spreadDeg: 8, child: { blastRadius: 50, carveRadius: 28, damage: 95 } } },
  ],
}
