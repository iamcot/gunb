import type { TerrainMask } from '../terrain/mask'
import type { ShotSlot } from '../shots'
import type { Wind } from '../wind'

export interface ShotVehicle {
  id: number
  mobileId: string
  x: number           // tâm
  y: number
  radius: number
  hp: number
  armor: number       // tỉ lệ sát thương được giảm (đã tính giảm giáp; âm = nhận thêm sát thương)
}

export interface FireCmd {
  angle: number       // độ nguyên, trong dải góc của pháo
  power: number       // 0..100
  slot: ShotSlot      // 0 = đạn 1, 1 = đạn 2, 2 = SS
}

export interface ShotInput {
  mask: TerrainMask   // không bị sửa; simulateShot làm việc trên bản sao
  vehicles: ShotVehicle[]
  wind: Wind
  shooterId: number
  facing: 1 | -1
  tilt: number        // radian
  fire: FireCmd
}

export type ShotEvent =
  | { t: number; kind: 'explode'; x: number; y: number; r: number }
  | { t: number; kind: 'carve'; x: number; y: number; r: number }
  | { t: number; kind: 'damage'; id: number; amount: number; hpAfter: number }
  | { t: number; kind: 'out'; x: number; y: number }
  | { t: number; kind: 'split'; x: number; y: number }     // đạn tách ở đỉnh quỹ đạo (hiệu ứng)
  | { t: number; kind: 'bolt'; x: number; y: number }      // tia sét giáng xuống (hiệu ứng; vụ nổ đi kèm có event explode riêng)
  | { t: number; kind: 'armorBreak'; id: number; turns: number; amount: number }

export interface ShotResult {
  /** Mỗi viên đạn một đường, mảng phẳng [t, x, y, t, x, y, ...] (t tính từ lúc bắn); điểm cuối là điểm chạm/tách/ra biên. */
  paths: number[][]
  events: ShotEvent[]
  endT: number
  terrainHashAfter: number
  /** Mask sau phát bắn. Chỉ dùng cục bộ (server/offline); không gửi qua mạng. */
  maskAfter: TerrainMask
}
