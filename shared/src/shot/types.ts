import type { TerrainMask } from '../terrain/mask'
import type { ShotType } from '../shots'
import type { Wind } from '../wind'

export interface ShotVehicle {
  id: number
  x: number           // tâm
  y: number
  radius: number
  hp: number
  armor: number       // 0..1: tỉ lệ sát thương được giảm
}

export interface FireCmd {
  angle: number       // độ nguyên, ANGLE_MIN..ANGLE_MAX
  power: number       // 0..100
  shotType: ShotType
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

export interface ShotResult {
  /** Mỗi đường là mảng phẳng [t, x, y, t, x, y, ...]; điểm cuối là điểm chạm/ra biên. */
  paths: number[][]
  events: ShotEvent[]
  endT: number
  terrainHashAfter: number
  /** Mask sau phát bắn. Chỉ dùng cục bộ (server/offline); không gửi qua mạng. */
  maskAfter: TerrainMask
}
