import type { MobileDef } from './types'

/** Diều Hâu Giấy: boomerang nhẹ đi ngược gió (windFactor âm), đường bay cong và quay về phía người bắn (`curve`): bắn góc cao/lực mạnh thì quay lại, bắn thấp thì bay thẳng ra xa; đạn 2 là 4 boomerang. SS bay đủ lâu thì hoá vàng, sát thương gấp hơn 2 lần; chưa đủ giờ chỉ bằng đạn 1. */
export const DIEU_HAU_GIAY: MobileDef = {
  id: 'dieu-hau-giay', name: 'Diều Hâu Giấy', role: 'Đạn đi ngược gió',
  hp: 1000, armor: 0.1, radius: 16, speedMul: 1, fuel: 120, angleMin: 15, angleMax: 85, muzzle: { px: 36, py: -15, ox: 37, oy: 0 },
  shots: [
    { name: 'Phi tiêu giấy', maxSpeed: 780, windFactor: -1.3, gravityFactor: 0.85, blastRadius: 60, carveRadius: 35, damage: 380, delay: 262, behavior: { kind: 'basic' }, curve: { returnAccel: 220, rampS: 1.5 } },
    { name: 'Bốn phi tiêu', maxSpeed: 780, windFactor: -1.3, gravityFactor: 0.85, blastRadius: 45, carveRadius: 26, damage: 110, delay: 420, behavior: { kind: 'spread', count: 4, spreadDeg: 5 }, curve: { returnAccel: 220, rampS: 1.5 } },
    { name: 'Đại bàng', maxSpeed: 780, windFactor: -2, gravityFactor: 0.85, blastRadius: 60, carveRadius: 35, damage: 380, delay: 840, behavior: { kind: 'airGrow', afterS: 2.4, blastMul: 1.9, carveMul: 2.4, damageMul: 2.4 }, curve: { returnAccel: 200, rampS: 1.5 } },
  ],
}
