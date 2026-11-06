import { BO_LOI } from './boLoi'
import { CHUI_KHOAN } from './chuiKhoan'
import { CUA_LAN } from './cuaLan'
import { DIEU_HAU_GIAY } from './dieuHauGiay'
import { NHIM_CHUM } from './nhimChum'
import { RUA_THANH } from './ruaThanh'
import { SUA_DEN } from './suaDen'
import { OC_THIET_GIAP } from './ocThietGiap'
import type { MobileDef } from './types'

export type { MobileDef } from './types'
export { BO_LOI, CHUI_KHOAN, CUA_LAN, DIEU_HAU_GIAY, NHIM_CHUM, OC_THIET_GIAP, RUA_THANH, SUA_DEN }

/** Thứ tự hiển thị ở màn chọn pháo. */
export const MOBILE_IDS = ['oc-thiet-giap', 'chui-khoan', 'bo-loi', 'cua-lan', 'dieu-hau-giay', 'nhim-chum', 'sua-den', 'rua-thanh'] as const
export type MobileId = (typeof MOBILE_IDS)[number]

/** Bản sao sâu của thông số mặc định (để Tuning chỉnh được mà không đụng bản gốc). */
export function createDefaultMobiles(): Record<string, MobileDef> {
  const all = [OC_THIET_GIAP, CHUI_KHOAN, BO_LOI, CUA_LAN, DIEU_HAU_GIAY, NHIM_CHUM, SUA_DEN, RUA_THANH]
  return Object.fromEntries(all.map(m => [m.id, structuredClone(m)]))
}
