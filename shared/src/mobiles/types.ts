import type { ShotDef } from '../shots'

export interface MobileDef {
  id: string
  name: string
  role: string                  // mô tả ngắn cho màn chọn pháo
  hp: number
  armor: number                 // 0..1, tỉ lệ sát thương được giảm
  radius: number
  speedMul: number              // nhân với tuning.move.speed
  fuel: number                  // px đi được mỗi lượt
  angleMin: number
  angleMax: number
  slopeAim?: boolean            // dải góc tính theo thân xe: muốn góc cao hơn phải đứng dốc (xem aimRange)
  shots: [ShotDef, ShotDef, ShotDef]   // đạn 1, đạn 2, đạn SS
}
