import { BO_LOI } from './boLoi'
import { CHUI_KHOAN } from './chuiKhoan'
import { OC_THIET_GIAP } from './ocThietGiap'
import type { MobileDef } from './types'

export type { MobileDef } from './types'
export { BO_LOI, CHUI_KHOAN, OC_THIET_GIAP }

/** Thứ tự hiển thị ở màn chọn pháo. */
export const MOBILE_IDS = ['oc-thiet-giap', 'chui-khoan', 'bo-loi'] as const
export type MobileId = (typeof MOBILE_IDS)[number]

/** Bản sao sâu của thông số mặc định (để Tuning chỉnh được mà không đụng bản gốc). */
export function createDefaultMobiles(): Record<string, MobileDef> {
  const all = [OC_THIET_GIAP, CHUI_KHOAN, BO_LOI]
  return Object.fromEntries(all.map(m => [m.id, structuredClone(m)]))
}
