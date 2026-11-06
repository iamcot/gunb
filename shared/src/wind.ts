import { WIND_MAX, WIND_VERTICAL_RATIO } from './constants'

export interface Wind { x: number; y: number }

/** Gió mới từ RNG có seed: độ lớn 0..WIND_MAX, hướng ngẫu nhiên, thành phần dọc yếu hơn. Số nguyên. */
export function makeWind(rng: () => number, max = WIND_MAX): Wind {
  const mag = Math.round(rng() * max)
  const ang = rng() * Math.PI * 2
  return { x: Math.round(Math.cos(ang) * mag), y: Math.round(Math.sin(ang) * mag * WIND_VERTICAL_RATIO) }
}

export const windMagnitude = (w: Wind): number => Math.hypot(w.x, w.y)
