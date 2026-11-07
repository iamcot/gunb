import type { TerrainMask } from '../terrain/mask'
import type { Tuning } from '../tuning'
import type { ShotEvent, ShotVehicle } from './types'

/** Mìn đang nằm trên bản đồ (trạng thái trận; xem `MatchState.mines`). */
export interface Mine {
  id: number
  owner: number
  team: 0 | 1
  x: number
  y: number
  crawlPx: number       // px bò mỗi lần chủ mìn bắn
  detect: number        // bán kính "giương râu đỏ"
  damage: number
  blastRadius: number
  carveRadius: number
}

const CRAWL_STEP = 2, CONTACT_PAD = 12, MINE_GAP_S = 0.5

/**
 * Các mìn của `ownerId` bò về phía xe địch gần nhất; chạm xe địch thì nổ (khoét + sát thương, khiên hấp thụ trước, giáp giảm). Thuần, xác định.
 * SỬA `mask` (mìn nổ khoét đất) và `mines` (vị trí, loại mìn đã nổ); trả các event (t tính từ 0) để phát lại + áp lên trạng thái.
 * `vehicles` là bản sao: máu/khiên được cập nhật trong đó để các mìn nổ nối tiếp tính đúng.
 */
export function simulateMines(mask: TerrainMask, vehicles: ShotVehicle[], mines: Mine[], ownerId: number, tuning: Tuning): { events: ShotEvent[]; endT: number } {
  const events: ShotEvent[] = []
  const up = tuning.move.stepUp, down = tuning.move.snapDown + 6
  let t = 0
  const list = mines.filter(m => m.owner === ownerId)
  for (const m of list) {
    let target: ShotVehicle | null = null, best = Infinity
    for (const v of vehicles) {
      if (v.hp <= 0 || v.team === m.team) continue
      const d = Math.hypot(v.x - m.x, v.y - m.y)
      if (d < best) { best = d; target = v }
    }
    if (!target) continue
    const dir = Math.sign(target.x - m.x) || 1
    let hit: ShotVehicle | null = null
    for (let moved = 0; moved < m.crawlPx; moved += CRAWL_STEP) {
      hit = enemyTouch(vehicles, m)
      if (hit) break
      const nx = m.x + dir * CRAWL_STEP
      let gy = -1
      for (let y = Math.floor(m.y) - up; y <= m.y + down; y++) if (mask.isSolid(nx, y)) { gy = y; break }
      if (gy < 0 || gy === Math.floor(m.y) - up) break          // hết đất hoặc vách cao: dừng
      m.x = nx; m.y = gy - 3
    }
    hit = hit ?? enemyTouch(vehicles, m)
    events.push({ t, kind: 'mineMove', id: m.id, x: m.x, y: m.y })
    if (hit) {
      t += 0.3
      events.push({ t, kind: 'explode', x: m.x, y: m.y, r: m.blastRadius })
      if (m.carveRadius > 0) { mask.carveCircle(m.x, m.y, m.carveRadius); events.push({ t, kind: 'carve', x: m.x, y: m.y, r: m.carveRadius }) }
      for (const v of vehicles) {
        if (v.hp <= 0) continue
        const d = Math.max(0, Math.hypot(v.x - m.x, v.y - m.y) - v.radius)
        if (d >= m.blastRadius) continue
        const amount = Math.round(m.damage * (1 - d / m.blastRadius) * (1 - v.armor))
        if (amount <= 0) continue
        const sh = v.shield ?? 0, absorbed = Math.min(sh, amount)
        v.shield = sh - absorbed
        v.hp = Math.max(0, v.hp - (amount - absorbed))
        events.push({ t, kind: 'damage', id: v.id, amount, hpAfter: v.hp, shieldAfter: v.shield })
      }
      events.push({ t, kind: 'mineGone', id: m.id })
      mines.splice(mines.indexOf(m), 1)
    }
    t += MINE_GAP_S
  }
  return { events, endT: t }
}

function enemyTouch(vehicles: ShotVehicle[], m: Mine): ShotVehicle | null {
  for (const v of vehicles) {
    if (v.hp <= 0 || v.id === m.owner) continue
    if (v.team === m.team) continue
    if (Math.hypot(v.x - m.x, v.y - m.y) <= v.radius + CONTACT_PAD) return v
  }
  return null
}
