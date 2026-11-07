import type { MobileDef } from './types'

/** Cua Lăn: đạn chạm đất thì lăn theo địa hình, hợp đánh mục tiêu sau gò/trong hố. */
export const CUA_LAN: MobileDef = {
  id: 'cua-lan', name: 'Cua Lăn', role: 'Đạn lăn theo địa hình',
  hp: 1050, armor: 0.1, radius: 18, speedMul: 0.95, fuel: 110, angleMin: 0, angleMax: 65,
  shots: [
    { name: 'Bi lăn', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 55, carveRadius: 30, damage: 380, delay: 300, behavior: { kind: 'roller', distance: 260, speed: 220 } },
    { name: 'Bi lăn xa', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 50, carveRadius: 28, damage: 300, delay: 412, behavior: { kind: 'roller', distance: 460, speed: 320 } },
    { name: 'Cầu đá', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 110, carveRadius: 80, damage: 850, delay: 575, behavior: { kind: 'roller', distance: 520, speed: 260 } },
  ],
}
