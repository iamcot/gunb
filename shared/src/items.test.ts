import { describe, expect, it } from 'vitest'
import { TerrainMask } from './terrain/mask'
import { applyAction, createMatch, currentPlayer, isSettled, windForRound, type MatchState } from './match'
import { applySnapshot, snapshotOf } from './netState'
import { createDefaultTuning } from './tuning'
import { sanitizeItems, type ItemId } from './items'
import { BotDriver, type BotCmd } from './bot'

const W = 2400, H = 1200, G = 800
function flat(): TerrainMask {
  const m = new TerrainMask(W, H)
  for (let y = G; y < H; y++) m.data.fill(1, y * W, (y + 1) * W)
  return m
}
const zones = { A: { x1: 100, x2: 600 }, B: { x1: 1800, x2: 2300 } }
function make(items: ItemId[] = ['dual', 'heal', 'teleport'], seed = 7): { s: MatchState; mask: TerrainMask } {
  const mask = flat()
  const players = [0, 1].map(i => ({ name: `P${i}`, team: i as 0 | 1, mobileId: 'oc-thiet-giap', items }))
  return { s: createMatch({ seed, mask, spawnZones: zones, players }), mask }
}
const tuning = createDefaultTuning()

/** Tick pha resolving tới khi mọi xe đứng yên (giống server sau khi phát lại xong). */
function settle(s: MatchState, mask: TerrainMask): void {
  for (let i = 0; i < 600; i++) { applyAction(s, { t: 'tick', dt: 1 / 30 }, { mask }); if (!s.pendingTeleport && isSettled(s)) break }
}

describe('item', () => {
  it('mang item vào trận theo ô, ô thừa để trống; sanitizeItems lọc id lạ và cắt còn 3', () => {
    const { s } = make(['heal'])
    expect(s.players[0]!.items).toEqual(['heal', null, null])
    expect(sanitizeItems(['heal', 'xx', 'dual', 'dual', 'fastTurn', 5])).toEqual(['heal', 'dual', 'dual'])
    expect(sanitizeItems('heal')).toEqual([])
  })

  it('Hồi máu: không quá máu tối đa, cộng delay, ô đã dùng thành trống, mỗi lượt chỉ 1 item', () => {
    const { s, mask } = make(['heal', 'heal', 'dual'])
    const p = currentPlayer(s)
    p.hp = p.maxHp - 10
    const d0 = p.delay
    expect(applyAction(s, { t: 'item', id: p.id, slot: 0 }, { mask }).ok).toBe(true)
    expect(p.hp).toBe(p.maxHp)
    expect(p.delay).toBe(d0 + tuning.items.heal.delay)
    expect(p.items[0]).toBeNull()
    expect(s.turnItem).toBe('heal')
    expect(applyAction(s, { t: 'item', id: p.id, slot: 1 }, { mask }).ok).toBe(false)      // đã dùng 1 item lượt này
    expect(applyAction(s, { t: 'item', id: 1, slot: 0 }, { mask }).ok).toBe(false)         // không phải lượt
  })

  it('ô trống / ô đã dùng thì không dùng được; sang lượt mới được dùng tiếp', () => {
    const { s, mask } = make(['heal'])
    const p = currentPlayer(s)
    expect(applyAction(s, { t: 'item', id: p.id, slot: 1 }, { mask }).ok).toBe(false)
    expect(applyAction(s, { t: 'item', id: p.id, slot: 0 }, { mask }).ok).toBe(true)
    applyAction(s, { t: 'skip', id: p.id }, { mask })
    applyAction(s, { t: 'endTurn' }, { mask })
    expect(s.turnItem).toBeNull()
    expect(applyAction(s, { t: 'item', id: s.turnPlayerId, slot: 0 }, { mask }).ok).toBe(true)
  })

  it('Lá chắn gió: gió lượt này về 0; Đổi lượt nhanh: giảm delay', () => {
    const a = make(['windShield'])
    applyAction(a.s, { t: 'item', id: 0, slot: 0 }, { mask: a.mask })
    expect(a.s.wind).toEqual({ x: 0, y: 0 })
    // lượt sau (cùng vòng) gió về như cũ của vòng
    applyAction(a.s, { t: 'skip', id: 0 }, { mask: a.mask })
    applyAction(a.s, { t: 'endTurn' }, { mask: a.mask })
    expect(a.s.roundNo).toBe(1)
    expect(a.s.wind).toEqual(windForRound(a.s.seed, 1))
    const b = make(['fastTurn'])
    const d0 = currentPlayer(b.s).delay
    applyAction(b.s, { t: 'item', id: 0, slot: 0 }, { mask: b.mask })
    expect(currentPlayer(b.s).delay).toBe(d0 + tuning.items.fastTurn.delay)
    expect(tuning.items.fastTurn.delay).toBeLessThan(0)
  })

  it('Bắn 2 lần: hai phát nối tiếp trong một ShotResult (phát sau trễ hơn), sát thương cộng dồn, không dùng với SS', () => {
    const one = make()
    const two = make()
    two.s.players[0]!.ss = 100
    applyAction(two.s, { t: 'item', id: 0, slot: 0 }, { mask: two.mask })
    expect(applyAction(two.s, { t: 'fire', id: 0, angle: 45, power: 70, slot: 2 }, { mask: two.mask }).ok).toBe(false)
    const r1 = applyAction(one.s, { t: 'fire', id: 0, angle: 45, power: 70, slot: 0 }, { mask: one.mask }).shot!
    const r2 = applyAction(two.s, { t: 'fire', id: 0, angle: 45, power: 70, slot: 0 }, { mask: two.mask }).shot!
    expect(r2.paths.length).toBe(r1.paths.length * 2)
    expect(r2.endT).toBeGreaterThan(r1.endT * 2)
    expect(r2.paths[r1.paths.length]![0]).toBeGreaterThan(r1.endT)
    expect(r2.terrainHashAfter).toBe(two.mask.hash())
    expect(r2.events.filter(e => e.kind === 'explode').length).toBe(2 * r1.events.filter(e => e.kind === 'explode').length)
    expect(two.s.players[0]!.delay).toBe(one.s.players[0]!.delay + tuning.items.dual.delay)
  })

  it('Dịch chuyển: không nổ, không khoét đất; xe chỉ tới chỗ mới khi bắt đầu tick pha resolving rồi đứng trên đất', () => {
    const { s, mask } = make(['teleport'])
    const hash0 = mask.hash()
    const p = currentPlayer(s)
    const x0 = p.body.x
    applyAction(s, { t: 'item', id: p.id, slot: 0 }, { mask })
    const r = applyAction(s, { t: 'fire', id: p.id, angle: 45, power: 60, slot: 0 }, { mask }).shot!
    expect(r.events.some(e => e.kind === 'explode' || e.kind === 'carve' || e.kind === 'damage')).toBe(false)
    const tp = r.events.find(e => e.kind === 'teleport')!
    expect(tp).toBeDefined()
    expect(mask.hash()).toBe(hash0)
    expect(p.body.x).toBe(x0)              // chưa nhảy trong lúc phát lại
    settle(s, mask)
    expect(Math.abs(p.body.x - (tp as { x: number }).x)).toBeLessThanOrEqual(1)
    expect(p.body.y + p.body.radius).toBeCloseTo(G, 0)
    expect(p.hp).toBe(p.maxHp)             // không mất máu vì rơi
  })

  it('snapshot mang ô item + item lượt này', () => {
    const srv = make(['heal', 'dual'])
    applyAction(srv.s, { t: 'item', id: 0, slot: 1 }, { mask: srv.mask })
    const cli = make(['heal', 'dual'])
    applySnapshot(cli.s, structuredClone(snapshotOf(srv.s)))
    expect(cli.s.players[0]!.items).toEqual(['heal', null, null])
    expect(cli.s.turnItem).toBe('dual')
  })

  it('máy dùng Hồi máu đầu lượt khi đã mất đủ máu', () => {
    const { s, mask } = make(['heal', 'windShield', 'dual'])
    const p = currentPlayer(s)
    p.hp = p.maxHp - 50
    const bot = new BotDriver('easy')
    const cmd: BotCmd = { angle: 45, dir: 0, fire: false, power: 0, slot: 0, item: -1 }
    bot.step(s, mask, tuning, 1 / 30, cmd)
    expect(cmd.item).toBe(0)
    applyAction(s, { t: 'item', id: p.id, slot: cmd.item }, { mask, tuning })
    bot.step(s, mask, tuning, 1 / 30, cmd)
    expect(cmd.item).toBe(-1)
  })
})
