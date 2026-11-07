import type { MobileDef } from './types'

/** Bọ Lôi: xe sét. Cầu điện chạm đâu thì tia sét giáng thẳng từ trời xuống đó (đất che phía trên thì sét đánh vào đất, không trúng xe) rồi còn dư chấn.
 *  Đạn 2: hai tia chéo từ hai bên. SS: mũi tên điện nổ vòng lớn, mọi xe trong vùng đều bị sét đánh. */
export const BO_LOI: MobileDef = {
  id: 'bo-loi', name: 'Bọ Lôi', role: 'Sét giáng từ trời, dư chấn',
  hp: 950, armor: 0.1, radius: 16, speedMul: 1, fuel: 110, angleMin: 10, angleMax: 85, muzzle: { px: -35, py: -18, ox: 53, oy: -43 },
  shots: [
    { name: 'Sét giáng', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 30, carveRadius: 0, damage: 0, delay: 275,
      behavior: { kind: 'lightning', delay: 0.35, damage: 340, blastRadius: 80, carveRadius: 40, aftershock: { delay: 0.7, damage: 80 } } },
    { name: 'Sét chéo', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 30, carveRadius: 0, damage: 0, delay: 330,
      behavior: { kind: 'lightning', delay: 0.35, damage: 170, blastRadius: 80, carveRadius: 40, angles: [-40, 40], aftershock: { delay: 0.7, damage: 80 } } },
    { name: 'Sét vùng', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 140, carveRadius: 50, damage: 100, delay: 880,
      behavior: { kind: 'lightning', delay: 0.4, damage: 0, blastRadius: 0, carveRadius: 0, angles: [], area: { radius: 500, damage: 420, blastRadius: 60, carveRadius: 30, stagger: 0.2 } } },
  ],
}
