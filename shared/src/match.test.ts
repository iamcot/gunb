import { describe, expect, it } from 'vitest'
import { TerrainMask } from './terrain/mask'
import { applyAction, createMatch, currentPlayer, isSettled, type MatchState } from './match'
import { createDefaultTuning } from './tuning'

const W = 2400, H = 1200, G = 800
function flat(): TerrainMask {
  const m = new TerrainMask(W, H)
  for (let y = G; y < H; y++) m.data.fill(1, y * W, (y + 1) * W)
  return m
}
const zones = { A: { x1: 100, x2: 600 }, B: { x1: 1800, x2: 2300 } }
function make(n = 4, seed = 7): { s: MatchState; mask: TerrainMask } {
  const mask = flat()
  const players = Array.from({ length: n }, (_, i) => ({ name: `P${i}`, team: (i % 2) as 0 | 1 }))
  return { s: createMatch({ seed, mask, spawnZones: zones, players }), mask }
}

describe('createMatch', () => {
  it('xuất phát đúng vùng từng đội, trên mặt đất, cách nhau', () => {
    const { s } = make(8)
    for (const p of s.players) {
      const z = p.team === 0 ? zones.A : zones.B
      expect(p.body.x).toBeGreaterThanOrEqual(z.x1)
      expect(p.body.x).toBeLessThanOrEqual(z.x2)
      expect(p.body.y + p.body.radius).toBe(G)
      expect(p.body.facing).toBe(p.team === 0 ? 1 : -1)
    }
    for (const team of [0, 1]) {
      const xs = s.players.filter(p => p.team === team).map(p => p.body.x).sort((a, b) => a - b)
      for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(70)
    }
  })
  it('ưu tiên chỗ xuất phát không dốc quá 30° khi có chỗ phẳng', () => {
    const mask = flat()
    // nửa vùng đội A (x 100..350) dựng sườn dốc 60°, nửa còn lại phẳng
    for (let x = 100; x < 350; x++) { const top = Math.round(G - (x - 100) * 1.7); for (let y = Math.max(0, top); y < G; y++) mask.data[y * W + x] = 1 }
    for (const seed of [1, 2, 3, 4, 5]) {
      const s = createMatch({ seed, mask, spawnZones: zones, players: [{ name: 'a', team: 0 }, { name: 'b', team: 1 }, { name: 'c', team: 0 }, { name: 'd', team: 1 }] })
      for (const p of s.players) expect(Math.abs(p.body.tilt)).toBeLessThanOrEqual((30 * Math.PI) / 180 + 1e-9)
    }
  })
  it('cùng seed ra cùng trận; người đầu tiên là id 0 và có nhiên liệu', () => {
    expect(make(4, 3).s).toEqual(make(4, 3).s)
    const { s } = make()
    expect(s.turnPlayerId).toBe(0)
    expect(currentPlayer(s).body.fuel).toBeGreaterThan(0)
  })
})

describe('applyAction', () => {
  it('từ chối hành động của người không phải lượt', () => {
    const { s, mask } = make()
    expect(applyAction(s, { t: 'fire', id: 1, angle: 45, power: 50, shotType: 'basic' }, { mask }).ok).toBe(false)
    expect(applyAction(s, { t: 'move', id: 2, dir: 1, dt: 0.1 }, { mask }).ok).toBe(false)
    expect(s.phase).toBe('aiming')
  })

  it('đi tốn nhiên liệu và cộng delay; bắn xong chuyển pha resolving, endTurn đổi người', () => {
    const { s, mask } = make()
    const t = createDefaultTuning()
    const p = currentPlayer(s)
    const x0 = p.body.x
    for (let i = 0; i < 30; i++) applyAction(s, { t: 'move', id: p.id, dir: 1, dt: 1 / 60 }, { mask })
    expect(p.body.x).toBeGreaterThan(x0)
    expect(p.body.fuel).toBeLessThan(t.move.fuelPerTurn)
    expect(p.delay).toBeCloseTo((p.body.x - x0) * t.move.delayPerPx, 3)
    const r = applyAction(s, { t: 'fire', id: p.id, angle: 45, power: 60, shotType: 'basic' }, { mask })
    expect(r.ok).toBe(true)
    expect(r.shot).toBeDefined()
    expect(s.phase).toBe('resolving')
    expect(applyAction(s, { t: 'fire', id: p.id, angle: 45, power: 60, shotType: 'basic' }, { mask }).ok).toBe(false)
    expect(applyAction(s, { t: 'endTurn' }, { mask }).ok).toBe(true)
    expect(s.phase).toBe('aiming')
    expect(s.turnPlayerId).not.toBe(p.id)
    expect(s.turnNo).toBe(2)
  })

  it('người vừa dùng đạn delay lớn đi sau những người chưa đi', () => {
    const { s, mask } = make()
    const ids: number[] = []
    for (let i = 0; i < 4; i++) {
      ids.push(s.turnPlayerId)
      applyAction(s, { t: 'fire', id: s.turnPlayerId, angle: 80, power: 20, shotType: 'basic' }, { mask })
      applyAction(s, { t: 'endTurn' }, { mask })
    }
    expect(new Set(ids).size).toBe(4)
  })

  it('hết giờ: tick đưa sang resolving, cộng delay phạt; skip tương tự', () => {
    const { s, mask } = make()
    const t = createDefaultTuning()
    const id = s.turnPlayerId
    let timed = false
    for (let i = 0; i < 60 * 25 && !timed; i++) timed = applyAction(s, { t: 'tick', dt: 1 / 60 }, { mask }).timedOut === true
    expect(timed).toBe(true)
    expect(s.players[id]!.delay).toBe(t.turn.timeoutPenalty)
    expect(s.phase).toBe('resolving')
    applyAction(s, { t: 'endTurn' }, { mask })
    const id2 = s.turnPlayerId
    expect(applyAction(s, { t: 'skip', id: id2 }, { mask }).ok).toBe(true)
    expect(s.players[id2]!.delay).toBe(t.turn.timeoutPenalty)
  })

  it('bắn trúng làm đối thủ mất máu và mask đổi; hết người một đội thì kết thúc trận', () => {
    const { s, mask } = make(2)
    const shooter = s.players[0]!, target = s.players[1]!
    // đặt mục tiêu sát chỗ đạn rơi: lấy điểm rơi từ bắn thử trên bản sao
    const probe = make(2).s
    const probeMask = flat()
    const res = applyAction(probe, { t: 'fire', id: 0, angle: 45, power: 70, shotType: 'basic' }, { mask: probeMask })
    const ex = res.shot!.events.find(e => e.kind === 'explode')!
    if (ex.kind !== 'explode') throw new Error()
    target.body.x = ex.x
    target.hp = 10
    const before = mask.hash()
    applyAction(s, { t: 'fire', id: shooter.id, angle: 45, power: 70, shotType: 'basic' }, { mask })
    expect(target.hp).toBe(0)
    expect(target.body.alive).toBe(false)
    expect(mask.hash()).not.toBe(before)
    applyAction(s, { t: 'endTurn' }, { mask })
    expect(s.phase).toBe('ended')
    expect(s.winner).toBe(0)
    expect(applyAction(s, { t: 'tick', dt: 0.1 }, { mask }).ok).toBe(false)
  })

  it('xe mất đất dưới chân sẽ rơi khi tick; isSettled báo đúng', () => {
    const { s, mask } = make()
    const p = s.players[0]!
    mask.carveCircle(p.body.x, G, 100)
    applyAction(s, { t: 'tick', dt: 1 / 60 }, { mask })
    expect(isSettled(s)).toBe(false)
    for (let i = 0; i < 60 * 3 && !isSettled(s); i++) applyAction(s, { t: 'tick', dt: 1 / 60 }, { mask })
    expect(isSettled(s)).toBe(true)
    expect(p.hp).toBeLessThan(p.maxHp)
  })
})
