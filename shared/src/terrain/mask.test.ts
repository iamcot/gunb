import { describe, expect, it } from 'vitest'
import { TerrainMask } from './mask'
import { groundYBelow, slopeAt } from './surface'

function solid(w: number, h: number): TerrainMask {
  const m = new TerrainMask(w, h)
  m.data.fill(1)
  return m
}

describe('TerrainMask', () => {
  it('fromAlpha: alpha > 127 là đất', () => {
    const rgba = new Uint8Array([0, 0, 0, 128, 0, 0, 0, 127])
    const m = TerrainMask.fromAlpha(2, 1, rgba)
    expect(m.isSolid(0, 0)).toBe(true)
    expect(m.isSolid(1, 0)).toBe(false)
  })

  it('ngoài biên là trống', () => {
    const m = solid(10, 10)
    expect(m.isSolid(-1, 5)).toBe(false)
    expect(m.isSolid(10, 5)).toBe(false)
    expect(m.isSolid(5, -1)).toBe(false)
    expect(m.isSolid(5, 10)).toBe(false)
    expect(m.isSolid(5, 5)).toBe(true)
  })

  it('carve giữa khối đặc: số ô trống ≈ πr²', () => {
    const m = solid(200, 200)
    const r = 30
    m.carveCircle(100, 100, r)
    const cleared = 200 * 200 - m.countSolid()
    expect(Math.abs(cleared - Math.PI * r * r) / (Math.PI * r * r)).toBeLessThan(0.02)
    expect(m.isSolid(100, 100)).toBe(false)
    expect(m.isSolid(100 + r + 1, 100)).toBe(true)
  })

  it('carve trả về hình chữ nhật bị ảnh hưởng, cắt theo biên', () => {
    const m = solid(50, 50)
    const rect = m.carveCircle(2, 3, 10)
    expect(rect).toEqual({ x0: 0, y0: 0, x1: 13, y1: 14 })
  })

  it('carve sát biên và ngoài bản đồ không lỗi', () => {
    const m = solid(20, 20)
    const before = m.countSolid()
    expect(() => m.carveCircle(-5, -5, 3)).not.toThrow()
    expect(m.countSolid()).toBe(before)
    expect(() => m.carveCircle(19, 19, 8)).not.toThrow()
    expect(() => m.carveCircle(1000, 1000, 8)).not.toThrow()
    expect(m.countSolid()).toBeLessThan(before)
  })

  it('cùng chuỗi carve trên 2 mask ra cùng hash; khác thì khác hash', () => {
    const a = solid(120, 80), b = solid(120, 80)
    for (const [x, y, r] of [[30, 20, 12], [90.4, 50.6, 9], [60, 79, 15]] as const) { a.carveCircle(x, y, r); b.carveCircle(x, y, r) }
    expect(a.hash()).toBe(b.hash())
    b.carveCircle(10, 10, 4)
    expect(a.hash()).not.toBe(b.hash())
  })

  it('clone độc lập', () => {
    const a = solid(10, 10)
    const b = a.clone()
    b.carveCircle(5, 5, 3)
    expect(a.countSolid()).toBe(100)
    expect(b.countSolid()).toBeLessThan(100)
  })
})

describe('surface', () => {
  it('groundYBelow', () => {
    const m = new TerrainMask(10, 10)
    for (let y = 6; y < 10; y++) for (let x = 0; x < 10; x++) m.data[y * 10 + x] = 1
    expect(groundYBelow(m, 3, 0)).toBe(6)
    expect(groundYBelow(m, 3, 8)).toBe(8)
    expect(groundYBelow(m, -1, 0)).toBe(-1)
    m.carveCircle(3, 7, 5)
    expect(groundYBelow(m, 3, 0)).toBe(-1)
  })

  it('slopeAt: mặt phẳng = 0, dốc lên bên phải > 0', () => {
    const m = new TerrainMask(100, 100)
    for (let x = 0; x < 100; x++) for (let y = 80 - Math.floor(x / 2); y < 100; y++) m.data[y * 100 + x] = 1
    expect(slopeAt(m, 50, 0, 5)).toBeGreaterThan(0)
    expect(slopeAt(m, 50, 0, 5)).toBeCloseTo(Math.atan(0.5), 1)
    const flat = new TerrainMask(100, 100)
    for (let y = 50; y < 100; y++) for (let x = 0; x < 100; x++) flat.data[y * 100 + x] = 1
    expect(slopeAt(flat, 50, 0, 5)).toBe(0)
  })
})
