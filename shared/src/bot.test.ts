import { describe, expect, it } from 'vitest'
import { TerrainMask } from './terrain/mask'
import { applyAction, createMatch, currentPlayer, vehicles, type MatchState } from './match'
import { BOT_LEVELS, botRng, planShot, type BotLevel } from './bot'
import { sanitizeFire, simulateShot } from './shot/simulateShot'
import { windForTurn } from './match'
import { TUNING } from './tuning'

const W = 2400, H = 1200, G = 800
const zones = { A: { x1: 300, x2: 800 }, B: { x1: 1600, x2: 2100 } }
function flat(): TerrainMask {
  const m = new TerrainMask(W, H)
  for (let y = G; y < H; y++) m.data.fill(1, y * W, (y + 1) * W)
  return m
}
function game(seed: number, mobile = 'oc-thiet-giap'): { s: MatchState; mask: TerrainMask } {
  const mask = flat()
  const s = createMatch({ seed, mask, spawnZones: zones, players: [{ name: 'a', team: 0, mobileId: mobile }, { name: 'b', team: 1, mobileId: 'oc-thiet-giap' }] })
  return { s, mask }
}
const hitsEnemy = (s: MatchState, mask: TerrainMask, plan: { angle: number; power: number; slot: 0 | 1 | 2 }): boolean => {
  const me = currentPlayer(s)
  const r = simulateShot({ mask, vehicles: vehicles(s), wind: s.wind, shooterId: me.id, facing: me.body.facing, tilt: me.body.tilt, fire: sanitizeFire(plan, TUNING.mobiles[me.mobileId]!) })
  return r.events.some(e => e.kind === 'damage' && s.players[e.id]!.team !== me.team)
}

describe('bot', () => {
  it('không bao giờ chọn góc/lực ngoài dải, mọi mức khó, mọi pháo', () => {
    for (const mobile of ['oc-thiet-giap', 'chui-khoan', 'bo-loi']) {
      for (const level of Object.keys(BOT_LEVELS) as BotLevel[]) {
        for (let seed = 1; seed <= 4; seed++) {
          const { s, mask } = game(seed, mobile)
          while (currentPlayer(s).mobileId !== mobile) applyAction(s, { t: 'skip', id: s.turnPlayerId }, { mask })
          const def = TUNING.mobiles[mobile]!
          const p = planShot(s, mask, level, botRng(seed, 1))
          expect(p.angle).toBeGreaterThanOrEqual(def.angleMin)
          expect(p.angle).toBeLessThanOrEqual(def.angleMax)
          expect(Number.isInteger(p.angle)).toBe(true)
          expect(p.power).toBeGreaterThanOrEqual(0)
          expect(p.power).toBeLessThanOrEqual(100)
          expect(p.slot === 2 ? currentPlayer(s).ss >= TUNING.ss.max : true).toBe(true)
        }
      }
    }
  })

  it('xác định: cùng trận + lượt cho cùng kế hoạch', () => {
    const { s, mask } = game(3)
    expect(planShot(s, mask, 'normal', botRng(3, 1))).toEqual(planShot(s, mask, 'normal', botRng(3, 1)))
  })

  it('không làm thay đổi trạng thái trận hay mask', () => {
    const { s, mask } = game(5)
    const before = JSON.stringify(s), h = mask.hash()
    planShot(s, mask, 'hard', botRng(5, 1))
    expect(JSON.stringify(s)).toBe(before)
    expect(mask.hash()).toBe(h)
  })

  it('mức Khó trúng ≥ 70% với gió ngẫu nhiên; mức Dễ kém hơn mức Khó', () => {
    const rate = (level: BotLevel): number => {
      let hit = 0
      const N = 20
      for (let i = 0; i < N; i++) {
        const { s, mask } = game(100 + i)
        s.wind = windForTurn(900 + i, 1 + i)
        if (hitsEnemy(s, mask, planShot(s, mask, level, botRng(100 + i, 1)))) hit++
      }
      return hit / N
    }
    const hard = rate('hard'), easy = rate('easy')
    expect(hard).toBeGreaterThanOrEqual(0.7)
    expect(easy).toBeLessThanOrEqual(hard)
  })

  it('suy nghĩ dưới 100 ms (mức Khó, trung bình)', () => {
    const { s, mask } = game(8)
    planShot(s, mask, 'hard', botRng(8, 1))   // làm nóng JIT
    const t0 = performance.now()
    for (let i = 0; i < 5; i++) planShot(s, mask, 'hard', botRng(8, i))
    expect((performance.now() - t0) / 5).toBeLessThan(100)
  })
})
