import type { MobileDef } from './types'

/** Rùa Thành: máu trâu, chậm, dải góc hẹp; đạn đắp đất dựng tường chắn hoặc lấp hố. */
export const RUA_THANH: MobileDef = {
  id: 'rua-thanh', name: 'Rùa Thành', role: 'Máu trâu, đắp đất dựng tường',
  hp: 148, armor: 0.22, radius: 22, speedMul: 0.7, fuel: 80, angleMin: 35, angleMax: 75,
  shots: [
    { name: 'Đạn đá', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 38, damage: 34, delay: 115, behavior: { kind: 'basic' } },
    { name: 'Tường đất', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 45, carveRadius: 0, damage: 8, delay: 150, behavior: { kind: 'build', radius: 28, count: 3 } },
    { name: 'Núi đá', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 0, damage: 25, delay: 240, behavior: { kind: 'build', radius: 45, count: 4 } },
  ],
}
