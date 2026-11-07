import type { MobileDef } from './types'

/** Diều Hâu Giấy: đạn nhẹ đi ngược gió (windFactor âm): gió ngược chiều bắn càng mạnh thì đạn càng bay xa. SS bay đủ lâu thì hoá vàng, sát thương gấp hơn 2 lần; chưa đủ giờ chỉ bằng đạn 1. */
export const DIEU_HAU_GIAY: MobileDef = {
  id: 'dieu-hau-giay', name: 'Diều Hâu Giấy', role: 'Đạn đi ngược gió',
  hp: 1000, armor: 0.1, radius: 16, speedMul: 1, fuel: 120, angleMin: 15, angleMax: 85,
  shots: [
    { name: 'Phi tiêu giấy', maxSpeed: 780, windFactor: -1.3, gravityFactor: 0.85, blastRadius: 60, carveRadius: 35, damage: 380, delay: 262, behavior: { kind: 'basic' } },
    { name: 'Phi tiêu đôi', maxSpeed: 780, windFactor: -1.3, gravityFactor: 0.85, blastRadius: 50, carveRadius: 30, damage: 280, delay: 412, behavior: { kind: 'burst', count: 2, interval: 0.25, angleStepDeg: 0 } },
    { name: 'Đại bàng', maxSpeed: 780, windFactor: -2, gravityFactor: 0.85, blastRadius: 60, carveRadius: 35, damage: 380, delay: 562, behavior: { kind: 'airGrow', afterS: 2.4, blastMul: 1.9, carveMul: 2.4, damageMul: 2.4 } },
  ],
}
