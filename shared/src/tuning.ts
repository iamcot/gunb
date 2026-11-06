import { FALL_DAMAGE_PER_PX, GRAVITY, MAX_SLOPE_DEG, MOVE_FUEL_PER_TURN, POWER_CHARGE_S, TURN_TIME_S, WIND_SCALE } from './constants'
import type { ShotDef, ShotType } from './shots'

/** Thông số gameplay chỉnh được lúc chạy (bảng F6). Mọi logic đọc từ đây, không hardcode. */
export interface Tuning {
  gravity: number
  windScale: number
  powerChargeS: number
  shots: Record<ShotType, ShotDef>
  move: MoveTuning
  turn: TurnTuning
  mobile: MobileTuning
}

export interface MoveTuning {
  speed: number           // px/s khi đi
  fuelPerTurn: number     // px đi được mỗi lượt
  maxSlopeDeg: number     // dốc hơn thì không leo được
  stepUp: number          // bậc cao nhất đi lên được (px)
  snapDown: number        // đất thấp hơn mức này thì bám theo, thấp hơn nữa thì rơi
  fallDamagePerPx: number
  fallSafePx: number      // rơi không quá mức này thì không mất máu
  delayPerPx: number      // delay cộng cho mỗi px đã đi
}

export interface TurnTuning {
  timeS: number
  timeoutPenalty: number  // delay cộng khi hết giờ hoặc bỏ lượt
}

/** Thông số mặc định của một xe (Phase 3 sẽ thay bằng thông số từng pháo). */
export interface MobileTuning { hp: number; armor: number; radius: number }

export function createDefaultTuning(): Tuning {
  return {
    gravity: GRAVITY,
    windScale: WIND_SCALE,
    powerChargeS: POWER_CHARGE_S,
    shots: {
      basic: { maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 70, carveRadius: 45, damage: 40, delay: 100 },
    },
    move: { speed: 90, fuelPerTurn: MOVE_FUEL_PER_TURN, maxSlopeDeg: MAX_SLOPE_DEG, stepUp: 14, snapDown: 8, fallDamagePerPx: FALL_DAMAGE_PER_PX, fallSafePx: 24, delayPerPx: 0.2 },
    turn: { timeS: TURN_TIME_S, timeoutPenalty: 150 },
    mobile: { hp: 100, armor: 0, radius: 18 },
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
  TUNING.move = d.move
  TUNING.turn = d.turn
  TUNING.mobile = d.mobile
}
