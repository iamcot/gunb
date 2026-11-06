import { MAX_PLAYERS, MAX_TURNS } from './constants'
import { clamp, hashSeed, mulberry32 } from './math'
import { createBody, stepMobile, type MobileBody, type MoveResult } from './physics/mobileMove'
import { simulateShot, sanitizeFire } from './shot/simulateShot'
import type { ShotResult, ShotVehicle } from './shot/types'
import type { ShotSlot } from './shots'
import type { MobileDef } from './mobiles'
import type { MapFile } from './map/types'
import type { TerrainMask } from './terrain/mask'
import { groundYBelow, slopeAt } from './terrain/surface'
import { pickNext } from './turn/delay'
import { TUNING, type Tuning } from './tuning'
import { makeWind, type Wind } from './wind'

export type Team = 0 | 1

export interface PlayerState {
  id: number
  name: string
  team: Team
  mobileId: string
  body: MobileBody
  hp: number
  maxHp: number
  armor: number
  delay: number
  lastActed: number
  aimAngle: number
  ss: number                                  // thanh SS, 0..tuning.ss.max
  armorDebuff: { turns: number; amount: number }   // giảm giáp còn `turns` lượt của chính người này
}

/** aiming: người đến lượt đang ngắm/đi; resolving: đã bắn/bỏ lượt, chờ phát lại + rơi xong rồi `endTurn`; ended: hết trận. */
export type MatchPhase = 'aiming' | 'resolving' | 'ended'

export interface MatchState {
  seed: number
  players: PlayerState[]
  wind: Wind
  turnPlayerId: number
  turnNo: number
  turnTimeLeft: number
  phase: MatchPhase
  /** Đội thắng; -1 = hoà; null = chưa hết trận. */
  winner: Team | -1 | null
}

export type Action =
  | { t: 'aim'; id: number; angle: number }
  | { t: 'move'; id: number; dir: -1 | 0 | 1; dt: number }
  | { t: 'fire'; id: number; angle: number; power: number; slot: ShotSlot }
  | { t: 'skip'; id: number }
  | { t: 'tick'; dt: number }
  | { t: 'endTurn' }

export interface ActionResult {
  ok: boolean
  shot?: ShotResult
  timedOut?: boolean
}

export interface MatchEnv { mask: TerrainMask; tuning?: Tuning }

export interface CreateMatchOptions {
  seed: number
  mask: TerrainMask
  spawnZones: MapFile['spawnZones']
  players: { name: string; team: Team; mobileId: string }[]
  tuning?: Tuning
}

const SPAWN_SPACING = 70
const SPAWN_MAX_SLOPE = (30 * Math.PI) / 180   // ưu tiên chỗ xuất phát dốc không quá 30°
/** Giáp hiệu lực: giáp gốc trừ phần đang bị giảm (có thể âm = nhận thêm sát thương, tối thiểu -0.5). */
export const effectiveArmor = (p: PlayerState): number => Math.max(-0.5, p.armor - (p.armorDebuff.turns > 0 ? p.armorDebuff.amount : 0))

export const mobileOf = (p: PlayerState, t: Tuning = TUNING): MobileDef => t.mobiles[p.mobileId]!

const out: MoveResult = { moved: 0, damage: 0, died: false }

/** Gió của lượt `turnNo`: sinh từ seed của trận nên mọi nơi tính ra như nhau. */
export function windForTurn(seed: number, turnNo: number): Wind {
  return makeWind(mulberry32((seed ^ Math.imul(turnNo, 0x9e3779b1)) >>> 0))
}

export function createMatch(opts: CreateMatchOptions): MatchState {
  const t = opts.tuning ?? TUNING
  if (opts.players.length < 2 || opts.players.length > MAX_PLAYERS) throw new Error('số người chơi không hợp lệ')
  const rng = mulberry32(hashSeed(`spawn:${opts.seed}`))
  const placed: number[][] = [[], []]
  const players: PlayerState[] = opts.players.map((p, i) => {
    const zone = p.team === 0 ? opts.spawnZones.A : opts.spawnZones.B
    const def = t.mobiles[p.mobileId]
    if (!def) throw new Error(`không có pháo ${p.mobileId}`)
    const r = def.radius
    const lo = zone.x1 + r, hi = zone.x2 - r
    // Thử nhiều vị trí: ưu tiên chỗ đủ xa đồng đội và không quá dốc; không có thì lấy chỗ phẳng nhất đủ xa.
    const hw = r * 0.8
    let x = lo + rng() * (hi - lo), bestSlope = Infinity
    for (let k = 0; k < 80; k++) {
      const cand = Math.round(lo + rng() * (hi - lo))
      if (!placed[p.team]!.every(px => Math.abs(px - cand) >= SPAWN_SPACING)) continue
      const gy = groundYBelow(opts.mask, cand, 0)
      const slope = gy < 0 ? Infinity : Math.abs(slopeAt(opts.mask, cand, gy - 2 * t.move.stepUp, hw))
      if (slope < bestSlope) { bestSlope = slope; x = cand }
      if (slope <= SPAWN_MAX_SLOPE) break
    }
    x = Math.round(x)
    placed[p.team]!.push(x)
    const gy = groundYBelow(opts.mask, x, 0)
    const facing: 1 | -1 = p.team === 0 ? 1 : -1
    const body = createBody(x, (gy < 0 ? opts.mask.height : gy) - r, r, facing, def.speedMul)
    body.tilt = slopeAt(opts.mask, x, body.y + r - 2 * t.move.stepUp, r * 0.8)
    return { id: i, name: p.name, team: p.team, mobileId: p.mobileId, body, hp: def.hp, maxHp: def.hp, armor: def.armor, delay: 0, lastActed: -1, aimAngle: Math.min(def.angleMax, Math.max(def.angleMin, 45)), ss: 0, armorDebuff: { turns: 0, amount: 0 } }
  })
  const state: MatchState = { seed: opts.seed, players, wind: windForTurn(opts.seed, 1), turnPlayerId: 0, turnNo: 1, turnTimeLeft: t.turn.timeS, phase: 'aiming', winner: null }
  state.turnPlayerId = pickNext(players)!.id
  players[state.turnPlayerId]!.body.fuel = t.mobiles[players[state.turnPlayerId]!.mobileId]!.fuel
  return state
}

export const currentPlayer = (s: MatchState): PlayerState => s.players[s.turnPlayerId]!

/** Mọi xe còn sống đều đã đứng trên đất (không còn xe đang rơi). */
export function isSettled(s: MatchState): boolean {
  return s.players.every(p => p.hp <= 0 || !p.body.alive || p.body.onGround)
}

function kill(p: PlayerState): void {
  p.hp = 0
  p.body.alive = false
}

export function vehicles(s: MatchState): ShotVehicle[] {
  return s.players.map(p => ({ id: p.id, mobileId: p.mobileId, x: p.body.x, y: p.body.y, radius: p.body.radius, hp: p.hp, armor: effectiveArmor(p) }))
}

function winnerOf(s: MatchState): Team | -1 | null {
  const a = s.players.some(p => p.team === 0 && p.hp > 0)
  const b = s.players.some(p => p.team === 1 && p.hp > 0)
  if (a && b) return null
  if (a) return 0
  if (b) return 1
  return -1
}

/**
 * Áp một hành động vào trận. Xác định, không I/O; SỬA TRỰC TIẾP `state` và `env.mask` (server và chế độ offline dùng chung).
 * Hành động không hợp lệ (sai người, sai pha) trả `ok: false` và không đổi gì.
 */
export function applyAction(s: MatchState, a: Action, env: MatchEnv): ActionResult {
  const t = env.tuning ?? TUNING
  if (s.phase === 'ended') return { ok: false }
  switch (a.t) {
    case 'aim': {
      if (a.id !== s.turnPlayerId || s.phase !== 'aiming') return { ok: false }
      const def = t.mobiles[currentPlayer(s).mobileId]!
      currentPlayer(s).aimAngle = Math.round(clamp(a.angle, def.angleMin, def.angleMax))
      return { ok: true }
    }
    case 'move': {
      if (a.id !== s.turnPlayerId || s.phase !== 'aiming') return { ok: false }
      const p = currentPlayer(s)
      stepMobile(p.body, a.dir, a.dt, env.mask, t, out)
      p.delay += out.moved * t.move.delayPerPx
      applyBodyResult(p)
      return { ok: true }
    }
    case 'fire': {
      if (a.id !== s.turnPlayerId || s.phase !== 'aiming') return { ok: false }
      const p = currentPlayer(s)
      if (!p.body.onGround) return { ok: false }
      if (a.slot === 2 && p.ss < t.ss.max) return { ok: false }   // SS chưa đầy
      const def = t.mobiles[p.mobileId]!
      const fire = sanitizeFire({ angle: a.angle, power: a.power, slot: a.slot }, def)
      const shot = simulateShot({ mask: env.mask, vehicles: vehicles(s), wind: s.wind, shooterId: p.id, facing: p.body.facing, tilt: p.body.tilt, fire }, t)
      env.mask.data.set(shot.maskAfter.data)
      if (fire.slot === 2) p.ss = 0
      for (const e of shot.events) {
        if (e.kind === 'damage') {
          const target = s.players[e.id]!
          target.hp = e.hpAfter
          if (target.hp <= 0) target.body.alive = false
          if (target.team !== p.team) {
            p.ss = Math.min(t.ss.max, p.ss + e.amount * t.ss.perDamageDealt)
            target.ss = Math.min(t.ss.max, target.ss + e.amount * t.ss.perDamageTaken)
          }
        } else if (e.kind === 'armorBreak') {
          s.players[e.id]!.armorDebuff = { turns: e.turns, amount: e.amount }
        }
      }
      p.aimAngle = fire.angle
      p.delay += def.shots[fire.slot].delay
      s.phase = 'resolving'
      return { ok: true, shot }
    }
    case 'skip': {
      if (a.id !== s.turnPlayerId || s.phase !== 'aiming') return { ok: false }
      currentPlayer(s).delay += t.turn.timeoutPenalty
      s.phase = 'resolving'
      return { ok: true }
    }
    case 'tick': {
      for (const p of s.players) {
        if (p.hp <= 0) continue
        stepMobile(p.body, 0, a.dt, env.mask, t, out)
        applyBodyResult(p)
      }
      // Người đến lượt tự chết (rơi) hoặc trận đã phân thắng bại: kết thúc lượt ngay, không chờ hết giờ.
      if (s.phase === 'aiming' && (currentPlayer(s).hp <= 0 || winnerOf(s) !== null)) {
        s.phase = 'resolving'
        return { ok: true }
      }
      if (s.phase === 'aiming') {
        s.turnTimeLeft -= a.dt
        if (s.turnTimeLeft <= 0) {
          s.turnTimeLeft = 0
          currentPlayer(s).delay += t.turn.timeoutPenalty
          s.phase = 'resolving'
          return { ok: true, timedOut: true }
        }
      }
      return { ok: true }
    }
    case 'endTurn': {
      if (s.phase !== 'resolving') return { ok: false }
      const ended = currentPlayer(s)
      ended.lastActed = s.turnNo
      if (ended.armorDebuff.turns > 0) ended.armorDebuff.turns--
      s.turnNo++
      const w = winnerOf(s)
      if (w !== null) { s.winner = w; s.phase = 'ended'; return { ok: true } }
      if (s.turnNo > MAX_TURNS) {
        const hp = [0, 0]
        for (const p of s.players) hp[p.team]! += Math.max(0, p.hp)
        s.winner = hp[0]! === hp[1]! ? -1 : hp[0]! > hp[1]! ? 0 : 1
        s.phase = 'ended'
        return { ok: true }
      }
      const next = pickNext(s.players)!
      s.turnPlayerId = next.id
      next.body.fuel = t.mobiles[next.mobileId]!.fuel
      next.ss = Math.min(t.ss.max, next.ss + t.ss.perTurn)
      s.wind = windForTurn(s.seed, s.turnNo)
      s.turnTimeLeft = t.turn.timeS
      s.phase = 'aiming'
      return { ok: true }
    }
  }
}

/** Áp sát thương do rơi / chết do rơi khỏi đáy (từ `out`) lên người chơi. */
function applyBodyResult(p: PlayerState): void {
  if (out.died) { kill(p); return }
  if (out.damage > 0) {
    p.hp = Math.max(0, p.hp - Math.round(out.damage * (1 - p.armor)))
    if (p.hp <= 0) p.body.alive = false
  }
}
