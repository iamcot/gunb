import { FALL_DAMAGE_PER_PX, GRAVITY, MAX_SLOPE_DEG, POWER_CHARGE_S, TURN_TIME_S, WIND_SCALE } from './constants'
import { defaultItemsTuning, type ItemsTuning } from './items'
import { createDefaultMobiles, type MobileDef } from './mobiles'
import { defaultWeatherTuning, type WeatherTuning } from './weather'

/** Thông số gameplay chỉnh được lúc chạy (bảng F6). Mọi logic đọc từ đây, không hardcode. */
export interface Tuning {
  gravity: number
  windScale: number
  powerChargeS: number
  mobiles: Record<string, MobileDef>
  move: MoveTuning
  turn: TurnTuning
  ss: SsTuning
  weather: WeatherTuning
  items: ItemsTuning
}

export interface MoveTuning {
  speed: number           // px/s khi đi
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
  delayPerSecond: number  // delay cộng cho mỗi giây đã suy nghĩ trong lượt khi bắn (xe có `delayPerSecondMul` thì nhân thêm)
}

/** Thanh SS: đầy thì dùng được đạn SS (một lần), dùng xong về 0. */
export interface SsTuning {
  max: number
  perDamageDealt: number  // cộng cho người bắn theo sát thương gây lên đối phương
  perDamageTaken: number  // cộng cho người trúng đạn theo sát thương nhận vào
  perTurn: number         // cộng đầu mỗi lượt của chính mình
}

export function createDefaultTuning(): Tuning {
  return {
    gravity: GRAVITY,
    windScale: WIND_SCALE,
    powerChargeS: POWER_CHARGE_S,
    mobiles: createDefaultMobiles(),
    move: { speed: 90, maxSlopeDeg: MAX_SLOPE_DEG, stepUp: 14, snapDown: 8, fallDamagePerPx: FALL_DAMAGE_PER_PX, fallSafePx: 24, delayPerPx: 0.5 },
    turn: { timeS: TURN_TIME_S, timeoutPenalty: 375, delayPerSecond: 10 },
    ss: { max: 100, perDamageDealt: 0.06, perDamageTaken: 0.04, perTurn: 8 },
    weather: defaultWeatherTuning(),
    items: defaultItemsTuning(),
  }
}

/** Bản dùng chung của client/server; test nên tự tạo `createDefaultTuning()` riêng. */
export const TUNING: Tuning = createDefaultTuning()

export function resetTuning(): void {
  const d = createDefaultTuning()
  TUNING.gravity = d.gravity
  TUNING.windScale = d.windScale
  TUNING.powerChargeS = d.powerChargeS
  TUNING.mobiles = d.mobiles
  TUNING.move = d.move
  TUNING.turn = d.turn
  TUNING.ss = d.ss
  TUNING.weather = d.weather
  TUNING.items = d.items
}
