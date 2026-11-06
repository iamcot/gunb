import { expect, it } from 'vitest'
import { WIND_MAX } from './constants'
import { mulberry32 } from './math'
import { makeWind, windMagnitude } from './wind'

it('gió từ cùng seed giống nhau, độ lớn không vượt WIND_MAX', () => {
  const a = mulberry32(5), b = mulberry32(5)
  for (let i = 0; i < 200; i++) {
    const w = makeWind(a)
    expect(w).toEqual(makeWind(b))
    expect(windMagnitude(w)).toBeLessThanOrEqual(WIND_MAX + 1)
  }
})
