import { hashSeed, mulberry32 } from './math'

/**
 * Sự kiện thời tiết của một vòng: suy ra hoàn toàn từ (seed trận, số vòng, kích thước bản đồ) nên server, client và bot đều tính ra cùng kết quả.
 *  - whirl (Cột lốc): đạn đi qua cột (|x - x0| ≤ hw) bị nâng lên (gia tốc lên `power` px/s²)
 *  - storm (Mây giông): đạn đi vào khung mây thì, một lần mỗi phát bắn, có tia sét đánh xuống mặt đất dưới đạn
 *  - mirror (Gương nước): trong dải |x - x0| ≤ hw thành phần gió tác dụng lên đạn bị đảo chiều
 *  - portal (Cổng đôi): đạn vào cổng A (x, y) thì ra cổng B (x2, y2) với cùng vận tốc, và ngược lại
 */
export type WeatherKind = 'whirl' | 'storm' | 'mirror' | 'portal'

export interface Weather {
  kind: WeatherKind
  x: number
  y: number
  /** nửa rộng (whirl/mirror/storm) hoặc bán kính cổng (portal) */
  hw: number
  /** nửa cao khung mây (storm) */
  hh: number
  /** cổng B (portal) */
  x2: number
  y2: number
}

export interface WeatherTuning {
  chance: number                         // xác suất mỗi lượt có sự kiện (0 = tắt)
  whirl: { halfWidth: number; lift: number }
  storm: { halfWidth: number; halfHeight: number; delay: number; damage: number; blastRadius: number; carveRadius: number }
  mirror: { halfWidth: number }
  portal: { radius: number }
}

export const WEATHER_KINDS: readonly WeatherKind[] = ['whirl', 'storm', 'mirror', 'portal']

export const WEATHER_NAMES: Record<WeatherKind, string> = { whirl: 'Cột lốc', storm: 'Mây giông', mirror: 'Gương nước', portal: 'Cổng đôi' }

export function defaultWeatherTuning(): WeatherTuning {
  return {
    chance: 0.5,
    whirl: { halfWidth: 70, lift: 900 },
    storm: { halfWidth: 110, halfHeight: 50, delay: 0.25, damage: 450, blastRadius: 70, carveRadius: 40 },
    mirror: { halfWidth: 70 },
    portal: { radius: 38 },
  }
}

export function weatherForRound(seed: number, roundNo: number, mapW: number, mapH: number, t: WeatherTuning): Weather | null {
  const rng = mulberry32(hashSeed(`weather:${seed}:${roundNo}`))
  if (rng() >= t.chance) return null
  const kind = WEATHER_KINDS[Math.min(WEATHER_KINDS.length - 1, Math.floor(rng() * WEATHER_KINDS.length))]!
  const between = (a: number, b: number): number => Math.round(a + rng() * (b - a))
  const w: Weather = { kind, x: 0, y: 0, hw: 0, hh: 0, x2: 0, y2: 0 }
  switch (kind) {
    case 'whirl': w.x = between(mapW * 0.3, mapW * 0.7); w.y = mapH / 2; w.hw = t.whirl.halfWidth; break
    case 'mirror': w.x = between(mapW * 0.3, mapW * 0.7); w.y = mapH / 2; w.hw = t.mirror.halfWidth; break
    case 'storm': w.x = between(mapW * 0.3, mapW * 0.7); w.y = between(-mapH * 0.05, mapH * 0.1); w.hw = t.storm.halfWidth; w.hh = t.storm.halfHeight; break
    case 'portal':
      w.x = between(mapW * 0.28, mapW * 0.45); w.y = between(mapH * 0.25, mapH * 0.5)
      w.x2 = between(mapW * 0.55, mapW * 0.72); w.y2 = between(mapH * 0.25, mapH * 0.5); w.hw = t.portal.radius
      break
  }
  return w
}
