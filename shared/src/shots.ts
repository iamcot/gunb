export type ShotType = 'basic'

export interface ShotDef {
  maxSpeed: number        // px/s khi lực = 100
  windFactor: number      // hệ số ảnh hưởng gió (có thể âm)
  gravityFactor: number
  blastRadius: number     // bán kính gây sát thương (px)
  carveRadius: number     // bán kính khoét hố (px)
  damage: number          // sát thương tối đa (khi nổ sát tâm xe)
  delay: number           // delay cộng sau khi bắn (dùng từ Phase 2)
}
