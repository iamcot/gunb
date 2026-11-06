import {
  MsgType, TEAM_NAMES, TUNING, weatherOf, applySnapshot, createMatch, currentPlayer,
  type MatchPlayerInfo, type MatchStartMsg, type MatchState, type ShotResult, type ShotResultNet, type ShotSlot, type PlayerStats, type Snapshot, type Team, type TerrainMask,
} from '@gunb/shared'
import { audio } from './audio'
import type { GameCtx, Mode } from './ctx'
import { AimInput } from './input'
import type { NetClient } from './net'
import { resultsHtml } from './results'
import { ShotPlayback } from './playback'
import { ShotBar } from './shotBar'
import { TurnHud } from './turnHud'
import { VehicleViews } from './vehicleView'
import { WeatherView } from './weatherView'

const HELP = '↑↓ góc · ←→ đi · 1/2/3 chọn đạn · giữ Space tích lực, nhả để bắn · WASD / chuột phải kéo camera · Esc: rời trận'
const EASE = 25               // độ mượt khi kéo vị trí hiển thị về vị trí server (1/s)
const SNAP_DIST = 150         // lệch hơn mức này thì nhảy thẳng (xe rơi, vào lại)
const INPUT_MIN_GAP = 0.05    // s giữa hai Input gửi đi
const INPUT_KEEPALIVE = 0.25

/**
 * Chế độ online: server giữ trận thật; client giữ một bản sao (MatchState) cập nhật bằng Snapshot, phát lại Shot,
 * và chỉ gửi ý định (Input/Fire). Không dự đoán phía client: vị trí xe người khác và của mình đều đến từ snapshot (làm mượt khi vẽ).
 */
export class OnlineMode implements Mode {
  readonly match: MatchState
  private readonly aim = new AimInput(true)
  private readonly vehicles: VehicleViews
  private readonly weather: WeatherView
  private readonly turnHud = new TurnHud()
  private readonly shotBar = new ShotBar(slot => { if (slot !== 2 || this.aim.ssReady) this.aim.slot = slot })
  private readonly shownHp = new Map<number, number>()
  private readonly lastPower = new Map<number, number>()
  private readonly tx: Float64Array
  private readonly ty: Float64Array
  private readonly tt: Float64Array
  private readonly prev = new Float64Array(3)
  private playback: ShotPlayback | null = null
  private pendingMask: TerrainMask | null = null
  private gotSnapshot = false
  private lastTurnPlayer = -1
  private lastHash: boolean | null = null
  private resyncs = 0
  private inputT = 0
  private lastDir = -9
  private lastAngle = -9
  private overlay: HTMLElement | null = null
  private stats: PlayerStats[] | null = null
  private readonly players: MatchPlayerInfo[]

  constructor(private readonly ctx: GameCtx, private readonly net: NetClient, private readonly start: MatchStartMsg, mask: TerrainMask, private readonly onLeave: () => void) {
    this.players = start.players
    this.match = createMatch({
      seed: start.seed, mask: mask.clone(), spawnZones: ctx.map.spawnZones,
      players: start.players.map(p => ({ name: p.name, team: p.team as Team, mobileId: p.mobileId })),
    })
    const n = this.match.players.length
    this.tx = new Float64Array(n); this.ty = new Float64Array(n); this.tt = new Float64Array(n)
    ctx.view.applyMask(mask)
    this.vehicles = new VehicleViews(this.match)
    this.weather = new WeatherView(ctx.map.height)
    ctx.world.addChildAt(this.weather.container, ctx.world.getChildIndex(ctx.view.sprite) + 1)
    ctx.world.addChildAt(this.vehicles.container, ctx.world.getChildIndex(ctx.view.sprite) + 2)
    ctx.hud.setVisible(true)
    ctx.hud.setHelp(HELP)
    this.turnHud.setVisible(true)
    this.aim.onFire = (angle, power, slot) => this.fire(angle, power, slot)
  }

  // ---------- tin từ server ----------
  onSnapshot(s: Snapshot): void {
    const m = this.match, n = m.players.length
    // giữ vị trí đang hiển thị, ghi snapshot, rồi đặt snapshot làm đích để làm mượt dần
    for (let i = 0; i < n; i++) { const b = m.players[i]!.body; this.tx[i] = b.x; this.ty[i] = b.y; this.tt[i] = b.tilt }
    applySnapshot(m, s)
    const first = !this.gotSnapshot
    this.gotSnapshot = true
    for (let i = 0; i < n; i++) {
      const b = m.players[i]!.body
      const nx = b.x, ny = b.y, nt = b.tilt
      if (!first && Math.hypot(nx - this.tx[i]!, ny - this.ty[i]!) < SNAP_DIST) { b.x = this.tx[i]!; b.y = this.ty[i]!; b.tilt = this.tt[i]! }
      this.tx[i] = nx; this.ty[i] = ny; this.tt[i] = nt
    }
    this.ctx.hud.setWind(m.wind)
    // xe của mình đang ngắm: giữ góc đang chỉnh trên máy (không bị snapshot cũ kéo lùi)
    if (this.isMyTurn()) currentPlayer(m).aimAngle = this.aim.angle
  }

  onStats(stats: PlayerStats[]): void { this.stats = stats }

  onShot(result: ShotResultNet): void {
    for (const q of this.match.players) this.shownHp.set(q.id, q.hp)   // máu trước phát bắn; snapshot kế tiếp đã có máu sau
    this.aim.locked = true
    this.playback = new ShotPlayback(result as ShotResult, this.ctx.view, this.ctx.fx, {
      onDamage: (id, _amount, hpAfter) => this.shownHp.set(id, hpAfter),
    })
  }

  /** Địa hình đầy đủ từ server (vào lại trận hoặc sau khi hash lệch). Nếu đang phát lại thì chờ xong mới áp. */
  onTerrain(mask: TerrainMask): void {
    if (this.playback) this.pendingMask = mask
    else this.ctx.view.applyMask(mask)
  }

  // ---------- điều khiển ----------
  private isMyTurn(): boolean {
    return this.match.phase === 'aiming' && this.match.turnPlayerId === this.start.youId
  }

  private beginTurnUi(): void {
    const p = currentPlayer(this.match)
    const def = TUNING.mobiles[p.mobileId]!
    this.aim.setRange(def.angleMin, def.angleMax)
    this.aim.angle = p.aimAngle
    this.aim.slot = 0
    this.aim.lastPower = this.lastPower.get(p.id) ?? 0
    this.aim.power = 0
    this.lastTurnPlayer = p.id
    this.lastDir = -9; this.lastAngle = -9; this.inputT = 1
    if (p.id === this.start.youId) audio.turn()
    this.ctx.hud.setWind(this.match.wind)
    this.ctx.focus.x = this.tx[p.id]!; this.ctx.focus.y = this.ty[p.id]!; this.ctx.focus.t = 1.2
  }

  private fire(angle: number, power: number, slot: ShotSlot): void {
    if (!this.isMyTurn() || this.playback) return
    this.lastPower.set(this.start.youId, power)
    this.aim.locked = true
    this.net.send({ t: MsgType.Fire, angle, power, slot })
  }

  update(dt: number): void {
    const { match: m, ctx, aim } = this
    if (!this.gotSnapshot) return
    // hiển thị: kéo vị trí xe về đích, đồng hồ lượt chạy tiếp giữa hai snapshot
    const k = 1 - Math.exp(-EASE * dt)
    for (let i = 0; i < m.players.length; i++) {
      const b = m.players[i]!.body
      b.x += (this.tx[i]! - b.x) * k; b.y += (this.ty[i]! - b.y) * k; b.tilt += (this.tt[i]! - b.tilt) * k
    }
    if (m.phase === 'aiming') m.turnTimeLeft = Math.max(0, m.turnTimeLeft - dt)

    if (m.phase === 'aiming' && m.turnPlayerId !== this.lastTurnPlayer) this.beginTurnUi()
    if (this.isMyTurn() && !this.playback) {
      aim.locked = false
      const p = currentPlayer(m)
      aim.ssReady = p.ss >= TUNING.ss.max
      aim.update(dt)
      p.aimAngle = aim.angle
      this.sendInput(dt)
      ctx.hud.setAim(aim.angle, aim.power, aim.lastPower)
    } else {
      aim.locked = true
      aim.update(dt)
      if (m.phase !== 'aiming') this.lastTurnPlayer = -1
    }
    if (this.playback && this.playback.update(dt)) {
      this.lastHash = this.playback.hashMatches
      this.playback = null
      if (this.lastHash === false) { this.resyncs++; this.net.send({ t: MsgType.NeedTerrain }) }
      if (this.pendingMask) { ctx.view.applyMask(this.pendingMask); this.pendingMask = null }
    }
    if (!this.playback) this.shownHp.clear()
    this.weather.set(weatherOf(m, ctx.map.width, ctx.map.height), `${m.seed}:${m.turnNo}`)
    this.weather.update(dt)
    this.vehicles.update(dt, m, this.shownHp)
    this.turnHud.update(m)
    const cur = currentPlayer(m)
    this.shotBar.update(TUNING.mobiles[cur.mobileId]!, aim.slot, cur.ss, TUNING.ss.max)
    ctx.hud.setWind(m.wind, TUNING.mobiles[cur.mobileId]!.shots[aim.slot].windFactor)
    this.shotBar.setVisible(m.phase !== 'ended')
    if (m.phase === 'ended' && !this.playback && !this.overlay) this.showEnd()
  }

  private sendInput(dt: number): void {
    this.inputT += dt
    const dir = this.aim.moveDir, angle = this.aim.angle
    const changed = dir !== this.lastDir || angle !== this.lastAngle
    if ((changed && this.inputT >= INPUT_MIN_GAP) || this.inputT >= INPUT_KEEPALIVE) {
      this.inputT = 0; this.lastDir = dir; this.lastAngle = angle
      this.net.send({ t: MsgType.Input, dir, angle })
    }
  }

  private showEnd(): void {
    const m = this.match
    const el = document.createElement('div')
    el.className = 'overlay'
    el.innerHTML = `<div class="panel" style="max-width:92vw">${resultsHtml(m, this.stats)}<p>Tự về phòng chờ (giữ nguyên đội) sau vài giây…</p><div class="row"><button id="leave">Rời phòng</button></div></div>`
    el.querySelector('#leave')!.addEventListener('click', () => { this.net.send({ t: MsgType.LeaveRoom }); this.onLeave() })
    document.body.appendChild(el)
    this.overlay = el
  }

  debugText(): string {
    const m = this.match, p = currentPlayer(m)
    return `[online] bạn = ${this.players[this.start.youId]?.name} (#${this.start.youId}) · lượt ${m.turnNo} · ${p.name} · pha ${m.phase}\n` +
      `góc ${this.aim.angle}°  lực ${this.aim.power.toFixed(1)}  nhiên liệu ${p.body.fuel.toFixed(0)}  SS ${p.ss.toFixed(0)}\n` +
      `gió (${m.wind.x}, ${m.wind.y})  còn ${m.turnTimeLeft.toFixed(1)} s\n` +
      `hash mask hiển thị: ${this.ctx.view.mask.hash().toString(16)}  phát bắn gần nhất khớp: ${this.lastHash === null ? '—' : this.lastHash ? 'có' : 'LỆCH'}  số lần xin lại địa hình: ${this.resyncs}`
  }

  destroy(): void {
    this.aim.dispose()
    this.turnHud.destroy()
    this.shotBar.destroy()
    this.overlay?.remove()
    this.ctx.world.removeChild(this.vehicles.container)
    this.vehicles.destroy()
    this.ctx.world.removeChild(this.weather.container)
    this.weather.destroy()
    this.ctx.fx.hideProjectiles()
  }
}
