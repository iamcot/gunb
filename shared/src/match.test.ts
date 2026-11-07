import { describe, expect, it } from 'vitest'
import { TerrainMask } from './terrain/mask'
import { snapshotOf, applySnapshot } from './netState'
import { applyAction, createMatch, windForRound, currentPlayer, effectiveArmor, isSettled, type MatchState } from './match'
import { TUNING, createDefaultTuning } from './tuning'

const W = 2400, H = 1200, G = 800
function flat(): TerrainMask {
  const m = new TerrainMask(W, H)
  for (let y = G; y < H; y++) m.data.fill(1, y * W, (y + 1) * W)
  return m
}
const zones = { A: { x1: 100, x2: 600 }, B: { x1: 1800, x2: 2300 } }
function make(n = 4, seed = 7): { s: MatchState; mask: TerrainMask } {
  const mask = flat()
  const players = Array.from({ length: n }, (_, i) => ({ name: `P${i}`, team: (i % 2) as 0 | 1, mobileId: 'oc-thiet-giap' }))
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
      const s = createMatch({ seed, mask, spawnZones: zones, players: [{ name: 'a', team: 0, mobileId: 'oc-thiet-giap' }, { name: 'b', team: 1, mobileId: 'oc-thiet-giap' }, { name: 'c', team: 0, mobileId: 'oc-thiet-giap' }, { name: 'd', team: 1, mobileId: 'oc-thiet-giap' }] })
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
    expect(applyAction(s, { t: 'fire', id: 1, angle: 45, power: 50, slot: 0 }, { mask }).ok).toBe(false)
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
    expect(p.body.fuel).toBeLessThan(t.mobiles['oc-thiet-giap']!.fuel)
    expect(p.delay).toBeCloseTo((p.body.x - x0) * t.move.delayPerPx, 3)
    const r = applyAction(s, { t: 'fire', id: p.id, angle: 45, power: 60, slot: 0 }, { mask })
    expect(r.ok).toBe(true)
    expect(r.shot).toBeDefined()
    expect(s.phase).toBe('resolving')
    expect(applyAction(s, { t: 'fire', id: p.id, angle: 45, power: 60, slot: 0 }, { mask }).ok).toBe(false)
    expect(applyAction(s, { t: 'endTurn' }, { mask }).ok).toBe(true)
    expect(s.phase).toBe('aiming')
    expect(s.turnPlayerId).not.toBe(p.id)
    expect(s.turnNo).toBe(2)
  })

  it('gió + thời tiết giữ nguyên trong một vòng, chỉ đổi khi mọi xe còn sống đã bắn', () => {
    const { s, mask } = make(4)
    const w0 = { ...s.wind }
    const acted = new Set<number>()
    while (acted.size < 4) {
      expect(s.roundNo).toBe(1)
      expect(s.wind).toEqual(w0)
      acted.add(s.turnPlayerId)
      applyAction(s, { t: 'fire', id: s.turnPlayerId, angle: 80, power: 20, slot: 0 }, { mask })
      applyAction(s, { t: 'endTurn' }, { mask })
    }
    expect(s.roundNo).toBe(2)
    expect(s.roundStart).toBe(s.turnNo)
    expect(s.wind).toEqual(windForRound(s.seed, 2))
    // xe đã chết không giữ vòng lại
    const dead = s.players.find(p => p.id !== s.turnPlayerId)!
    dead.hp = 0; dead.body.alive = false
    const before = s.roundNo
    acted.clear()
    while (acted.size < 3) {
      expect(s.roundNo).toBe(before)
      acted.add(s.turnPlayerId)
      applyAction(s, { t: 'fire', id: s.turnPlayerId, angle: 80, power: 20, slot: 0 }, { mask })
      applyAction(s, { t: 'endTurn' }, { mask })
    }
    expect(s.phase).toBe('aiming')
    expect(s.roundNo).toBe(before + 1)
  })

  it('người vừa dùng đạn delay lớn đi sau những người chưa đi', () => {
    const { s, mask } = make()
    const ids: number[] = []
    for (let i = 0; i < 4; i++) {
      ids.push(s.turnPlayerId)
      applyAction(s, { t: 'fire', id: s.turnPlayerId, angle: 80, power: 20, slot: 0 }, { mask })
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
    const res = applyAction(probe, { t: 'fire', id: 0, angle: 45, power: 70, slot: 0 }, { mask: probeMask })
    const ex = res.shot!.events.find(e => e.kind === 'explode')!
    if (ex.kind !== 'explode') throw new Error()
    target.body.x = ex.x
    target.hp = 10
    const before = mask.hash()
    applyAction(s, { t: 'fire', id: shooter.id, angle: 45, power: 70, slot: 0 }, { mask })
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

  it('1v1: người đến lượt tự rơi chết khi đang ngắm thì thắng thua ngay, không chờ hết giờ', () => {
    const { s, mask } = make(2)
    const p = currentPlayer(s)
    for (let y = G; y < H; y++) mask.data.fill(0, y * W + Math.round(p.body.x) - 60, y * W + Math.round(p.body.x) + 60)   // đào thủng tới đáy: rơi khỏi bản đồ
    let ended = false
    for (let i = 0; i < 60 * 8 && !ended; i++) {
      applyAction(s, { t: 'tick', dt: 1 / 60 }, { mask })
      if (s.phase === 'resolving' && isSettled(s)) { applyAction(s, { t: 'endTurn' }, { mask }); ended = (s.phase as string) === 'ended' }
    }
    expect(ended).toBe(true)
    expect(s.winner).toBe(p.team === 0 ? 1 : 0)
    expect(s.turnTimeLeft).toBeGreaterThan(10)      // còn nhiều giờ: không phải thắng nhờ hết giờ
  })
})

describe('3 pháo + thanh SS', () => {
  function duel(a: string, b: string): { s: MatchState; mask: TerrainMask } {
    const mask = flat()
    return { mask, s: createMatch({ seed: 9, mask, spawnZones: zones, players: [{ name: 'a', team: 0, mobileId: a }, { name: 'b', team: 1, mobileId: b }] }) }
  }
  /** Đặt đối thủ ngay chỗ đạn của người bắn sẽ rơi (thử trên bản sao). */
  function aimAtOpponent(a: string, slot: 0 | 1 | 2): { s: MatchState; mask: TerrainMask } {
    const probe = duel(a, 'oc-thiet-giap')
    probe.s.players[0]!.ss = 100
    const res = applyAction(probe.s, { t: 'fire', id: 0, angle: 50, power: 70, slot }, { mask: probe.mask })
    const ex = res.shot!.events.find(e => e.kind === 'explode')!
    if (ex.kind !== 'explode') throw new Error()
    const d = duel(a, 'oc-thiet-giap')
    d.s.players[1]!.body.x = ex.x
    d.s.players[0]!.ss = 100
    return d
  }

  it('mỗi pháo có máu/giáp/nhiên liệu riêng', () => {
    const { s } = duel('chui-khoan', 'bo-loi')
    const def = createDefaultTuning().mobiles
    expect(s.players[0]!.maxHp).toBe(def['chui-khoan']!.hp)
    expect(s.players[1]!.maxHp).toBe(def['bo-loi']!.hp)
    expect(s.players[0]!.maxHp).not.toBe(s.players[1]!.maxHp)
    expect(s.players[0]!.body.fuel).toBe(def['chui-khoan']!.fuel)
  })

  it('SS: chưa đầy thì không bắn được; đầy thì bắn được và về 0', () => {
    const { s, mask } = duel('oc-thiet-giap', 'oc-thiet-giap')
    expect(applyAction(s, { t: 'fire', id: 0, angle: 45, power: 60, slot: 2 }, { mask }).ok).toBe(false)
    expect(s.phase).toBe('aiming')
    s.players[0]!.ss = 100
    expect(applyAction(s, { t: 'fire', id: 0, angle: 45, power: 60, slot: 2 }, { mask }).ok).toBe(true)
    expect(s.players[0]!.ss).toBeLessThan(100)
  })

  it('gây sát thương lên đối phương làm đầy SS cả hai; đầu lượt cộng thêm perTurn', () => {
    const { s, mask } = aimAtOpponent('oc-thiet-giap', 0)
    s.players[0]!.ss = 0
    applyAction(s, { t: 'fire', id: 0, angle: 50, power: 70, slot: 0 }, { mask })
    expect(s.players[0]!.ss).toBeGreaterThan(0)
    expect(s.players[1]!.ss).toBeGreaterThan(0)
    const before = s.players[1]!.ss
    applyAction(s, { t: 'endTurn' }, { mask })
    expect(s.turnPlayerId).toBe(1)
    expect(s.players[1]!.ss).toBeCloseTo(before + createDefaultTuning().ss.perTurn, 5)
  })

  it('đạn có armorBreak giảm giáp mục tiêu 2 lượt của chính nó rồi hết', () => {
    const shot = TUNING.mobiles['oc-thiet-giap']!.shots[0]
    shot.armorBreak = { turns: 2, amount: 0.25 }
    try {
    const { s, mask } = aimAtOpponent('oc-thiet-giap', 0)
    const target = s.players[1]!
    const base = effectiveArmor(target)
    applyAction(s, { t: 'fire', id: 0, angle: 50, power: 70, slot: 0 }, { mask })
    expect(target.armorDebuff.turns).toBe(2)
    expect(effectiveArmor(target)).toBeCloseTo(base - 0.25, 5)
    applyAction(s, { t: 'endTurn' }, { mask })            // sang lượt của mục tiêu
    applyAction(s, { t: 'skip', id: 1 }, { mask }); applyAction(s, { t: 'endTurn' }, { mask })
    expect(target.armorDebuff.turns).toBe(1)
    applyAction(s, { t: 'skip', id: s.turnPlayerId }, { mask }); applyAction(s, { t: 'endTurn' }, { mask })
    applyAction(s, { t: 'skip', id: s.turnPlayerId }, { mask }); applyAction(s, { t: 'endTurn' }, { mask })
    expect(target.armorDebuff.turns).toBe(0)
    expect(effectiveArmor(target)).toBeCloseTo(base, 5)
    } finally { delete shot.armorBreak }
  })

  it('góc ngắm kẹp theo dải góc của từng pháo', () => {
    const { s, mask } = duel('bo-loi', 'chui-khoan')
    applyAction(s, { t: 'aim', id: 0, angle: 0 }, { mask })
    expect(s.players[0]!.aimAngle).toBe(10)
    applyAction(s, { t: 'aim', id: 0, angle: 200 }, { mask })
    expect(s.players[0]!.aimAngle).toBe(85)
  })
})

describe('A2: delay theo giây suy nghĩ', () => {
  it('bắn muộn thì bị cộng thêm delay; Rùa Thành nhân 1,2', () => {
    const t = createDefaultTuning()
    const delayAfter = (mobileId: string, waitS: number): number => {
      const mask = flat()
      const players = [0, 1].map(i => ({ name: `P${i}`, team: i as 0 | 1, mobileId }))
      const s = createMatch({ seed: 7, mask, spawnZones: zones, players, tuning: t })
      s.turnTimeLeft = t.turn.timeS - waitS
      const p = currentPlayer(s)
      const before = p.delay
      expect(applyAction(s, { t: 'fire', id: p.id, angle: 45, power: 50, slot: 0 }, { mask, tuning: t }).ok).toBe(true)
      return p.delay - before - t.mobiles[mobileId]!.shots[0].delay
    }
    expect(delayAfter('oc-thiet-giap', 0)).toBeCloseTo(0, 5)
    expect(delayAfter('oc-thiet-giap', 10)).toBeCloseTo(10 * t.turn.delayPerSecond, 5)
    expect(delayAfter('rua-thanh', 10)).toBeCloseTo(10 * t.turn.delayPerSecond * 1.2, 5)
  })
})

describe('C1: khiên', () => {
  it('Sứa Đèn bắt đầu với khiên đầy, hồi mỗi khi sang vòng mới (không vượt tối đa), snapshot mang theo', () => {
    const t = createDefaultTuning()
    const mask = flat()
    const players = [0, 1].map(i => ({ name: `P${i}`, team: i as 0 | 1, mobileId: i === 0 ? 'sua-den' : 'oc-thiet-giap' }))
    const s = createMatch({ seed: 7, mask, spawnZones: zones, players, tuning: t })
    const sh = t.mobiles['sua-den']!.shield!
    expect(s.players[0]!.shield).toBe(sh.max)
    expect(s.players[1]!.shield).toBe(0)
    s.players[0]!.shield = 10
    // kết thúc 2 lượt = sang vòng mới
    for (let k = 0; k < 2; k++) { applyAction(s, { t: 'skip', id: s.turnPlayerId }, { mask, tuning: t }); applyAction(s, { t: 'endTurn' }, { mask, tuning: t }) }
    expect(s.roundNo).toBe(2)
    expect(s.players[0]!.shield).toBe(Math.min(sh.max, 10 + sh.regen))
    const snap = snapshotOf(s)
    s.players[0]!.shield = 0
    applySnapshot(s, snap)
    expect(s.players[0]!.shield).toBe(Math.min(sh.max, 10 + sh.regen))
  })
})

describe('C3: mìn Cua Lăn', () => {
  const setup = () => {
    const t = createDefaultTuning()
    const mask = flat()
    const players = [{ name: 'A', team: 0 as const, mobileId: 'cua-lan' }, { name: 'B', team: 1 as const, mobileId: 'oc-thiet-giap' }]
    const s = createMatch({ seed: 7, mask, spawnZones: zones, players, tuning: t })
    return { t, mask, s, env: { mask, tuning: t } }
  }
  it('đạn 2 thả 2 mìn nằm lại ở chỗ chạm đất, không nổ; snapshot mang theo mìn', () => {
    const { s, env } = setup()
    const me = s.players[0]!
    const r = applyAction(s, { t: 'fire', id: me.id, angle: 35, power: 45, slot: 1 }, env)
    expect(r.ok).toBe(true)
    expect(r.shot!.events.filter(e => e.kind === 'mineDrop')).toHaveLength(2)
    expect(r.shot!.events.filter(e => e.kind === 'explode')).toHaveLength(0)
    expect(s.mines).toHaveLength(2)
    expect(s.mines.every(m => m.owner === me.id)).toBe(true)
    const snap = snapshotOf(s)
    s.mines = []
    applySnapshot(s, snap)
    expect(s.mines).toHaveLength(2)
  })
  it('lần bắn sau của chủ mìn: mìn bò về phía địch; chạm xe địch thì nổ, trừ máu', () => {
    const { s, env, mask } = setup()
    const me = s.players[0]!, foe = s.players[1]!
    // mìn nằm sẵn cạnh xe địch
    s.mines.push({ id: 0, owner: me.id, team: 0, x: foe.body.x - 60, y: foe.body.y + foe.body.radius - 3, crawlPx: 110, detect: 220, damage: 380, blastRadius: 70, carveRadius: 40 })
    s.nextMineId = 1
    const hp0 = foe.hp
    const before = mask.countSolid()
    const r = applyAction(s, { t: 'fire', id: me.id, angle: 80, power: 10, slot: 0 }, env)
    expect(r.ok).toBe(true)
    expect(r.shot!.events.some(e => e.kind === 'mineGone')).toBe(true)
    expect(foe.hp).toBeLessThan(hp0)
    expect(s.mines).toHaveLength(0)
    expect(mask.countSolid()).toBeLessThan(before)
  })
  it('mìn bò theo hướng địch nhưng chưa tới thì còn lại với vị trí mới', () => {
    const { s, env } = setup()
    const me = s.players[0]!, foe = s.players[1]!
    s.mines.push({ id: 0, owner: me.id, team: 0, x: me.body.x + 40, y: me.body.y + me.body.radius - 3, crawlPx: 110, detect: 220, damage: 380, blastRadius: 70, carveRadius: 40 })
    s.nextMineId = 1
    const x0 = s.mines[0]!.x
    applyAction(s, { t: 'fire', id: me.id, angle: 25, power: 100, slot: 0 }, env)
    expect(s.mines).toHaveLength(1)
    expect(Math.sign(s.mines[0]!.x - x0)).toBe(Math.sign(foe.body.x - x0))
    expect(Math.abs(s.mines[0]!.x - x0)).toBeGreaterThan(50)
  })
})
