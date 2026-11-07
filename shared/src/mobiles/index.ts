import { BO_LOI } from './boLoi'
import { CHUI_KHOAN } from './chuiKhoan'
import { CUA_LAN } from './cuaLan'
import { CU_THIEN_VAN } from './cuThienVan'
import { DIEU_HAU_GIAY } from './dieuHauGiay'
import { KY_LAN_SAT } from './kyLanSat'
import { LONG_NGU_CO } from './longNguCo'
import { NHIM_CHUM } from './nhimChum'
import { RUA_THANH } from './ruaThanh'
import { SUA_DEN } from './suaDen'
import { OC_THIET_GIAP } from './ocThietGiap'
import type { MobileDef } from './types'

export type { MobileDef } from './types'
export { KY_LAN_SAT, LONG_NGU_CO, BO_LOI, CHUI_KHOAN, CUA_LAN, CU_THIEN_VAN, DIEU_HAU_GIAY, NHIM_CHUM, OC_THIET_GIAP, RUA_THANH, SUA_DEN }

/** Thứ tự hiển thị ở màn chọn pháo. */
export const MOBILE_IDS = ['oc-thiet-giap', 'chui-khoan', 'bo-loi', 'cua-lan', 'dieu-hau-giay', 'nhim-chum', 'sua-den', 'rua-thanh', 'cu-thien-van'] as const
/** Xe ẩn: không có ở lưới chọn pháo, chỉ gặp qua nút Ngẫu nhiên. */
export const SECRET_MOBILE_IDS = ['long-ngu-co', 'ky-lan-sat'] as const
/** Mọi xe hợp lệ (cả xe ẩn): server kiểm tra lựa chọn và nút Ngẫu nhiên bốc trong danh sách này. */
export const ALL_MOBILE_IDS: readonly string[] = [...MOBILE_IDS, ...SECRET_MOBILE_IDS]
/** Giá trị đặt chỗ "chưa chọn xe" ở phòng online: server bốc ngẫu nhiên trong `ALL_MOBILE_IDS` lúc bấm Bắt đầu (xe ẩn cũng có thể ra). */
export const RANDOM_MOBILE = 'random'
export type MobileId = (typeof MOBILE_IDS)[number]

/** Bản sao sâu của thông số mặc định (để Tuning chỉnh được mà không đụng bản gốc). */
export function createDefaultMobiles(): Record<string, MobileDef> {
  const all = [OC_THIET_GIAP, CHUI_KHOAN, BO_LOI, CUA_LAN, DIEU_HAU_GIAY, NHIM_CHUM, SUA_DEN, RUA_THANH, CU_THIEN_VAN, LONG_NGU_CO, KY_LAN_SAT]
  return Object.fromEntries(all.map(m => [m.id, structuredClone(m)]))
}
