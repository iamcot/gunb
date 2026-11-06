import { describe, expect, it } from 'vitest'
import { TerrainMask } from '../terrain/mask'
import { aimDir } from '../aim'
import { DT_SIM, GRAVITY } from '../constants'
import { FLYING, HIT_TERRAIN, OUT_OF_MAP, stepProjectile, type ProjectileState } from './projectile'

function flatMask(w: number, h: number, groundY: number): TerrainMask {
  const m = new TerrainMask(w, h)
  for (let y = groundY; y < h; y++) m.data.fill(1, y * w, (y + 1) * w)
  return m
}

describe('stepProjectile', () => {
  it('không gió, 45°, mặt phẳng: tầm xa khớp v²/g trong 1%', () => {
    const G = 900
    const mask = flatMask(3000, 1000, G)
    const v0 = 600
    const d = aimDir({ x: 0, y: 0 }, 45, 1)
    const p: ProjectileState = { x: 200, y: G - 1, vx: d.x * v0, vy: d.y * v0, t: 0, alive: true }
    let r: number = FLYING
    for (let i = 0; i < 100000 && r === FLYING; i++) r = stepProjectile(p, 0, GRAVITY, DT_SIM, mask)
    expect(r).toBe(HIT_TERRAIN)
    const expected = (v0 * v0) / GRAVITY
    expect(Math.abs(p.x - 200 - expected) / expected).toBeLessThan(0.01)
  })

  it('đạn rất nhanh không xuyên tấm đất dày 2 px', () => {
    const mask = new TerrainMask(400, 400)
    for (let y = 200; y < 202; y++) mask.data.fill(1, y * 400, (y + 1) * 400)
    const p: ProjectileState = { x: 100, y: 100, vx: 0, vy: 6000, t: 0, alive: true }
    let r: number = FLYING
    for (let i = 0; i < 1000 && r === FLYING; i++) r = stepProjectile(p, 0, 0, DT_SIM, mask)
    expect(r).toBe(HIT_TERRAIN)
    expect(p.y).toBeGreaterThanOrEqual(200)
    expect(p.y).toBeLessThan(202)
  })

  it('ra khỏi biên trái/phải/đáy kết thúc, bay quá cao vẫn tiếp tục', () => {
    const mask = new TerrainMask(100, 100)
    const left: ProjectileState = { x: 5, y: 50, vx: -1000, vy: 0, t: 0, alive: true }
    expect(stepProjectile(left, 0, 0, DT_SIM, mask)).toBe(OUT_OF_MAP)
    expect(left.alive).toBe(false)
    const up: ProjectileState = { x: 50, y: 5, vx: 0, vy: -1000, t: 0, alive: true }
    expect(stepProjectile(up, 0, 0, DT_SIM, mask)).toBe(FLYING)
    expect(up.y).toBeLessThan(0)
    expect(up.alive).toBe(true)
  })

  it('gió ngang đẩy đạn đi theo hướng gió', () => {
    const mask = new TerrainMask(1000, 1000)
    const a: ProjectileState = { x: 500, y: 500, vx: 0, vy: 0, t: 0, alive: true }
    for (let i = 0; i < 60; i++) stepProjectile(a, 100, 0, DT_SIM, mask)
    expect(a.x).toBeGreaterThan(500)
  })
})
