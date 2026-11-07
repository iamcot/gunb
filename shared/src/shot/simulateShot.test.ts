import { describe, expect, it } from 'vitest'
import { TerrainMask } from '../terrain/mask'
import { createDefaultTuning } from '../tuning'
import { simulateShot } from './simulateShot'
import type { ShotDef } from '../shots'
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

describe('simulateShot: đạn xuất phát từ đầu nòng', () => {
  it('Ốc: nòng chĩa thẳng lên thì đạn ở trên gốc nòng ox px; quay mặt trái thì đối xứng qua tâm xe', () => {
    const mz = createDefaultTuning().mobiles['oc-thiet-giap']!.muzzle!
    const r1 = simulateShot(input({ fire: { angle: 90, power: 50, slot: 0 } }))
    expect(r1.paths[0]![1]).toBeCloseTo(200 + mz.px, 0)
    expect(r1.paths[0]![2]).toBeCloseTo(GROUND - 18 + mz.py - mz.ox, 0)
    const r2 = simulateShot(input({ facing: -1, fire: { angle: 90, power: 50, slot: 0 } }))
    expect(r2.paths[0]![1]).toBeCloseTo(200 - mz.px, 0)
  })
})

describe('simulateShot: behavior', () => {
  it('burst: 2 quả bắn cách nhau interval, 2 vụ nổ, 2 đường đạn', () => {
    const t = createDefaultTuning()
    const r = simulateShot(input({ fire: { angle: 45, power: 60, slot: 1 }, shotDef: { name: 't', maxSpeed: 780, windFactor: 1, gravityFactor: 1, blastRadius: 50, carveRadius: 30, damage: 280, delay: 0, behavior: { kind: 'burst', count: 2, interval: 0.25, angleStepDeg: 0 } } }), t)
    expect(r.paths).toHaveLength(2)
    expect(explodes(r)).toHaveLength(2)
    expect(r.paths[1]![0]).toBeCloseTo(0.25, 1)
    expect(explodes(r)[1]!.t).toBeGreaterThan(explodes(r)[0]!.t)
  })

  it('splitAtApex: tách 3 quả tại đỉnh quỹ đạo rồi 3 vụ nổ', () => {
    const shotDef: ShotDef = { name: 't', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 50, carveRadius: 30, damage: 260, delay: 0, behavior: { kind: 'splitAtApex', count: 3, spreadDeg: 8 } }
    const r = simulateShot(input({ vehicles: [veh(1, 200), veh(2, 1000)], fire: { angle: 60, power: 70, slot: 0 }, shotDef }))
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

  const drillDef = (direction: 'velocity' | 'horizontal' | 'down', length: number): ShotDef => ({ name: 't', maxSpeed: 760, windFactor: 0.8, gravityFactor: 1, blastRadius: 60, carveRadius: 35, damage: 460, delay: 0, behavior: { kind: 'drill', length, tunnelRadius: 12, direction, speed: 450 } })
  it('drill: chui vào đất rồi mới nổ, hố sâu hơn điểm chạm', () => {
    const r = simulateShot(input({ vehicles: [veh(1, 200, { mobileId: 'chui-khoan' })], fire: { angle: 45, power: 60, slot: 0 }, shotDef: drillDef('velocity', 90) }))
    expect(explodes(r)).toHaveLength(1)
    const ex = explodes(r)[0]!
    expect(ex.y).toBeGreaterThan(GROUND)          // nổ bên dưới mặt đất
    expect(r.events.filter(e => e.kind === 'carve').length).toBeGreaterThan(2)   // có đường hầm
  })
  it('drill ngang đi ngang, drill xuống đi thẳng xuống', () => {
    const base = { vehicles: [veh(1, 200, { mobileId: 'chui-khoan' })] }
    const h = simulateShot(input({ ...base, fire: { angle: 45, power: 60, slot: 1 }, shotDef: drillDef('horizontal', 160) }))
    const carves = h.events.filter((e): e is Extract<ShotEvent, { kind: 'carve' }> => e.kind === 'carve')
    expect(Math.abs(carves[carves.length - 1]!.y - carves[0]!.y)).toBeLessThan(40)
    expect(carves[carves.length - 1]!.x).toBeGreaterThan(carves[0]!.x + 60)
    const d = simulateShot(input({ ...base, fire: { angle: 45, power: 60, slot: 2 }, shotDef: drillDef('down', 220) }))
    const dc = d.events.filter((e): e is Extract<ShotEvent, { kind: 'carve' }> => e.kind === 'carve')
    expect(dc[dc.length - 1]!.y).toBeGreaterThan(dc[0]!.y + 100)
    expect(Math.abs(dc[dc.length - 1]!.x - dc[0]!.x)).toBeLessThan(5)
  })
  it('lặn trồi (Chũi Khoan đạn 2): chui xuyên đất không khoét hầm, trồi lên và nổ ở mặt đất, xa hơn chỗ lặn', () => {
    const r = simulateShot(input({ vehicles: [veh(1, 200, { mobileId: 'chui-khoan' })], fire: { angle: 45, power: 60, slot: 1 } }))
    const path = r.paths[0]!
    let deepest = 0, dive = 0
    for (let k = 0; k < path.length; k += 3) deepest = Math.max(deepest, path[k + 2]!)
    expect(deepest).toBeGreaterThan(GROUND + 30)             // có lặn sâu
    expect(r.events.filter(e => e.kind === 'carve')).toHaveLength(1)   // chỉ có hố của vụ nổ, không có đường hầm
    const ex = explodes(r)
    expect(ex).toHaveLength(1)
    expect(ex[0]!.y).toBeLessThan(GROUND + 25)               // nổ gần mặt đất, không phải dưới sâu
    for (let k = 0; k < path.length; k += 3) if (path[k + 2]! > GROUND + 5) { dive = path[k + 1]!; break }
    expect(ex[0]!.x).toBeGreaterThan(dive + 40)              // chỗ trồi cách chỗ lặn
  })
  it('xuyên địa hình (Chũi Khoan SS): bay xuyên đất, chỉ nổ khi chạm xe (kể cả xác xe)', () => {
    const base = { fire: { angle: 5, power: 90, slot: 2 as const } }
    const free = simulateShot(input({ ...base, vehicles: [veh(1, 200, { mobileId: 'chui-khoan' })] }))
    expect(explodes(free)).toHaveLength(0)                    // không có xe nào: xuyên đi mất
    expect(free.events.some(e => e.kind === 'out')).toBe(true)
    expect(free.events.filter(e => e.kind === 'carve')).toHaveLength(0)   // xuyên đất mà không khoét
    const path = free.paths[0]!, k = Math.floor(path.length / 3 / 2) * 3   // điểm giữa đường bay
    const px = path[k + 1]!, py = path[k + 2]!
    const dead = simulateShot(input({ ...base, vehicles: [veh(1, 200, { mobileId: 'chui-khoan' }), veh(2, px, { hp: 0, y: py })] }))
    const ex = explodes(dead)
    expect(ex).toHaveLength(1)                                // chạm xác xe thì nổ
    expect(Math.hypot(ex[0]!.x - px, ex[0]!.y - py)).toBeLessThan(30)
  })

  describe('lightning (Bọ Lôi)', () => {
    const t = createDefaultTuning()
    const boLoi = (x = 200) => veh(1, x, { mobileId: 'bo-loi' })
    const bolts = (r: ShotResult) => r.events.filter((e): e is Extract<ShotEvent, { kind: 'bolt' }> => e.kind === 'bolt')
    const fireBo = (slot: 0 | 1 | 2, others: ShotVehicle[], mask?: TerrainMask) =>
      simulateShot(input({ vehicles: [boLoi(), ...others], fire: { angle: 55, power: 75, slot }, ...(mask ? { mask } : {}) }), t)
    const landing = (slot: 0 | 1 | 2) => explodes(fireBo(slot, []))[0]!

    it('đạn 1: sét giáng thẳng từ trời xuống đúng chỗ đạn chạm sau delay, trúng xe đứng đó, rồi dư chấn', () => {
      const ex = landing(0)
      const beh = t.mobiles['bo-loi']!.shots[0].behavior
      if (beh.kind !== 'lightning' || !beh.aftershock) throw new Error('đạn 1 Bọ Lôi phải có sét + dư chấn')
      const r = fireBo(0, [veh(2, ex.x, { hp: 5000 })])
      const [b] = bolts(r)
      expect(bolts(r)).toHaveLength(1)
      expect(b!.t - ex.t).toBeCloseTo(beh.delay, 1)
      expect(b!.x0).toBeCloseTo(b!.x, 5)                 // thẳng đứng
      expect(b!.y0).toBeLessThan(0)                      // từ phía trên bản đồ
      expect(b!.y).toBeLessThan(GROUND - 18)             // chạm đỉnh xe, không xuyên xuống đất
      const d = damages(r, 2)
      expect(d).toHaveLength(2)                          // sét + dư chấn
      expect(d[1]!.t - d[0]!.t).toBeCloseTo(beh.aftershock.delay, 1)
      expect(d[1]!.amount).toBe(Math.round(beh.aftershock.damage))
      expect(d[0]!.amount).toBeGreaterThan(beh.damage * 0.8)
    })

    it('đạn 2: hai tia chéo đi từ hai phía, cùng rơi vào chỗ đạn chạm; mỗi xe chỉ bị dư chấn một lần', () => {
      const ex = landing(1)
      const r = fireBo(1, [veh(2, ex.x, { hp: 5000 })])
      const bs = bolts(r)
      expect(bs).toHaveLength(2)
      expect(bs.some(b => b.x0! < b.x - 50) && bs.some(b => b.x0! > b.x + 50)).toBe(true)
      expect(Math.abs(bs[0]!.x - bs[1]!.x)).toBeLessThan(20)   // hai tia chụm vào một điểm
      const beh = t.mobiles['bo-loi']!.shots[1].behavior
      if (beh.kind !== 'lightning' || !beh.aftershock) throw new Error()
      const d = damages(r, 2)
      expect(d.filter(e => e.amount === beh.aftershock!.damage)).toHaveLength(1)
      expect(d.length).toBeGreaterThanOrEqual(2)
    })

    it('có đất che phía trên thì sét đánh vào đất, không trúng xe nằm dưới', () => {
      const ex = landing(0)
      const roof = world()
      for (let y = GROUND - 330; y < GROUND - 300; y++) for (let x = Math.round(ex.x) - 260; x < Math.round(ex.x) + 260; x++) roof.data[y * W + x] = 1
      const r = fireBo(0, [veh(2, ex.x)], roof)
      const [b] = bolts(r)
      expect(b).toBeDefined()
      expect(b!.y).toBeLessThan(GROUND - 290)            // sét dừng ở mái
      expect(damages(r, 2)).toHaveLength(0)
    })

    it('SS: mọi xe trong vùng (trừ người bắn) bị một tia riêng, xe ngoài vùng thì không', () => {
      const ex = landing(2)
      const beh = t.mobiles['bo-loi']!.shots[2].behavior
      if (beh.kind !== 'lightning' || !beh.area) throw new Error('SS Bọ Lôi phải là sét vùng')
      const near1 = veh(2, ex.x - 150, { hp: 5000 }), near2 = veh(3, ex.x + 200, { hp: 5000 }), far = veh(4, ex.x + beh.area.radius + 400, { hp: 5000 })
      const r = fireBo(2, [near1, near2, far])
      expect(bolts(r)).toHaveLength(2)
      expect(damages(r, 2).some(e => e.amount >= beh.area!.damage * 0.9)).toBe(true)
      expect(damages(r, 3).some(e => e.amount >= beh.area!.damage * 0.9)).toBe(true)
      expect(damages(r, 4)).toHaveLength(0)
      expect(damages(r, 1)).toHaveLength(0)              // người bắn không bị
    })
  })

  it('armorBreak: đạn có armorBreak thì trúng xe sinh sự kiện giảm giáp', () => {
    const shotDef: ShotDef = { name: 't', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 60, carveRadius: 35, damage: 350, delay: 0, behavior: { kind: 'basic' }, armorBreak: { turns: 2, amount: 0.25 } }
    const ex = explodes(simulateShot(input({ shotDef })))[0]!
    const r = simulateShot(input({ vehicles: [veh(1, 200), veh(2, ex.x + 5)], shotDef }))
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
