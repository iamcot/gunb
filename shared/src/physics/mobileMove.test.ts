import { describe, expect, it } from 'vitest'
import { TerrainMask } from '../terrain/mask'
import { createDefaultTuning } from '../tuning'
import { createBody, stepMobile, type MoveResult } from './mobileMove'

const W = 1000, H = 600, G = 400
const R = 18
function flat(): TerrainMask {
  const m = new TerrainMask(W, H)
  for (let y = G; y < H; y++) m.data.fill(1, y * W, (y + 1) * W)
  return m
}
const out = (): MoveResult => ({ moved: 0, damage: 0, died: false })
function run(b: ReturnType<typeof createBody>, dir: -1 | 0 | 1, secs: number, m: TerrainMask, o = out()): MoveResult {
  const t = createDefaultTuning()
  let moved = 0, damage = 0, died = false
  for (let i = 0; i < Math.round(secs * 60); i++) { stepMobile(b, dir, 1 / 60, m, t, o); moved += o.moved; damage += o.damage; died ||= o.died }
  return { moved, damage, died }
}

describe('stepMobile', () => {
  it('đi trên mặt phẳng tốn đúng nhiên liệu rồi dừng khi hết', () => {
    const m = flat(), b = createBody(200, G - R, R, 1)
    b.fuel = 60
    const r = run(b, 1, 0.5, m)       // 0.5 s * 90 px/s = 45 px
    expect(r.moved).toBeCloseTo(45, 0)
    expect(b.fuel).toBeCloseTo(15, 0)
    const r2 = run(b, 1, 2, m)
    expect(b.fuel).toBeCloseTo(0, 5)
    expect(r.moved + r2.moved).toBeCloseTo(60, 3)
    expect(b.x).toBeCloseTo(260, 3)
    expect(b.y).toBe(G - R)
  })

  it('gặp vách thẳng đứng thì dừng, không xuyên', () => {
    const m = flat()
    for (let x = 300; x < W; x++) for (let y = G - 100; y < G; y++) m.data[y * W + x] = 1
    const b = createBody(200, G - R, R, 1)
    b.fuel = 500
    run(b, 1, 4, m)
    expect(b.x).toBeGreaterThan(250)
    expect(b.x).toBeLessThan(300)
    expect(b.fuel).toBeGreaterThan(0)
  })

  function ramp(slope: number): TerrainMask {
    const m = flat()
    for (let x = 300; x < W; x++) {
      const top = Math.max(0, Math.round(G - (x - 300) * slope))
      for (let y = top; y < G; y++) m.data[y * W + x] = 1
    }
    return m
  }

  it('leo dốc 30° được, dốc 70° thì dừng', () => {
    const gentle = ramp(Math.tan(Math.PI / 6)), b1 = createBody(200, G - R, R, 1)
    b1.fuel = 400
    run(b1, 1, 4, gentle)
    expect(b1.x).toBeGreaterThan(330)
    expect(b1.y).toBeLessThan(G - R - 10)
    const steep = ramp(Math.tan((70 * Math.PI) / 180)), b2 = createBody(200, G - R, R, 1)
    b2.fuel = 400
    run(b2, 1, 4, steep)
    expect(b2.x).toBeLessThan(320)
  })

  it('đào hố dưới chân thì rơi xuống đáy hố và mất máu theo độ cao', () => {
    const m = flat(), b = createBody(500, G - R, R, 1)
    m.carveCircle(500, G, 90)
    const r = run(b, 0, 3, m)
    expect(b.onGround).toBe(true)
    expect(b.y + R).toBeGreaterThan(G + 60)
    expect(r.damage).toBeGreaterThan(0)
    expect(r.died).toBe(false)
  })

  it('rơi nhẹ (≤ ngưỡng an toàn) không mất máu', () => {
    const m = flat(), b = createBody(500, G - R - 10, R, 1)
    b.onGround = false
    const r = run(b, 0, 1, m)
    expect(r.damage).toBe(0)
    expect(b.y).toBe(G - R)
  })

  it('mất hết đất bên dưới thì rơi khỏi đáy và chết', () => {
    const m = flat(), b = createBody(500, G - R, R, 1)
    m.carveCircle(500, G + 50, 300)
    const r = run(b, 0, 5, m)
    expect(r.died).toBe(true)
    expect(b.alive).toBe(false)
  })

  it('xe đã chết không còn cử động', () => {
    const m = flat(), b = createBody(500, G - R, R, 1)
    b.alive = false
    b.fuel = 100
    run(b, 1, 1, m)
    expect(b.x).toBe(500)
  })
})
