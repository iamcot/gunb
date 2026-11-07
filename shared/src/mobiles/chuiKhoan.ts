import type { MobileDef } from './types'

/** Chũi Khoan: đạn 1 nổ thường; đạn 2 lặn xuống đất rồi trồi lên mặt đất mới nổ; đạn SS xuyên mọi địa hình, chỉ nổ khi chạm xe. */
export const CHUI_KHOAN: MobileDef = {
  id: 'chui-khoan', name: 'Chũi Khoan', role: 'Phá địa hình, đục hầm',
  hp: 1100, armor: 0.05, radius: 17, speedMul: 1.1, fuel: 140, angleMin: 10, angleMax: 80, muzzle: { px: 24, py: -18, ox: 69, oy: 6 },
  shots: [
    { name: 'Đạn nổ', maxSpeed: 760, windFactor: 0.8, gravityFactor: 1, blastRadius: 60, carveRadius: 45, damage: 460, delay: 275, behavior: { kind: 'basic' } },
    { name: 'Lặn trồi', maxSpeed: 760, windFactor: 0.8, gravityFactor: 1, blastRadius: 60, carveRadius: 40, damage: 420, delay: 440,
      behavior: { kind: 'drill', length: 0, tunnelRadius: 14, direction: 'velocity', speed: 450, resurface: { diveLength: 90, turnRadius: 55, riseDeg: 55, riseMax: 320 } } },
    { name: 'Chũi xuyên đất', maxSpeed: 760, windFactor: 0.8, gravityFactor: 1, blastRadius: 70, carveRadius: 45, damage: 520, delay: 880, behavior: { kind: 'ghost' } },
  ],
}
