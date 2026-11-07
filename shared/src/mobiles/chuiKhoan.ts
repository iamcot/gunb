import type { MobileDef } from './types'

/** Chũi Khoan: phá địa hình bằng đạn khoan. */
export const CHUI_KHOAN: MobileDef = {
  id: 'chui-khoan', name: 'Chũi Khoan', role: 'Phá địa hình, đục hầm',
  hp: 1100, armor: 0.05, radius: 17, speedMul: 1.1, fuel: 140, angleMin: 10, angleMax: 80, muzzle: { px: 24, py: -18, ox: 69, oy: 6 },
  shots: [
    { name: 'Mũi khoan', maxSpeed: 760, windFactor: 0.8, gravityFactor: 1, blastRadius: 60, carveRadius: 35, damage: 460, delay: 275, behavior: { kind: 'drill', length: 90, tunnelRadius: 12, direction: 'velocity', speed: 450 } },
    { name: 'Đào rãnh', maxSpeed: 760, windFactor: 0.8, gravityFactor: 1, blastRadius: 50, carveRadius: 25, damage: 320, delay: 350, behavior: { kind: 'drill', length: 160, tunnelRadius: 16, direction: 'horizontal', speed: 450 } },
    { name: 'Khoan thẳng xuống', maxSpeed: 760, windFactor: 0.8, gravityFactor: 1, blastRadius: 100, carveRadius: 70, damage: 800, delay: 575, behavior: { kind: 'drill', length: 220, tunnelRadius: 28, direction: 'down', speed: 450 } },
  ],
}
