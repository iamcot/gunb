import { describe, expect, it } from 'vitest'
import { TerrainMask } from '../terrain/mask'
import { createDefaultTuning } from '../tuning'
import { simulateShot } from './simulateShot'
import type { ShotInput, ShotVehicle } from './types'

const GROUND = 900
function world(): TerrainMask {
  const m = new TerrainMask(3000, 1200)
  for (let y = GROUND; y < 1200; y++) m.data.fill(1, y * 3000, (y + 1) * 3000)
  return m
}
const veh = (id: number, x: number, hp = 100, armor = 0): ShotVehicle => ({ id, x, y: GROUND - 18, radius: 18, hp, armor })

function input(over: Partial<ShotInput> = {}): ShotInput {
  return {
    mask: world(), vehicles: [veh(1, 200), veh(2, 1000)], wind: { x: 0, y: 0 }, shooterId: 1, facing: 1, tilt: 0,
    fire: { angle: 45, power: 80, shotType: 'basic' }, ...over,
  }
}

describe('simulateShot', () => {
  it('cùng input hai lần ⇒ kết quả giống hệt', () => {
    const a = simulateShot(input()), b = simulateShot(input())
    expect(JSON.stringify({ ...a, maskAfter: 0 })).toBe(JSON.stringify({ ...b, maskAfter: 0 }))
    expect(a.terrainHashAfter).toBe(b.terrainHashAfter)
  })

  it('không sửa mask đầu vào; hash kết quả khớp maskAfter; hố làm giảm số ô đất', () => {
    const inp = input()
    const before = inp.mask.hash()
    const r = simulateShot(inp)
    expect(inp.mask.hash()).toBe(before)
    expect(r.terrainHashAfter).toBe(r.maskAfter.hash())
    expect(r.maskAfter.countSolid()).toBeLessThan(inp.mask.countSolid())
    expect(r.events.some(e => e.kind === 'carve')).toBe(true)
  })

  it('nổ sát xe thì gần sát thương tối đa; xa hơn bán kính thì 0', () => {
    const t = createDefaultTuning()
    // đặt mục tiêu ngay chỗ đạn rơi: lấy điểm rơi từ lần bắn thử không có mục tiêu
    const probe = simulateShot(input({ vehicles: [veh(1, 200)] }), t)
    const ex = probe.events.find(e => e.kind === 'explode')!
    if (ex.kind !== 'explode') throw new Error()
    const near = simulateShot(input({ vehicles: [veh(1, 200), veh(2, ex.x + 5)] }), t)
    const dmg = near.events.find(e => e.kind === 'damage' && e.id === 2)
    expect(dmg && dmg.kind === 'damage' && dmg.amount).toBeGreaterThanOrEqual(t.shots.basic.damage * 0.9)
    const far = simulateShot(input({ vehicles: [veh(1, 200), veh(2, ex.x + t.shots.basic.blastRadius + 18 + 5)] }), t)
    expect(far.events.some(e => e.kind === 'damage' && e.id === 2)).toBe(false)
  })

  it('giáp giảm sát thương; hpAfter không âm', () => {
    const t = createDefaultTuning()
    const probe = simulateShot(input({ vehicles: [veh(1, 200)] }), t)
    const ex = probe.events.find(e => e.kind === 'explode')!
    if (ex.kind !== 'explode') throw new Error()
    const r = simulateShot(input({ vehicles: [veh(1, 200), veh(2, ex.x, 10, 0.5)] }), t)
    const d = r.events.find(e => e.kind === 'damage' && e.id === 2)
    expect(d && d.kind === 'damage' && d.amount).toBe(Math.round(t.shots.basic.damage * 0.5))
    expect(d && d.kind === 'damage' && d.hpAfter).toBe(0)
  })

  it('gió đẩy điểm rơi theo hướng gió', () => {
    const calm = simulateShot(input()), windy = simulateShot(input({ wind: { x: 20, y: 0 } }))
    const x = (r: typeof calm) => { const e = r.events.find(e => e.kind === 'explode')!; return e.kind === 'explode' ? e.x : NaN }
    expect(x(windy)).toBeGreaterThan(x(calm))
  })

  it('bắn ra ngoài bản đồ ⇒ sự kiện out, không nổ', () => {
    const r = simulateShot(input({ facing: -1, fire: { angle: 20, power: 100, shotType: 'basic' } }))
    expect(r.events.some(e => e.kind === 'out')).toBe(true)
    expect(r.events.some(e => e.kind === 'explode')).toBe(false)
  })

  it('kẹp góc và lực ngoài dải', () => {
    expect(() => simulateShot(input({ fire: { angle: 500, power: -5, shotType: 'basic' } }))).not.toThrow()
  })
})
