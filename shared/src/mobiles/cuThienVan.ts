import type { MobileDef } from './types'

/** Cú Thiên Văn: bắn cầu sáng đánh dấu (không gây sát thương, không khoét đất), vệ tinh bắn laser vào điểm chạm (đạn 1, 2: vệ tinh trên đầu xe, tia chéo mảnh; SS: từ tận trời, tia thẳng đứng to). Tia xuyên đất, trúng mọi xe nằm trên tia. */
export const CU_THIEN_VAN: MobileDef = {
  id: 'cu-thien-van', name: 'Cú Thiên Văn', role: 'Gọi vệ tinh bắn laser',
  hp: 96, armor: 0.08, radius: 16, speedMul: 1, fuel: 110, angleMin: 10, angleMax: 80,
  shots: [
    { name: 'Đốm sáng', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 20, carveRadius: 0, damage: 0, delay: 115, behavior: { kind: 'satellite', from: 'shooter', altitude: 170, delay: 0.5, count: 1, spacing: 0, interval: 0, halfWidth: 8, depth: 30, damage: 42 } },
    { name: 'Ba tia', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 18, carveRadius: 0, damage: 0, delay: 160, behavior: { kind: 'satellite', from: 'shooter', altitude: 170, delay: 0.5, count: 3, spacing: 30, interval: 0.15, halfWidth: 7, depth: 26, damage: 26 } },
    { name: 'Cột sáng', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 26, carveRadius: 0, damage: 0, delay: 230, behavior: { kind: 'satellite', from: 'sky', altitude: 170, delay: 0.6, count: 1, spacing: 0, interval: 0, halfWidth: 26, depth: 110, damage: 90 } },
  ],
}
