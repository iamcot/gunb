import type { MatchState } from './match'
import type { ShotResultNet } from './protocol'

/** Thống kê một người chơi trong trận (theo chỉ số ghế `id`). */
export interface PlayerStats {
  id: number
  damage: number        // sát thương gây ra cho phe địch
  kills: number         // số xe địch bị hạ bằng đạn của người này
  shots: number
  /** Khoảng cách nhỏ nhất (px) từ một vụ nổ của người này tới tâm một xe địch; Infinity nếu chưa bắn. */
  closest: number
}

export const newStats = (n: number): PlayerStats[] => Array.from({ length: n }, (_, id) => ({ id, damage: 0, kills: 0, shots: 0, closest: Infinity }))

/** Cộng một phát bắn của `shooterId` vào thống kê. `before` là trạng thái ngay TRƯỚC phát bắn (vị trí xe địch, đội). */
export function addShotStats(stats: PlayerStats[], before: MatchState, shooterId: number, shot: Pick<ShotResultNet, 'events'>): void {
  const me = stats[shooterId]!, team = before.players[shooterId]!.team
  me.shots++
  for (const e of shot.events) {
    if (e.kind === 'damage') {
      if (before.players[e.id]!.team === team) continue
      me.damage += e.amount
      if (e.hpAfter <= 0) me.kills++
    } else if (e.kind === 'explode') {
      for (const p of before.players) {
        if (p.team === team || p.hp <= 0) continue
        const d = Math.hypot(p.body.x - e.x, p.body.y - e.y)
        if (d < me.closest) me.closest = d
      }
    }
  }
}
