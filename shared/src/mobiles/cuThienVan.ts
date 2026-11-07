import type { MobileDef } from './types'

/** Cú Thiên Văn: bắn cầu sáng đánh dấu (không gây sát thương, không khoét đất), vệ tinh bắn laser vào điểm chạm (đạn 1, 2: vệ tinh trên đầu xe, tia chéo mảnh; SS: từ tận trời, quét 5 tia thẳng đứng từ trái sang phải; vệ tinh đ2 cao gấp 3 đ1, tia hơi lệch ngẫu nhiên có seed). Tia xuyên đất, trúng mọi xe nằm trên tia. */
export const CU_THIEN_VAN: MobileDef = {
  id: 'cu-thien-van', name: 'Cú Thiên Văn', role: 'Gọi vệ tinh bắn laser',
  hp: 960, armor: 0.08, radius: 16, speedMul: 1, fuel: 110, angleMin: 10, angleMax: 80, muzzle: { px: -22, py: -49, ox: 65, oy: 0 },
  shots: [
    { name: 'Đốm sáng', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 20, carveRadius: 0, damage: 0, delay: 288, behavior: { kind: 'satellite', from: 'shooter', altitude: 200, delay: 0.5, count: 1, spacing: 0, interval: 0, halfWidth: 8, depth: 30, damage: 420, jitter: 8 } },
    { name: 'Ba tia', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 18, carveRadius: 0, damage: 0, delay: 460, behavior: { kind: 'satellite', from: 'shooter', altitude: 600, delay: 0.5, count: 3, spacing: 30, interval: 0.15, halfWidth: 7, depth: 26, damage: 260, jitter: 6 } },
    { name: 'Quét sáng', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 26, carveRadius: 0, damage: 0, delay: 920, behavior: { kind: 'satellite', from: 'sky', altitude: 400, delay: 0.6, count: 5, spacing: 45, interval: 0.14, halfWidth: 14, depth: 70, damage: 230, sweep: true } },
  ],
}
