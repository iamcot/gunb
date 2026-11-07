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
  /** Đầu nòng (px, so với tâm xe, xe quay mặt sang phải, trục Y hướng xuống): gốc xoay nòng (px, py) và đầu nòng so với gốc đó trong hệ trục của nòng (ox dọc nòng, oy vuông góc). Đạn xuất phát từ đây; không có thì dùng MUZZLE_DIST từ tâm xe. Số lấy từ rig.json của xe (tính bằng script, xem plan/PROGRESS.md). */
  muzzle?: { px: number; py: number; ox: number; oy: number }
  /** Khiên (máu xanh): hấp thụ sát thương trước máu, hồi `regen` mỗi khi sang vòng mới (tối đa `max`). Bắt đầu đầy. */
  shield?: { max: number; regen: number }
  /** Hệ số nhân `Tuning.turn.delayPerSecond` cho xe này (Rùa Thành 1,2: nghĩ lâu bị phạt nặng hơn). Mặc định 1. */
  delayPerSecondMul?: number
  slopeAim?: boolean            // dải góc tính theo thân xe: muốn góc cao hơn phải đứng dốc (xem aimRange)
  shots: [ShotDef, ShotDef, ShotDef]   // đạn 1, đạn 2, đạn SS
}
