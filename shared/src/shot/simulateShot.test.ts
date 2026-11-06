import { describe, expect, it } from 'vitest'
import { TerrainMask } from '../terrain/mask'
import { createDefaultTuning } from '../tuning'
import { simulateShot } from './simulateShot'
import type { ShotEvent, ShotInput, ShotResult, ShotVehicle } from './types'

const GROUND = 900
const W = 3000, H = 1200
function world(): TerrainMask {
  const m = new TerrainMask(W, H)
  for (let y = GROUND; y < H; y++) m.data.fill(1, y * W, (y + 1) * W)
  return m
}
const veh = (id: number, x: number, over: Partial<ShotVehicle> = {}): ShotVehicle =>
  ({ id, mobileId: 'oc-thiet-giap', x, y: GROUND - 18, radius: 18, hp: 100, armor: 0, ...over })

function input(over: Partial<ShotInput> = {}): ShotInput {
  return {
    mask: world(), vehicles: [veh(1, 200), veh(2, 1000)], wind: { x: 0, y: 0 }, shooterId: 1, facing: 1, tilt: 0,
    fire: { angle: 45, power: 80, slot: 0 }, ...over,
  }
}
const explodes = (r: ShotResult) => r.events.filter((e): e is Extract<ShotEvent, { kind: 'explode' }> => e.kind === 'explode')
const damages = (r: ShotResult, id: number) => r.events.filter((e): e is Extract<ShotEvent, { kind: 'damage' }> => e.kind === 'damage' && e.id === id)

describe('simulateShot: đạn thường (Ốc Thiết Giáp, đạn 1)', () => {
  it('cùng input hai lần ⇒ kết quả giống hệt', () => {
    const a = simulateShot(input()), b = simulateShot(input())
    expect(JSON.stringify({ ...a, maskAfter: 0 })).toBe(JSON.stringify({ ...b, maskAfter: 0 }))
  })

  it('không sửa mask đầu vào; hash khớp maskAfter; hố làm giảm số ô đất', () => {
    const inp = input()
    const before = inp.mask.hash()
    const r = simulateShot(inp)
    expect(inp.mask.hash()).toBe(before)
    expect(r.terrainHashAfter).toBe(r.maskAfter.hash())
    expect(r.maskAfter.countSolid()).toBeLessThan(inp.mask.countSolid())
  })

  it('nổ sát xe thì gần sát thương tối đa; xa hơn bán kính thì 0; giáp giảm sát thương', () => {
    const t = createDefaultTuning()
    const sh = t.mobiles['oc-thiet-giap']!.shots[0]
    const ex = explodes(simulateShot(input({ vehicles: [veh(1, 200)] }), t))[0]!
    const near = simulateShot(input({ vehicles: [veh(1, 200), veh(2, ex.x + 5)] }), t)
    expect(damages(near, 2)[0]!.amount).toBeGreaterThanOrEqual(sh.damage * 0.9)
    expect(damages(simulateShot(input({ vehicles: [veh(1, 200), veh(2, ex.x + sh.blastRadius + 18 + 5)] }), t), 2)).toHaveLength(0)
    const armored = simulateShot(input({ vehicles: [veh(1, 200), veh(2, ex.x, { hp: 10, armor: 0.5 })] }), t)
    expect(damages(armored, 2)[0]!.amount).toBe(Math.round(sh.damage * 0.5))
    expect(damages(armored, 2)[0]!.hpAfter).toBe(0)
  })

  it('gió đẩy điểm rơi theo hướng gió; bắn ra ngoài bản đồ ⇒ out, không nổ; kẹp góc/lực ngoài dải', () => {
    const x = (r: ShotResult) => explodes(r)[0]!.x
    expect(x(simulateShot(input({ wind: { x: 20, y: 0 } })))).toBeGreaterThan(x(simulateShot(input())))
    const out = simulateShot(input({ facing: -1, fire: { angle: 20, power: 100, slot: 0 } }))
    expect(out.events.some(e => e.kind === 'out')).toBe(true)
    expect(explodes(out)).toHaveLength(0)
    expect(() => simulateShot(input({ fire: { angle: 500, power: -5, slot: 0 } }))).not.toThrow()
  })
})

describe('simulateShot: behavior', () => {
  it('burst (Ốc, đạn 2): 2 quả bắn cách nhau interval, 2 vụ nổ, 2 đường đạn', () => {
    const t = createDefaultTuning()
    const r = simulateShot(input({ fire: { angle: 45, power: 60, slot: 1 } }), t)
    expect(r.paths).toHaveLength(2)
    expect(explodes(r)).toHaveLength(2)
    const iv = (t.mobiles['oc-thiet-giap']!.shots[1].behavior as { interval: number }).interval
    expect(r.paths[1]![0]).toBeCloseTo(iv, 1)
    expect(explodes(r)[1]!.t).toBeGreaterThan(explodes(r)[0]!.t)
  })

  it('splitAtApex (Bọ Lôi, đạn 2): tách 3 quả tại đỉnh quỹ đạo rồi 3 vụ nổ', () => {
    const r = simulateShot(input({ vehicles: [veh(1, 200, { mobileId: 'bo-loi' }), veh(2, 1000)], fire: { angle: 60, power: 70, slot: 1 } }))
    expect(r.paths).toHaveLength(4)          // quả mẹ + 3 quả con
    const split = r.events.find(e => e.kind === 'split')!
    expect(split).toBeDefined()
    const parent = r.paths[0]!
    // đỉnh quỹ đạo: điểm cuối quả mẹ cao hơn điểm bắn
    expect(parent[parent.length - 1]).toBeLessThan(GROUND - 100)
    expect(explodes(r)).toHaveLength(3)
    const xs = explodes(r).map(e => e.x)
    expect(new Set(xs.map(Math.round)).size).toBe(3)    // 3 điểm rơi khác nhau
  })

  it('drill (Chũi Khoan, đạn 1): chui vào đất rồi mới nổ, hố sâu hơn điểm chạm', () => {
    const r = simulateShot(input({ vehicles: [veh(1, 200, { mobileId: 'chui-khoan' })], fire: { angle: 45, power: 60, slot: 0 } }))
    expect(explodes(r)).toHaveLength(1)
    const ex = explodes(r)[0]!
    expect(ex.y).toBeGreaterThan(GROUND)          // nổ bên dưới mặt đất
    expect(r.events.filter(e => e.kind === 'carve').length).toBeGreaterThan(2)   // có đường hầm
  })

  it('drill ngang (đạn 2) đi ngang, drill xuống (SS) đi thẳng xuống', () => {
    const base = { vehicles: [veh(1, 200, { mobileId: 'chui-khoan' })] }
    const h = simulateShot(input({ ...base, fire: { angle: 45, power: 60, slot: 1 } }))
    const carves = h.events.filter((e): e is Extract<ShotEvent, { kind: 'carve' }> => e.kind === 'carve')
    expect(Math.abs(carves[carves.length - 1]!.y - carves[0]!.y)).toBeLessThan(40)
    expect(carves[carves.length - 1]!.x).toBeGreaterThan(carves[0]!.x + 60)
    const d = simulateShot(input({ ...base, fire: { angle: 45, power: 60, slot: 2 } }))
    const dc = d.events.filter((e): e is Extract<ShotEvent, { kind: 'carve' }> => e.kind === 'carve')
    expect(dc[dc.length - 1]!.y).toBeGreaterThan(dc[0]!.y + 100)
    expect(Math.abs(dc[dc.length - 1]!.x - dc[0]!.x)).toBeLessThan(5)
  })

  it('lightning (Bọ Lôi, SS): nổ rồi sét giáng đúng điểm nổ sau delay, thêm một vụ nổ lớn hơn', () => {
    const t = createDefaultTuning()
    const r = simulateShot(input({ vehicles: [veh(1, 200, { mobileId: 'bo-loi' })], fire: { angle: 50, power: 70, slot: 2 } }), t)
    const bolt = r.events.find(e => e.kind === 'bolt')!
    const [first, second] = explodes(r)
    expect(explodes(r)).toHaveLength(2)
    expect(bolt.t - first!.t).toBeCloseTo((t.mobiles['bo-loi']!.shots[2].behavior as { delay: number }).delay, 1)
    expect(second!.x).toBeCloseTo(first!.x, 5)
    expect(second!.r).toBeGreaterThan(first!.r)
  })

  it('armorBreak (Bọ Lôi, đạn 1): trúng thì có sự kiện giảm giáp lên mục tiêu', () => {
    const t = createDefaultTuning()
    const ex = explodes(simulateShot(input({ vehicles: [veh(1, 200, { mobileId: 'bo-loi' })] }), t))[0]!
    const r = simulateShot(input({ vehicles: [veh(1, 200, { mobileId: 'bo-loi' }), veh(2, ex.x + 5)] }), t)
    const e = r.events.find(e => e.kind === 'armorBreak')
    expect(e && e.kind === 'armorBreak' && e.id === 2 && e.turns === 2).toBe(true)
  })

  it('mọi sự kiện xếp theo thời gian không giảm', () => {
    for (const [mobileId, slot] of [['oc-thiet-giap', 1], ['bo-loi', 1], ['bo-loi', 2], ['chui-khoan', 0]] as const) {
      const r = simulateShot(input({ vehicles: [veh(1, 200, { mobileId })], fire: { angle: 55, power: 65, slot } }))
      for (let i = 1; i < r.events.length; i++) expect(r.events[i]!.t).toBeGreaterThanOrEqual(r.events[i - 1]!.t)
    }
  })
})
