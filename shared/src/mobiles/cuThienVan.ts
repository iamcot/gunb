import type { MobileDef } from './types'

/** Cú Thiên Văn: bắn cầu sáng đánh dấu, vệ tinh trên trời bắn laser thẳng xuống điểm chạm. Tia hẹp nhưng xuyên đất, trúng mọi xe trong cột. */
export const CU_THIEN_VAN: MobileDef = {
  id: 'cu-thien-van', name: 'Cú Thiên Văn', role: 'Gọi vệ tinh bắn laser',
  hp: 96, armor: 0.08, radius: 16, speedMul: 1, fuel: 110, angleMin: 10, angleMax: 80,
  shots: [
    { name: 'Đốm sáng', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 40, carveRadius: 20, damage: 12, delay: 115, behavior: { kind: 'satellite', delay: 0.5, count: 1, spacing: 0, interval: 0, halfWidth: 12, depth: 30, damage: 30 } },
    { name: 'Ba tia', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 35, carveRadius: 16, damage: 8, delay: 160, behavior: { kind: 'satellite', delay: 0.5, count: 3, spacing: 30, interval: 0.15, halfWidth: 11, depth: 26, damage: 20 } },
    { name: 'Cột sáng', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 50, carveRadius: 25, damage: 15, delay: 230, behavior: { kind: 'satellite', delay: 0.6, count: 1, spacing: 0, interval: 0, halfWidth: 26, depth: 110, damage: 75 } },
  ],
}
