import type { TerrainMask } from '../terrain/mask'
import type { ShotDef, ShotSlot } from '../shots'
import type { Wind } from '../wind'
import type { Weather } from '../weather'

export interface ShotVehicle {
  id: number
  mobileId: string
  x: number           // tâm
  y: number
  radius: number
  hp: number
  shield?: number     // khiên còn lại (hấp thụ sát thương trước máu); không có = 0
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
  /** Bỏ tính hash địa hình sau phát bắn (terrainHashAfter = 0). Dành cho bot thử nhiều phát bắn, nơi chỉ cần sát thương. */
  skipHash?: boolean
  /** Sự kiện thời tiết của vòng này (từ `weatherForRound`), hoặc không có. */
  weather?: Weather | null
  /** Thay đạn của ô `fire.slot` bằng đạn này (item Dịch chuyển). */
  shotDef?: ShotDef
}

export type ShotEvent =
  | { t: number; kind: 'explode'; x: number; y: number; r: number }
  | { t: number; kind: 'carve'; x: number; y: number; r: number }
  | { t: number; kind: 'fill'; x: number; y: number; r: number }      // đắp đất (Rùa Thành)
  | { t: number; kind: 'damage'; id: number; amount: number; hpAfter: number; shieldAfter?: number }   // amount = tổng (cả phần khiên hấp thụ); shieldAfter = khiên còn lại
  | { t: number; kind: 'shield'; id: number; shieldAfter: number }   // khiên bị đổi không kèm sát thương (SS Sứa Đèn xoá khiên)
  | { t: number; kind: 'out'; x: number; y: number }
  | { t: number; kind: 'split'; x: number; y: number }     // đạn tách ở đỉnh quỹ đạo (hiệu ứng)
  | { t: number; kind: 'bolt'; x: number; y: number; x0?: number; y0?: number }      // tia sét giáng xuống (x, y) từ (x0, y0) (không có thì thẳng từ trên cao) (hiệu ứng; vụ nổ đi kèm có event explode riêng)
  | { t: number; kind: 'grow'; shell: number; x: number; y: number }    // đạn airGrow bay đủ lâu và lớn lên (hiệu ứng; `shell` = chỉ số trong `paths`)
  | { t: number; kind: 'beam'; x: number; y: number; w: number; sky: boolean; x0: number; y0: number }  // tia laser vệ tinh tới (x, y), nửa bề rộng w: sky = từ tận trời thẳng đứng, không thì từ vệ tinh ở (x0, y0); (x0, y0) luôn là chỗ vệ tinh bay theo trên đầu xe bắn (hiệu ứng; khoét + sát thương có event riêng)
  | { t: number; kind: 'armorBreak'; id: number; turns: number; amount: number }
  | { t: number; kind: 'summon'; x: number; y: number; x0: number; y0: number; arrive: number }   // con vật triệu hồi hiện ở (x0, y0) và bò tới (x, y), tới nơi lúc `arrive` (hiệu ứng; vụ nổ khi tới có event explode riêng)
  | { t: number; kind: 'teleport'; x: number; y: number }   // quả dịch chuyển chạm: người bắn chuyển tới đây

export interface ShotResult {
  /** Mỗi viên đạn một đường, mảng phẳng [t, x, y, t, x, y, ...] (t tính từ lúc bắn); điểm cuối là điểm chạm/tách/ra biên. */
  paths: number[][]
  events: ShotEvent[]
  endT: number
  terrainHashAfter: number
  /** Mask sau phát bắn. Chỉ dùng cục bộ (server/offline); không gửi qua mạng. */
  maskAfter: TerrainMask
}
