import { GRAVITY, POWER_CHARGE_S, WIND_SCALE } from './constants'
import type { ShotDef, ShotType } from './shots'

/** Thông số gameplay chỉnh được lúc chạy (bảng F6). Mọi logic đọc từ đây, không hardcode. */
export interface Tuning {
  gravity: number
  windScale: number
  powerChargeS: number
  shots: Record<ShotType, ShotDef>
}

export function createDefaultTuning(): Tuning {
  return {
    gravity: GRAVITY,
    windScale: WIND_SCALE,
    powerChargeS: POWER_CHARGE_S,
    shots: {
      basic: { maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 70, carveRadius: 45, damage: 40, delay: 1 },
    },
  }
}

/** Bản dùng chung của client/server; test nên tự tạo `createDefaultTuning()` riêng. */
export const TUNING: Tuning = createDefaultTuning()

export function resetTuning(): void {
  const d = createDefaultTuning()
  TUNING.gravity = d.gravity
  TUNING.windScale = d.windScale
  TUNING.powerChargeS = d.powerChargeS
  TUNING.shots.basic = d.shots.basic
}
