import { clamp } from './math'
import { mulberry32 } from './math'
import { currentPlayer, vehicles, weatherOf, type MatchState } from './match'
import { sanitizeFire, simulateShot } from './shot/simulateShot'
import type { ShotSlot } from './shots'
import type { TerrainMask } from './terrain/mask'
import { TUNING, type Tuning } from './tuning'

export type BotLevel = 'easy' | 'normal' | 'hard'

export interface BotPlan { angle: number; power: number; slot: ShotSlot; score: number; enemyDamage: number }

/** Mức độ khó: bước góc khi quét, số lần chia đôi lực, số lần tinh chỉnh cuối, sai số cố ý thêm vào góc/lực, thời gian "suy nghĩ" giả (s). */
export const BOT_LEVELS: Record<BotLevel, { angleStep: number; bisect: number; refine: number; angleErr: number; powerErr: number; thinkS: number }> = {
  easy: { angleStep: 18, bisect: 4, refine: 0, angleErr: 6, powerErr: 14, thinkS: 1.2 },
  normal: { angleStep: 15, bisect: 5, refine: 6, angleErr: 2, powerErr: 5, thinkS: 1.6 },
  hard: { angleStep: 12, bisect: 5, refine: 12, angleErr: 0, powerErr: 0, thinkS: 2.0 },
}

const KILL_BONUS = 40
const ALLY_WEIGHT = 1.5
const SELF_WEIGHT = 2
const DELAY_WEIGHT = 0.03
const POWER_LO = 10

interface Cand { angle: number; power: number; slot: ShotSlot; score: number; enemyDamage: number; landX: number }

/**
 * Tìm góc/lực/loại đạn cho người đến lượt bằng mô phỏng thật (`simulateShot`): với mỗi góc trên lưới thô, chia đôi lực sao cho
 * điểm rơi gần địch gần nhất, chấm điểm các ứng viên, rồi tinh chỉnh quanh ứng viên tốt nhất.
 * Điểm = sát thương lên địch (+ thưởng hạ gục) − sát thương lên đồng đội/bản thân − chút phạt delay. Có sai số cố ý theo mức khó.
 * `rng` có seed ⇒ kết quả xác định. Không thay đổi `state`/`mask`. Khoảng 60–80 lần mô phỏng ở mức Khó.
 */
export function planShot(state: MatchState, mask: TerrainMask, level: BotLevel, rng: () => number, tuning: Tuning = TUNING): BotPlan {
  const me = currentPlayer(state)
  const def = tuning.mobiles[me.mobileId]!
  const cfg = BOT_LEVELS[level]
  const veh = vehicles(state)
  const team = me.team
  const facing = me.body.facing
  const weather = weatherOf(state, mask.width, mask.height, tuning)

  // địch sống gần nhất theo phương ngang
  let target = -1, bestDx = Infinity
  for (const p of state.players) {
    if (p.team === team || p.hp <= 0) continue
    const dx = Math.abs(p.body.x - me.body.x)
    if (dx < bestDx) { bestDx = dx; target = p.id }
  }
  const targetD = target < 0 ? 0 : (state.players[target]!.body.x - me.body.x) * facing

  const evaluate = (angle: number, power: number, slot: ShotSlot): Cand => {
    const fire = sanitizeFire({ angle, power, slot }, def)
    const r = simulateShot({ mask, vehicles: veh, wind: state.wind, shooterId: me.id, facing, tilt: me.body.tilt, fire, skipHash: true, weather }, tuning)
    let enemy = 0, score = 0, landX = NaN
    for (const e of r.events) {
      if (Number.isNaN(landX) && (e.kind === 'explode' || e.kind === 'out')) landX = e.x
      if (e.kind !== 'damage') continue
      const v = state.players[e.id]!
      if (e.id === me.id) score -= SELF_WEIGHT * e.amount
      else if (v.team === team) score -= ALLY_WEIGHT * e.amount
      else { enemy += e.amount; score += e.amount + (e.hpAfter <= 0 ? KILL_BONUS : 0) }
    }
    score -= DELAY_WEIGHT * def.shots[fire.slot].delay
    return { angle: fire.angle, power: fire.power, slot: fire.slot, score, enemyDamage: enemy, landX }
  }

  /** Với một góc, chia đôi lực để điểm rơi (theo phương bắn) gần targetD nhất. */
  const bestPowerFor = (angle: number, slot: ShotSlot): Cand => {
    let lo = POWER_LO, hi = 100
    for (let i = 0; i < cfg.bisect; i++) {
      const mid = (lo + hi) / 2
      const c = evaluate(angle, mid, slot)
      const d = Number.isNaN(c.landX) ? Infinity : (c.landX - me.body.x) * facing
      if (d < targetD) lo = mid; else hi = mid
    }
    return evaluate(angle, (lo + hi) / 2, slot)
  }

  const sweep = (slot: ShotSlot): Cand => {
    let best: Cand | null = null
    const angles: number[] = []
    for (let a = def.angleMin; a <= def.angleMax; a += cfg.angleStep) angles.push(a)
    if (angles[angles.length - 1] !== def.angleMax) angles.push(def.angleMax)
    for (const a of angles) { const c = bestPowerFor(a, slot); if (!best || c.score > best.score) best = c }
    return best!
  }

  let best = sweep(0)
  if (me.ss >= tuning.ss.max) { const c = sweep(2); if (c.score > best.score) best = c }
  else if (best.enemyDamage <= 0) { const c = sweep(1); if (c.score > best.score) best = c }

  // tinh chỉnh quanh ứng viên tốt nhất
  let n = 0
  for (const [da, dp] of [[2, 4], [1, 2], [1, 1]] as const) {
    for (const [ia, ip] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      if (n >= cfg.refine) break
      n++
      const c = evaluate(best.angle + ia * da, best.power + ip * dp, best.slot)
      if (c.score > best.score) best = c
    }
  }

  // sai số cố ý theo mức khó
  const ea = (rng() * 2 - 1) * cfg.angleErr, ep = (rng() * 2 - 1) * cfg.powerErr
  return {
    angle: Math.round(clamp(best.angle + ea, def.angleMin, def.angleMax)),
    power: clamp(best.power + ep, 0, 100),
    slot: best.slot, score: best.score, enemyDamage: best.enemyDamage,
  }
}

/** Seed cho RNG của bot, ổn định theo trận + lượt (xác định, tái lập được). */
export const botRng = (seed: number, turnNo: number): (() => number) => mulberry32((seed ^ Math.imul(turnNo, 0x9e3779b1)) >>> 0)

export interface BotCmd { angle: number; dir: -1 | 0 | 1; fire: boolean; power: number; slot: ShotSlot }

const WALK_S = 0.9
const AIM_DEG_PER_S = 40

/**
 * Điều khiển một bot trong lượt của nó, như người chơi: mỗi tick gọi `step`, rồi áp `angle`/`dir`/`fire` bằng các action thường.
 * Quy trình: lập kế hoạch; nếu không có phát nào trúng và còn nhiên liệu thì đi về phía địch gần nhất ~1 s rồi lập lại; xoay nòng dần tới góc đã chọn; chờ hết thời gian "suy nghĩ" rồi bắn.
 */
export class BotDriver {
  private turnNo = -1
  private plan: BotPlan | null = null
  private angle = 45
  private thinkLeft = 0
  private walkLeft = 0
  private replanned = false

  constructor(readonly level: BotLevel) {}

  step(s: MatchState, mask: TerrainMask, tuning: Tuning, dt: number, out: BotCmd): void {
    const me = currentPlayer(s)
    const cfg = BOT_LEVELS[this.level]
    const rng = botRng(s.seed, s.turnNo)
    if (this.turnNo !== s.turnNo) {
      this.turnNo = s.turnNo
      this.plan = planShot(s, mask, this.level, rng, tuning)
      this.angle = me.aimAngle
      this.thinkLeft = cfg.thinkS * (0.7 + 0.6 * rng())
      this.walkLeft = 0
      this.replanned = false
      if (this.plan.enemyDamage <= 0 && me.body.fuel > 0) this.walkLeft = WALK_S
    }
    out.fire = false
    out.dir = 0
    out.power = this.plan!.power
    out.slot = this.plan!.slot
    if (this.walkLeft > 0) {
      this.walkLeft -= dt
      let tx = me.body.x, bd = Infinity
      for (const p of s.players) {
        if (p.team === me.team || p.hp <= 0) continue
        const d = Math.abs(p.body.x - me.body.x)
        if (d < bd) { bd = d; tx = p.body.x }
      }
      out.dir = tx >= me.body.x ? 1 : -1
      if (this.walkLeft <= 0 && !this.replanned) { this.replanned = true; this.plan = planShot(s, mask, this.level, rng, tuning) }
      out.angle = Math.round(this.angle)
      return
    }
    const target = this.plan!.angle
    const stepDeg = AIM_DEG_PER_S * dt
    this.angle = Math.abs(target - this.angle) <= stepDeg ? target : this.angle + Math.sign(target - this.angle) * stepDeg
    out.angle = Math.round(this.angle)
    this.thinkLeft -= dt
    if (this.thinkLeft <= 0 && out.angle === target) out.fire = true
    out.power = this.plan!.power
    out.slot = this.plan!.slot
  }
}
