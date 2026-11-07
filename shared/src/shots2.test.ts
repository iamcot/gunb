import { describe, expect, it } from 'vitest'
import { TerrainMask } from './terrain/mask'
import { simulateShot } from './shot/simulateShot'
import type { ShotResult, ShotVehicle } from './shot/types'
import type { ShotSlot } from './shots'
import { createDefaultTuning } from './tuning'
import { WEATHER_KINDS, defaultWeatherTuning, weatherForRound, type Weather } from './weather'

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
    const r = shoot('cua-lan', 1, 30, 60)
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
    const r = shoot('cua-lan', 1, 20, 45, { mask: m })
    expect(firstExplode(r).x).toBeLessThan(1000)
  })
  it('trúng xe đang đứng trên đường lăn', () => {
    const r = shoot('cua-lan', 1, 25, 50, { others: [veh(1, 'oc-thiet-giap', 1000)] })
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
    const thin = shoot('sua-den', 2, 30, 80, { mask: wall(20) })
    const thick = shoot('sua-den', 2, 30, 80, { mask: wall(200) })
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
    const r = shoot('rua-thanh', 2, 50, 50, { mask: m })
    expect(r.events.some(e => e.kind === 'fill')).toBe(true)
    expect(r.events.some(e => e.kind === 'carve')).toBe(false)
    expect(r.maskAfter.countSolid()).toBeGreaterThan(before)
    const ex = firstExplode(r)
    const target = veh(1, 'oc-thiet-giap', ex.x)
    const r2 = shoot('rua-thanh', 2, 50, 50, { mask: flat(), others: [target] })
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

describe('Cú Thiên Văn (satellite)', () => {
  type BeamEv = Extract<ShotResult['events'][number], { kind: 'beam' }>
  const beamsOf = (r: ShotResult): BeamEv[] => r.events.filter(e => e.kind === 'beam') as BeamEv[]
  it('đạn 1: vệ tinh trên đầu xe bắn tia chéo qua điểm nổ, đốt vào đất', () => {
    const r = shoot('cu-thien-van', 0, 45, 60)
    const ex = firstExplode(r) as { t: number; x: number; y: number }
    const b = beamsOf(r)
    expect(b).toHaveLength(1)
    const e = b[0]!
    expect(e.sky).toBe(false)
    expect(e.x0).toBe(400)                     // ngay trên đầu xe bắn
    expect(e.y0).toBe(G - 18 - 400)           // vệ tinh bay theo cao 400 px trên tâm xe
    expect(e.t - ex.t).toBeCloseTo(0.5, 1)
    // điểm cuối nằm trên đường thẳng (x0, y0) → điểm nổ, phía sau điểm nổ
    const cross = (ex.x - e.x0) * (e.y - e.y0) - (ex.y - e.y0) * (e.x - e.x0)
    expect(Math.abs(cross) / Math.hypot(e.x - e.x0, e.y - e.y0)).toBeLessThan(1.5)
    expect(e.y).toBeGreaterThan(ex.y)
    expect(e.x).toBeGreaterThan(ex.x)
  })
  it('SS: từ tận trời thẳng đứng xuống cột điểm nổ', () => {
    const r = shoot('cu-thien-van', 2, 45, 60)
    const ex = firstExplode(r)
    const e = beamsOf(r)[0]!
    expect(e.sky).toBe(true)
    expect(e.x).toBe(ex.x)
    expect(e.y).toBeGreaterThan(G)
    expect(e.y).toBeLessThanOrEqual(G + 110)        // cầu sáng không khoét, tia đốt sâu 110 từ mặt đất
  })
  it('cầu sáng không gây sát thương, không khoét đất: chỉ laser mới gây sát thương', () => {
    for (const slot of [0, 1, 2] as const) {
      const x = firstExplode(shoot('cu-thien-van', slot, 45, 60)).x
      const r = shoot('cu-thien-van', slot, 45, 60, { others: [veh(1, 'oc-thiet-giap', x + 5)] })
      const beamTs = new Set(beamsOf(r).map(e => e.t))
      const dmg = r.events.filter(e => e.kind === 'damage')
      expect(dmg.length).toBeGreaterThan(0)
      for (const e of dmg) expect(beamTs.has(e.t)).toBe(true)
      const ex = r.events.find(e => e.kind === 'explode')!
      expect(r.events.some(e => e.kind === 'carve' && e.t === ex.t)).toBe(false)
    }
  })
  it('laser trúng xe nằm trên tia; lệch xa khỏi tia thì trượt', () => {
    const x = firstExplode(shoot('cu-thien-van', 0, 45, 60)).x
    const hit = shoot('cu-thien-van', 0, 45, 60, { others: [veh(1, 'oc-thiet-giap', x + 10)] })
    const beamT = beamsOf(hit)[0]!.t
    expect(hit.events.some(e => e.kind === 'damage' && e.id === 1 && e.t === beamT)).toBe(true)
    const miss = shoot('cu-thien-van', 0, 45, 60, { others: [veh(1, 'oc-thiet-giap', x + 120)] })
    expect(miss.events.some(e => e.kind === 'damage' && e.id === 1)).toBe(false)
  })
  it('SS xuyên qua mái đất phía trên để trúng xe bên dưới (nếu mái mỏng hơn depth)', () => {
    const m = flat()
    for (let y = 500; y < 520; y++) for (let x = 600; x < 2000; x++) m.data[y * W + x] = 1   // mái dày 20 px
    const x0 = firstExplode(shoot('cu-thien-van', 2, 60, 70, { mask: m })).x
    const target = veh(1, 'oc-thiet-giap', x0)                // xe đứng dưới mái, ngay dưới điểm cầu sáng nổ
    const found = shoot('cu-thien-van', 2, 60, 70, { mask: m, others: [target] })
    expect(firstExplode(found).y).toBeLessThan(530)
    expect(found.events.some(e => e.kind === 'damage' && e.id === 1 && e.amount > 40)).toBe(true)
  })
  it('Ba tia: 3 tia cùng từ vệ tinh trên đầu xe, nhắm lệch nhau, cách nhau interval', () => {
    const b = beamsOf(shoot('cu-thien-van', 1, 45, 60))
    expect(b).toHaveLength(3)
    expect(new Set(b.map(e => `${e.x0},${e.y0}`)).size).toBe(1)
    expect(b[1]!.x).toBeGreaterThan(b[0]!.x)
    expect(b[2]!.x).toBeLessThan(b[0]!.x)
    expect(b[1]!.t - b[0]!.t).toBeCloseTo(0.15, 1)
  })
  it('client phát lại carve của laser ra cùng mask như server', () => {
    for (const slot of [0, 1, 2] as const) {
      const r = shoot('cu-thien-van', slot, 50, 55)
      const replay = flat()
      for (const e of r.events) if (e.kind === 'carve') replay.carveCircle(e.x, e.y, e.r)
      expect(replay.hash()).toBe(r.terrainHashAfter)
    }
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
    expect(weatherForRound(5, 3, W, H, t)).toEqual(weatherForRound(5, 3, W, H, t))
    for (let i = 1; i < 50; i++) expect(weatherForRound(9, i, W, H, { ...t, chance: 0 })).toBeNull()
    const kinds = new Set<string>()
    for (let i = 1; i < 200; i++) kinds.add(weatherForRound(9, i, W, H, { ...t, chance: 1 })!.kind)
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

describe('airGrow (Ốc SS, Diều SS)', () => {
  const grownBlast = (r: ShotResult): number => (r.events.find(e => e.kind === 'explode') as { r: number }).r
  it('bay đủ lâu thì lớn lên: phát ra event grow, vụ nổ và sát thương lớn hơn', () => {
    const b = tuning.mobiles['oc-thiet-giap']!.shots[2].behavior
    if (b.kind !== 'airGrow') throw new Error('Ốc SS phải là airGrow')
    const long = shoot('oc-thiet-giap', 2, 45, 100)   // ~2,7 s
    const short = shoot('oc-thiet-giap', 2, 30, 40)   // ~0,9 s
    expect(long.events.some(e => e.kind === 'grow' && e.shell === 0)).toBe(true)
    expect(short.events.some(e => e.kind === 'grow')).toBe(false)
    expect(grownBlast(long)).toBeCloseTo(grownBlast(short) * b.blastMul, 5)
  })
  it('sát thương nhân damageMul khi trúng xe sau khi lớn lên', () => {
    const b = tuning.mobiles['dieu-hau-giay']!.shots[2].behavior
    if (b.kind !== 'airGrow') throw new Error('Diều SS phải là airGrow')
    const base = tuning.mobiles['dieu-hau-giay']!.shots[2].damage
    // đặt xe đúng chỗ rơi để trúng sát tâm
    const probe = shoot('dieu-hau-giay', 2, 60, 100)
    const ex = firstExplode(probe)
    const hit = shoot('dieu-hau-giay', 2, 60, 100, { others: [{ ...veh(1, 'oc-thiet-giap', ex.x), hp: 5000 }] })
    const dmg = hit.events.find(e => e.kind === 'damage' && e.id === 1) as { amount: number } | undefined
    expect(dmg).toBeDefined()
    expect(dmg!.amount).toBeGreaterThan(base * 1.5)
    expect(dmg!.amount).toBeLessThanOrEqual(Math.round(base * b.damageMul))
  })
  it('chưa đủ giờ thì sát thương và bán kính bằng thông số gốc', () => {
    const base = tuning.mobiles['oc-thiet-giap']!.shots[2]
    expect(grownBlast(shoot('oc-thiet-giap', 2, 30, 40))).toBe(base.blastRadius)
  })
})

describe('twin (Sứa Đèn đ2, Rùa Thành đ2, Cua Lăn đ1)', () => {
  const maxOffset = (path: number[], other: number[]): number => {
    let m = 0
    for (let i = 0; i < Math.min(path.length, other.length); i += 3) m = Math.max(m, Math.hypot(path[i + 1]! - other[i + 1]!, path[i + 2]! - other[i + 2]!))
    return m
  }
  it('Sứa Đèn đ2: 2 viên xoắn rộng ra rồi chụm lại, mỗi viên một vụ nổ có sát thương riêng', () => {
    const r = shoot('sua-den', 1, 45, 80)
    expect(r.paths).toHaveLength(2)
    expect(maxOffset(r.paths[0]!, r.paths[1]!)).toBeGreaterThan(30)
    const a = r.paths[0]!, b = r.paths[1]!
    // gần thời điểm chụm (1,6 s) hai viên gần như trùng nhau
    for (let i = 0; i < Math.min(a.length, b.length); i += 3) if (Math.abs(a[i]! - 1.6) < 0.02) expect(Math.hypot(a[i + 1]! - b[i + 1]!, a[i + 2]! - b[i + 2]!)).toBeLessThan(8)
    expect(r.events.filter(e => e.kind === 'explode')).toHaveLength(2)
  })
  it('đứng đúng chỗ chụm thì bị trúng (ít nhất một viên)', () => {
    const probe = shoot('sua-den', 1, 45, 80)
    const ex = firstExplode(probe)
    const target = veh(1, 'oc-thiet-giap', ex.x, 5000)
    const r = shoot('sua-den', 1, 45, 80, { others: [target] })
    const hits = r.events.filter(e => e.kind === 'damage' && e.id === 1)
    expect(hits.length).toBeGreaterThanOrEqual(1)
  })
  it('Cua Lăn đ1 có 3 viên, Rùa Thành đ2 có 2 viên', () => {
    expect(shoot('cua-lan', 0, 45, 70).paths).toHaveLength(3)
    expect(shoot('rua-thanh', 1, 50, 60).paths).toHaveLength(2)
  })
  it('deterministic', () => {
    const a = shoot('cua-lan', 0, 40, 65), b = shoot('cua-lan', 0, 40, 65)
    expect(JSON.stringify(a.paths)).toBe(JSON.stringify(b.paths))
  })
})
