import {
  BotDriver, MsgType, addShotStats, newStats, TUNING, applyAction, createDefaultTuning, createMatch, currentPlayer, encodeMaskRle, isSettled, snapshotOf,
  type BotCmd, type BotLevel, type MatchPlayerInfo, type MatchState, type ShotSlot, type Team, type TerrainMask, type Tuning,
} from '@gunb/shared'

export const TICK_S = 1 / 30
const SNAPSHOT_EVERY = 2          // 15 snapshot/giây
const SETTLE_PAUSE = 0.3          // s đứng yên trước khi sang lượt
const SHOT_PLAYBACK_PAD = 1.0     // s chờ thêm sau khi phát lại phát bắn xong (hiệu ứng nổ)
const NO_SHOT_WAIT = 0.4
export const RECONNECT_GRACE_S = 60

export interface RunnerPlayer { pid: number; name: string; team: Team; mobileId: string; bot?: BotLevel }

export interface RunnerOptions {
  seed: number
  mask: TerrainMask                 // mask gốc của bản đồ (runner tự sao chép)
  mapId: string
  zones: Parameters<typeof createMatch>[0]['spawnZones']
  players: RunnerPlayer[]
  turnTime: number
  /** Gửi một message tới người chơi `pid` (bỏ qua nếu họ đang rớt mạng). */
  send: (pid: number, msg: { t: MsgType }) => void
  onEnd?: (winner: number) => void
  tuning?: Tuning
}

interface Seat { id: number; pid: number; connected: boolean; offlineFor: number; bot: BotDriver | null }

/**
 * Chạy một trận trên server: giữ MatchState + mask thật, nhận lệnh của người đến lượt, mô phỏng, phát snapshot/kết quả phát bắn.
 * `step(dt)` do bên ngoài gọi (setInterval ở `start`, hoặc gọi tay trong test).
 */
export class MatchRunner {
  readonly state: MatchState
  readonly mask: TerrainMask
  readonly stats = newStats(0)
  private readonly tuning: Tuning
  private readonly seats: Seat[]
  private readonly info: MatchPlayerInfo[]
  private held = { dir: 0 as -1 | 0 | 1, angle: 45 }
  private resolveWait = 0
  private settledFor = 0
  private tickNo = 0
  private lastTurnKey = ''
  private readonly botCmd: BotCmd = { angle: 45, dir: 0, fire: false, power: 0, slot: 0 }
  private timer: ReturnType<typeof setInterval> | null = null
  private ended = false

  constructor(private readonly opts: RunnerOptions) {
    this.tuning = opts.tuning ?? createDefaultTuning()
    this.tuning.turn.timeS = opts.turnTime
    this.mask = opts.mask.clone()
    this.state = createMatch({
      seed: opts.seed, mask: this.mask, spawnZones: opts.zones, tuning: this.tuning,
      players: opts.players.map(p => ({ name: p.name, team: p.team, mobileId: p.mobileId })),
    })
    this.stats.push(...newStats(opts.players.length))
    this.seats = opts.players.map((p, i) => ({ id: i, pid: p.pid, connected: true, offlineFor: 0, bot: p.bot ? new BotDriver(p.bot) : null }))
    this.info = opts.players.map((p, i) => ({ id: i, pid: p.pid, name: p.name, team: p.team, mobileId: p.mobileId }))
    this.held.angle = currentPlayer(this.state).aimAngle
  }

  get isEnded(): boolean { return this.ended }
  get matchInfo(): MatchPlayerInfo[] { return this.info }

  /** Gửi trạng thái đầu cho mọi người (không bật bộ đếm; test dùng với `step`). */
  sendAll(): void { for (const s of this.seats) this.sendSync(s.pid) }

  start(): void {
    this.sendAll()
    this.timer = setInterval(() => this.step(TICK_S), TICK_S * 1000)
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  private seatOf(pid: number): Seat | undefined { return this.seats.find(s => s.pid === pid) }

  /** Gửi toàn bộ để một người dựng lại trận (lúc bắt đầu hoặc vào lại): thông tin tĩnh + địa hình hiện tại + snapshot. */
  sendSync(pid: number): void {
    const seat = this.seatOf(pid)
    if (!seat) return
    const { send } = this.opts
    send(pid, { t: MsgType.MatchStart, seed: this.opts.seed, mapId: this.opts.mapId, turnTime: this.opts.turnTime, players: this.info, youId: seat.id } as never)
    this.sendTerrain(pid)
    send(pid, { t: MsgType.Snapshot, s: snapshotOf(this.state) } as never)
  }

  sendTerrain(pid: number): void {
    this.opts.send(pid, { t: MsgType.Terrain, w: this.mask.width, h: this.mask.height, rle: encodeMaskRle(this.mask) } as never)
  }

  private broadcast(msg: { t: MsgType }): void {
    for (const s of this.seats) if (s.connected) this.opts.send(s.pid, msg)
  }

  private snapshotNow(): void { this.broadcast({ t: MsgType.Snapshot, s: snapshotOf(this.state) } as never) }

  onInput(pid: number, dir: number, angle: number): void {
    const seat = this.seatOf(pid)
    if (!seat || seat.id !== this.state.turnPlayerId || this.state.phase !== 'aiming') return
    this.held.dir = dir < 0 ? -1 : dir > 0 ? 1 : 0
    if (Number.isFinite(angle)) this.held.angle = angle
  }

  onFire(pid: number, angle: number, power: number, slot: ShotSlot): void {
    const seat = this.seatOf(pid)
    if (!seat || seat.id !== this.state.turnPlayerId || !Number.isFinite(angle) || !Number.isFinite(power)) return
    const s = slot === 1 || slot === 2 ? slot : 0
    const res = applyAction(this.state, { t: 'fire', id: seat.id, angle, power, slot: s }, { mask: this.mask, tuning: this.tuning })
    if (!res.ok || !res.shot) return
    addShotStats(this.stats, this.state, seat.id, res.shot)
    const { maskAfter: _drop, ...net } = res.shot
    this.held.dir = 0
    this.resolveWait = res.shot.endT + SHOT_PLAYBACK_PAD
    this.broadcast({ t: MsgType.Shot, result: net, shooter: seat.id, slot: s } as never)
    this.snapshotNow()
  }

  onSkip(pid: number): void {
    const seat = this.seatOf(pid)
    if (!seat || seat.id !== this.state.turnPlayerId) return
    if (applyAction(this.state, { t: 'skip', id: seat.id }, { mask: this.mask, tuning: this.tuning }).ok) {
      this.held.dir = 0
      this.resolveWait = NO_SHOT_WAIT
      this.snapshotNow()
    }
  }

  onDisconnect(pid: number): void {
    const seat = this.seatOf(pid)
    if (seat) { seat.connected = false; seat.offlineFor = 0 }
  }

  /** Người chơi vào lại: gửi đủ dữ liệu để dựng lại trận. */
  onReconnect(pid: number): void {
    const seat = this.seatOf(pid)
    if (!seat) return
    seat.connected = true
    seat.offlineFor = 0
    this.sendSync(pid)
  }

  /** Một bước mô phỏng `dt` giây. */
  step(dt: number): void {
    if (this.ended) return
    const s = this.state, env = { mask: this.mask, tuning: this.tuning }
    this.tickNo++
    // đếm thời gian rớt mạng; quá hạn thì xe bị loại
    for (const seat of this.seats) {
      if (seat.connected) continue
      seat.offlineFor += dt
      const p = s.players[seat.id]!
      if (seat.offlineFor >= RECONNECT_GRACE_S && p.hp > 0) { p.hp = 0; p.body.alive = false }
    }

    const key = `${s.turnNo}:${s.phase}`
    let force = key !== this.lastTurnKey
    this.lastTurnKey = key

    if (s.phase === 'aiming') {
      const cur = currentPlayer(s)
      const seat = this.seats[cur.id]!
      if (seat.bot) {
        const c = this.botCmd
        seat.bot.step(s, this.mask, this.tuning, dt, c)
        applyAction(s, { t: 'aim', id: cur.id, angle: c.angle }, env)
        if (c.dir !== 0) applyAction(s, { t: 'move', id: cur.id, dir: c.dir, dt }, env)
        applyAction(s, { t: 'tick', dt }, env)
        if (c.fire) this.onFire(seat.pid, c.angle, c.power, c.slot)
        else if ((s.phase as string) === 'resolving') { this.resolveWait = NO_SHOT_WAIT; force = true }   // hết giờ
      } else if (!seat.connected) {
        // người đến lượt đang rớt mạng: bỏ lượt (cộng delay phạt)
        applyAction(s, { t: 'skip', id: cur.id }, env)
        this.resolveWait = NO_SHOT_WAIT
        force = true
      } else {
        applyAction(s, { t: 'aim', id: cur.id, angle: this.held.angle }, env)
        if (this.held.dir !== 0) applyAction(s, { t: 'move', id: cur.id, dir: this.held.dir, dt }, env)
        const r = applyAction(s, { t: 'tick', dt }, env)
        if (r.timedOut) { this.held.dir = 0; this.resolveWait = NO_SHOT_WAIT; force = true }
      }
    }
    if (s.phase === 'resolving') {
      this.resolveWait -= dt
      if (this.resolveWait <= 0) {
        applyAction(s, { t: 'tick', dt }, env)        // xe mất đất dưới chân rơi xuống
        if (isSettled(s)) {
          this.settledFor += dt
          if (this.settledFor >= SETTLE_PAUSE) {
            this.settledFor = 0
            applyAction(s, { t: 'endTurn' }, env)
            this.held.dir = 0
            this.held.angle = currentPlayer(s).aimAngle
            force = true
          }
        } else this.settledFor = 0
      }
    }
    if ((s.phase as string) === 'ended') {
      this.broadcast({ t: MsgType.Stats, stats: this.stats } as never)
      this.snapshotNow()
      this.ended = true
      this.stop()
      this.opts.onEnd?.(s.winner ?? -1)
      return
    }
    if (force || this.tickNo % SNAPSHOT_EVERY === 0) this.snapshotNow()
  }
}

export { TUNING }
