import type { MatchPhase, MatchState } from './match'
import { isItemId } from './items'

/** Ảnh chụp trạng thái động của trận (vị trí, máu, lượt...) gửi từ server xuống client. Thông tin tĩnh (tên, đội, pháo) gửi một lần ở MatchStart. */
export interface Snapshot {
  turnNo: number
  roundNo: number
  roundStart: number
  phase: MatchPhase
  winner: number | null
  turnPlayerId: number
  turnTimeLeft: number
  wind: [number, number]
  /** Mỗi người một dòng: [x, y, facing, tilt, hp, fuel, onGround(0/1), alive(0/1), aimAngle, delay, ss, debuffTurns, debuffAmount, lastActed] */
  p: number[][]
  /** Ô item từng người ('' = trống/đã dùng). */
  items: string[][]
  /** Item đã dùng lượt này ('' = chưa). */
  turnItem: string
}

export function snapshotOf(s: MatchState): Snapshot {
  return {
    turnNo: s.turnNo, roundNo: s.roundNo, roundStart: s.roundStart, phase: s.phase, winner: s.winner, turnPlayerId: s.turnPlayerId, turnTimeLeft: s.turnTimeLeft,
    wind: [s.wind.x, s.wind.y],
    p: s.players.map(p => [
      p.body.x, p.body.y, p.body.facing, p.body.tilt, p.hp, p.body.fuel, p.body.onGround ? 1 : 0, p.body.alive ? 1 : 0,
      p.aimAngle, p.delay, p.ss, p.armorDebuff.turns, p.armorDebuff.amount, p.lastActed,
    ]),
    items: s.players.map(p => p.items.map(i => i ?? '')),
    turnItem: s.turnItem ?? '',
  }
}

/** Ghi snapshot lên bản sao của trận ở client. Số người phải khớp. */
export function applySnapshot(s: MatchState, snap: Snapshot): void {
  if (snap.p.length !== s.players.length) throw new Error('snapshot không khớp số người chơi')
  s.turnNo = snap.turnNo
  s.roundNo = snap.roundNo
  s.roundStart = snap.roundStart
  s.phase = snap.phase
  s.winner = snap.winner as MatchState['winner']
  s.turnPlayerId = snap.turnPlayerId
  s.turnTimeLeft = snap.turnTimeLeft
  s.wind.x = snap.wind[0]; s.wind.y = snap.wind[1]
  snap.p.forEach((r, i) => {
    const p = s.players[i]!
    const [x, y, facing, tilt, hp, fuel, onGround, alive, aim, delay, ss, dbT, dbA, last] = r as [number, number, number, number, number, number, number, number, number, number, number, number, number, number]
    p.body.x = x; p.body.y = y; p.body.facing = facing === -1 ? -1 : 1; p.body.tilt = tilt; p.body.fuel = fuel
    p.body.onGround = onGround === 1; p.body.alive = alive === 1
    p.hp = hp; p.aimAngle = aim; p.delay = delay; p.ss = ss
    p.armorDebuff.turns = dbT; p.armorDebuff.amount = dbA; p.lastActed = last
    const it = snap.items?.[i]
    if (it) for (let k = 0; k < p.items.length; k++) { const v = it[k]; p.items[k] = isItemId(v) ? v : null }
  })
  s.turnItem = isItemId(snap.turnItem) ? snap.turnItem : null
}
