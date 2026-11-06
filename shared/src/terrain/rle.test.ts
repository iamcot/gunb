import { expect, it } from 'vitest'
import { TerrainMask } from './mask'
import { decodeMaskRle, encodeMaskRle } from './rle'

it('RLE khứ hồi giữ nguyên mask (rỗng, đặc, hố tròn, bắt đầu bằng đất)', () => {
  const empty = new TerrainMask(50, 40)
  const full = new TerrainMask(50, 40); full.data.fill(1)
  const holes = full.clone(); holes.carveCircle(20, 20, 9); holes.carveCircle(45, 38, 6)
  for (const m of [empty, full, holes]) {
    const back = decodeMaskRle(50, 40, encodeMaskRle(m))
    expect(back.hash()).toBe(m.hash())
  }
})

it('mask lớn nén nhỏ hơn nhiều so với dữ liệu thô', () => {
  const m = new TerrainMask(2400, 1200)
  for (let y = 700; y < 1200; y++) m.data.fill(1, y * 2400, (y + 1) * 2400)
  m.carveCircle(1000, 800, 80)
  expect(encodeMaskRle(m).length).toBeLessThan(20000)
})

it('từ chối dữ liệu hỏng', () => {
  const m = new TerrainMask(10, 10)
  const rle = encodeMaskRle(m)
  expect(() => decodeMaskRle(20, 10, rle)).toThrow()
  expect(() => decodeMaskRle(10, 10, rle.subarray(0, 0))).toThrow()
})
