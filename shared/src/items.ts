import type { ShotDef } from './shots'

/** Item mang vào trận (chọn trong phòng chờ, dùng trong lượt bằng F1–F3). Mỗi lượt dùng tối đa 1 item; mỗi ô dùng 1 lần. */
export type ItemId = 'dual' | 'heal' | 'teleport' | 'windShield' | 'fastTurn'

export const ITEM_IDS: readonly ItemId[] = ['dual', 'heal', 'teleport', 'windShield', 'fastTurn']
/** Số ô item mỗi người mang vào trận. */
export const ITEM_SLOTS = 3

export interface ItemDef {
  id: ItemId
  name: string
  desc: string
  /** Delay cộng khi dùng (âm = giảm delay). */
  delay: number
}

export interface ItemsTuning {
  dual: ItemDef & { gap: number }                // s nghỉ giữa phát 1 và phát 2 (chỉ để phát lại)
  heal: ItemDef & { amount: number }             // máu hồi (không quá máu tối đa)
  teleport: ItemDef & { shot: ShotDef }          // phát bắn dịch chuyển: chỗ đạn chạm là chỗ đứng mới
  windShield: ItemDef
  fastTurn: ItemDef
}

export function defaultItemsTuning(): ItemsTuning {
  return {
    dual: { id: 'dual', name: 'Bắn 2 lần', desc: 'Phát bắn lượt này bắn 2 lần liền (không dùng với SS)', delay: 150, gap: 0.5 },
    heal: { id: 'heal', name: 'Hồi máu', desc: 'Hồi ngay 30 máu', delay: 60, amount: 30 },
    teleport: {
      id: 'teleport', name: 'Dịch chuyển', desc: 'Phát bắn lượt này là quả dịch chuyển: rơi đâu đứng đó, không gây sát thương', delay: 140,
      shot: { name: 'Quả dịch chuyển', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 0, carveRadius: 0, damage: 0, delay: 0, behavior: { kind: 'teleport' } },
    },
    windShield: { id: 'windShield', name: 'Lá chắn gió', desc: 'Gió lượt này về 0', delay: 60 },
    fastTurn: { id: 'fastTurn', name: 'Đổi lượt nhanh', desc: 'Giảm delay, sớm tới lượt sau', delay: -70 },
  }
}

export const isItemId = (v: unknown): v is ItemId => typeof v === 'string' && (ITEM_IDS as readonly string[]).includes(v)

/** Làm sạch danh sách item gửi lên: chỉ id hợp lệ, tối đa ITEM_SLOTS (được trùng). */
export function sanitizeItems(v: unknown): ItemId[] {
  if (!Array.isArray(v)) return []
  return v.filter(isItemId).slice(0, ITEM_SLOTS)
}
