import type { MobileDef } from './types'

/** Kỳ Lân Sắt (xe ẩn, chỉ có qua nút Ngẫu nhiên): đạn đánh dấu rồi kiếm từ trời cắm xuống điểm chạm. Đ1 nhiều kiếm nhỏ kém chính xác, đ2 từ trên cao 5 kiếm chính xác hơn, SS quét 7 kiếm từ trái sang phải. */
export const KY_LAN_SAT: MobileDef = {
  id: 'ky-lan-sat', name: 'Kỳ Lân Sắt', role: 'Mưa kiếm từ trời',
  hp: 1050, armor: 0.12, radius: 18, speedMul: 1, fuel: 105, angleMin: 10, angleMax: 80, muzzle: { px: 32, py: -40, ox: 53, oy: 0 },
  shots: [
    { name: 'Kiếm lớn', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 20, carveRadius: 0, damage: 0, delay: 275, behavior: { kind: 'satellite', from: 'sky', altitude: 400, delay: 0.5, count: 4, spacing: 18, interval: 0.1, halfWidth: 6, depth: 28, damage: 130, jitter: 45 } },
    { name: 'Năm kiếm', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 20, carveRadius: 0, damage: 0, delay: 440, behavior: { kind: 'satellite', from: 'shooter', altitude: 800, delay: 0.5, count: 5, spacing: 22, interval: 0.1, halfWidth: 6, depth: 26, damage: 110, jitter: 12 } },
    { name: 'Kiếm quét', maxSpeed: 780, windFactor: 0.9, gravityFactor: 1, blastRadius: 26, carveRadius: 0, damage: 0, delay: 880, behavior: { kind: 'satellite', from: 'sky', altitude: 400, delay: 0.6, count: 7, spacing: 34, interval: 0.1, halfWidth: 10, depth: 60, damage: 150, sweep: true } },
  ],
}
