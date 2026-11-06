import { describe, expect, it } from 'vitest'
import { TerrainMask } from './terrain/mask'
import { simulateShot } from './shot/simulateShot'
import type { ShotResult, ShotVehicle } from './shot/types'
import type { ShotSlot } from './shots'
import { createDefaultTuning } from './tuning'
import { WEATHER_KINDS, defaultWeatherTuning, weatherForTurn, type Weather } from './weather'

const W = 2400, H = 1200, G = 800
const tuning = createDefaultTuning()
function flat(): TerrainMask {
  const m = new TerrainMask(W, H)
  for (let y = G; y < H; y++) m.data.fill(1, y * W, (y + 1) * W)
  return m
}
const veh = (id: number, mobileId: string, x: number, hp = 100): ShotVehicle => ({ id, mobileId, x, y: G - 18, radius: 18, hp, armor: 0 })
function shoot(mobile: string, slot: ShotSlot, angle: number, power: number, opts: { mask?: TerrainMask; wind?: { x: number; y: number }; weather?: Weather | null; others?: ShotVehicle[] } = {}): ShotResult {
  return simulateShot({
    mask: opts.mask ?? flat(), vehicles: [veh(0, mobile, 400), ...(opts.others ?? [])], wind: opts.wind ?? { x: 0, y: 0 },
    shooterId: 0, facing: 1, tilt: 0, fire: { angle, power, slot }, weather: opts.weather ?? null,
  }, tuning)
}
const firstExplode = (r: ShotResult): { x: number; y: number } => r.events.find(e => e.kind === 'explode') as { x: number; y: number }

describe('Cua Lăn (roller)', () => {
  it('lăn tiếp sau khi chạm đất rồi mới nổ', () => {
    const r = shoot('cua-lan', 0, 30, 60)
    const path = r.paths[0]!
    let landX = 0
    for (let i = 0; i < path.length; i += 3) if (path[i + 2]! >= G - 8) { landX = path[i + 1]!; break }
    const ex = firstExplode(r)
    expect(landX).toBeGreaterThan(400)
    expect(ex.x - landX).toBeGreaterThan(180)
  })
  it('gặp vách cao thì nổ ngay trước vách', () => {
    const m = flat()
    for (let y = G - 120; y < G; y++) for (let x = 1000; x < 1040; x++) m.data[y * W + x] = 1
    const r = shoot('cua-lan', 0, 20, 45, { mask: m })
    expect(firstExplode(r).x).toBeLessThan(1000)
  })
  it('trúng xe đang đứng trên đường lăn', () => {
    const r = shoot('cua-lan', 0, 25, 50, { others: [veh(1, 'oc-thiet-giap', 1000)] })
    expect(r.events.some(e => e.kind === 'damage' && e.id === 1)).toBe(true)
  })
})

describe('Nhím Chùm (spread)', () => {
  it('bắn cùng lúc 5 quả tỏa quạt', () => {
    const r = shoot('nhim-chum', 0, 45, 60)
    expect(r.paths).toHaveLength(5)
    const ends = r.paths.map(p => p[p.length - 2]!)
    expect(new Set(ends.map(Math.round)).size).toBe(5)
  })
})

describe('Sứa Đèn (pierce)', () => {
  const wall = (thick: number): TerrainMask => {
    const m = flat()
    for (let y = 300; y < G; y++) for (let x = 900; x < 900 + thick; x++) m.data[y * W + x] = 1
    return m
  }
  it('xuyên vách mỏng, bị chặn bởi vách dày; đạn thường bị chặn cả hai', () => {
    const thin = shoot('sua-den', 0, 30, 80, { mask: wall(20) })
    const thick = shoot('sua-den', 0, 30, 80, { mask: wall(200) })
    const basic = shoot('oc-thiet-giap', 0, 30, 75, { mask: wall(20) })
    expect(firstExplode(thin).x).toBeGreaterThan(930)
    expect(firstExplode(thick).x).toBeLessThan(1100)
    expect(firstExplode(basic).x).toBeLessThan(930)
  })
})

describe('Rùa Thành (build)', () => {
  it('đắp thêm đất, không khoét; không đắp khi chạm xe', () => {
    const m = flat()
    const before = m.countSolid()
    const r = shoot('rua-thanh', 1, 50, 50, { mask: m })
    expect(r.events.some(e => e.kind === 'fill')).toBe(true)
    expect(r.events.some(e => e.kind === 'carve')).toBe(false)
    expect(r.maskAfter.countSolid()).toBeGreaterThan(before)
    const ex = firstExplode(r)
    const target = veh(1, 'oc-thiet-giap', ex.x)
    const r2 = shoot('rua-thanh', 1, 50, 50, { mask: flat(), others: [target] })
    for (const e of r2.events) if (e.kind === 'fill') expect(Math.hypot(target.x - e.x, target.y - e.y)).toBeGreaterThanOrEqual(e.r + target.radius + 3)
  })
  it('client phát lại fill cho cùng mask như server', () => {
    const r = shoot('rua-thanh', 2, 50, 55)
    const replay = flat()
    for (const e of r.events) {
      if (e.kind === 'carve') replay.carveCircle(e.x, e.y, e.r)
      else if (e.kind === 'fill') replay.fillCircle(e.x, e.y, e.r)
    }
    expect(replay.hash()).toBe(r.terrainHashAfter)
  })
})

describe('Diều Hâu Giấy (gió ngược)', () => {
  it('gió ngược chiều bắn thì bay xa hơn gió thuận chiều', () => {
    const head = firstExplode(shoot('dieu-hau-giay', 0, 45, 60, { wind: { x: -12, y: 0 } })).x
    const tail = firstExplode(shoot('dieu-hau-giay', 0, 45, 60, { wind: { x: 12, y: 0 } })).x
    expect(head).toBeGreaterThan(tail)
  })
})

describe('thời tiết', () => {
  const t = defaultWeatherTuning()
  it('xác định theo seed+lượt; chance 0 thì không bao giờ có; chance 1 thì đủ 4 loại', () => {
    expect(weatherForTurn(5, 3, W, H, t)).toEqual(weatherForTurn(5, 3, W, H, t))
    for (let i = 1; i < 50; i++) expect(weatherForTurn(9, i, W, H, { ...t, chance: 0 })).toBeNull()
    const kinds = new Set<string>()
    for (let i = 1; i < 200; i++) kinds.add(weatherForTurn(9, i, W, H, { ...t, chance: 1 })!.kind)
    expect([...kinds].sort()).toEqual([...WEATHER_KINDS].sort())
  })
  const base: Weather = { kind: 'whirl', x: 1200, y: 600, hw: 5000, hh: 0, x2: 0, y2: 0 }
  it('Cột lốc nâng đạn lên cao hơn', () => {
    const apex = (r: ShotResult): number => Math.min(...r.paths[0]!.filter((_, i) => i % 3 === 2))
    expect(apex(shoot('oc-thiet-giap', 0, 45, 60, { weather: base }))).toBeLessThan(apex(shoot('oc-thiet-giap', 0, 45, 60)) - 50)
  })
  it('Gương nước đảo chiều gió', () => {
    const mirror = shoot('oc-thiet-giap', 0, 45, 60, { wind: { x: 15, y: 0 }, weather: { ...base, kind: 'mirror' } })
    const reversed = shoot('oc-thiet-giap', 0, 45, 60, { wind: { x: -15, y: 0 } })
    expect(firstExplode(mirror).x).toBeCloseTo(firstExplode(reversed).x, 3)
  })
  it('Mây giông gọi sét xuống khi đạn đi qua', () => {
    const r = shoot('oc-thiet-giap', 0, 60, 70, { weather: { ...base, kind: 'storm', y: 400, hh: 400 } })
    expect(r.events.some(e => e.kind === 'bolt')).toBe(true)
  })
  it('Cổng đôi: đạn vào cổng A thì ra cổng B (thêm một đường bay)', () => {
    const A = { x: 0, y: 0 }
    let found: [number, number] | null = null
    for (let a = 30; a <= 80 && !found; a += 2) for (let p = 40; p <= 60 && !found; p += 2) {
      const r = shoot('oc-thiet-giap', 0, a, p)
      const path = r.paths[0]!
      for (let i = 0; i < path.length; i += 3) if (Math.abs(path[i + 1]! - 650) < 6 && path[i + 2]! < 700) { found = [a, p]; A.x = path[i + 1]!; A.y = path[i + 2]!; break }
    }
    expect(found).not.toBeNull()
    const portal: Weather = { kind: 'portal', x: A.x, y: A.y, hw: 38, hh: 0, x2: 1300, y2: 400 }
    const r = shoot('oc-thiet-giap', 0, found![0], found![1], { weather: portal })
    expect(r.paths).toHaveLength(2)
    expect(firstExplode(r).x).toBeGreaterThan(1150)
  })
})

describe('hướng gió', () => {
  it('gió +x đẩy đạn sang phải ở mọi pháo có windFactor dương, bắn trái hay phải; chỉ pháo windFactor âm mới ngược', () => {
    for (const def of Object.values(tuning.mobiles)) {
      for (const facing of [1, -1] as const) {
        const land = (wx: number): number => {
          const r = simulateShot({ mask: flat(), vehicles: [{ ...veh(0, def.id, facing === 1 ? 600 : 1800) }], wind: { x: wx, y: 0 }, shooterId: 0, facing, tilt: 0, fire: { angle: 45, power: 60, slot: 0 } }, tuning)
          return firstExplode(r).x
        }
        const pushedRight = land(15) > land(-15)
        expect(pushedRight, `${def.id} facing ${facing}`).toBe(def.shots[0].windFactor > 0)
      }
    }
  })
})
