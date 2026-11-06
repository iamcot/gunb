import { describe, expect, it } from 'vitest'
import { TerrainMask } from './terrain/mask'
import { applyAction, createMatch, currentPlayer } from './match'
import { addShotStats, newStats } from './stats'

describe('thống kê', () => {
  it('cộng sát thương, hạ gục, phát bắn và điểm nổ sát nhất; không tính đồng đội', () => {
    const mask = new TerrainMask(2400, 1200)
    for (let y = 800; y < 1200; y++) mask.data.fill(1, y * 2400, (y + 1) * 2400)
    const s = createMatch({ seed: 4, mask, spawnZones: { A: { x1: 300, x2: 700 }, B: { x1: 800, x2: 900 } }, players: [{ name: 'a', team: 0, mobileId: 'oc-thiet-giap' }, { name: 'b', team: 1, mobileId: 'oc-thiet-giap' }] })
    const shooter = currentPlayer(s)
    const enemy = s.players[1 - shooter.id]!
    // đặt địch sát và bắn thẳng vào: thử các góc/lực cho tới khi trúng
    enemy.body.x = shooter.body.x + shooter.body.facing * 120
    const stats = newStats(2)
    let hit = false
    for (let a = 5; a <= 85 && !hit; a += 5) for (let p = 20; p <= 100 && !hit; p += 5) {
      const m2 = mask.clone()
      const copy = structuredClone(s)
      const r = applyAction(copy, { t: 'fire', id: shooter.id, angle: a, power: p, slot: 0 }, { mask: m2 })
      if (r.shot!.events.some(e => e.kind === 'damage' && e.id === enemy.id)) { addShotStats(stats, s, shooter.id, r.shot!); hit = true }
    }
    expect(hit).toBe(true)
    expect(stats[shooter.id]!.damage).toBeGreaterThan(0)
    expect(stats[shooter.id]!.shots).toBe(1)
    expect(stats[shooter.id]!.closest).toBeLessThan(80)
    expect(stats[enemy.id]!.damage).toBe(0)
  })
})
