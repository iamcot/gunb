import {
  BotDriver, TEAM_NAMES, TUNING, weatherOf, addShotStats, applyAction, newStats, createMatch, currentPlayer, isSettled, windMagnitude,
  type BotCmd, type BotLevel, type MatchState, type ShotSlot, type Team, type TerrainMask,
  aimRange, type AimRange, groundYBelow, BOT_ITEMS, ITEM_IDS,
} from '@gunb/shared'
import { getShotArt, getShotSfx } from './shotArt'
import { audio } from './audio'
import type { GameCtx, Mode } from './ctx'
import { AimInput } from './input'
import { ShotPlayback } from './playback'
import { RESULTS_DELAY_S, resultsHtml, showResults } from './results'
import { ShotBar } from './shotBar'
import { TurnHud } from './turnHud'
import { VehicleViews } from './vehicleView'
import { WeatherView } from './weatherView'
import { loadSavedItems } from './ui/items'

const HELP = '↑↓ góc · ←→ đi (tốn nhiên liệu) · 1/2/3 chọn đạn (3 = SS khi đầy) · F1–F3 item · giữ Space tích lực, nhả để bắn · Esc: menu'
const SETTLE_PAUSE = 0.3

/** `botLevel`: có thì đội Đỏ do máy chơi, đội Xanh là người (chung một bàn phím). */
export interface HotseatSetup { perTeam: number; mobileIds: string[]; botLevel?: BotLevel; allSkills?: boolean }   // allSkills: trang debug, SS luôn đầy   // mobileIds[i] là pháo của người chơi id i

/** Hotseat: 1v1..4v4 chung một bàn phím. */
export class HotseatMode implements Mode {
  private readonly match: MatchState
  private readonly mask: TerrainMask       // sự thật của trận; ctx.view.mask chỉ là bản hiển thị, được phát lại theo từng phát bắn
  private readonly aim = new AimInput(true)
  private readonly vehicles: VehicleViews
  private readonly weather: WeatherView
  private readonly turnHud = new TurnHud()
  private readonly shotBar = new ShotBar(slot => { if (slot !== 2 || this.aim.ssReady) this.aim.slot = slot })
  private readonly shownHp = new Map<number, number>()
  private readonly lastPower = new Map<number, number>()
  private playback: ShotPlayback | null = null
  private settledFor = 0
  private lastTurnPlayer = -1
  private lastTurnNo = -1   // cùng một người được bắn 2 lượt liền thì vẫn phải coi là lượt mới (camera về xe, đổi gió)
  private readonly range: AimRange = { min: 0, max: 90 }
  private lastHash: boolean | null = null
  private overlay: HTMLElement | null = null
  private endWait = RESULTS_DELAY_S
  private readonly stats
  private readonly bot: BotDriver | null
  private readonly botCmd: BotCmd = { angle: 45, dir: 0, fire: false, power: 0, slot: 0, item: -1 }

  constructor(private readonly ctx: GameCtx, private readonly setup: HotseatSetup, private readonly onNewGame: () => void, private readonly onMenu: () => void) {
    ctx.view.reset()
    this.mask = ctx.view.mask.clone()
    const players = []
    // item: người dùng bộ đã chọn ở phòng chờ online (chưa chọn thì 3 item đầu), máy dùng bộ của máy
    const saved = loadSavedItems()
    const human = saved.length ? saved : ITEM_IDS.slice(0, 3)
    for (let i = 0; i < setup.perTeam * 2; i++) {
      const team = (i % 2) as Team
      const bot = !!setup.botLevel && team === 1
      players.push({ name: `${TEAM_NAMES[team]} ${Math.floor(i / 2) + 1}${bot ? ' (máy)' : ''}`, team, mobileId: setup.mobileIds[i] ?? 'oc-thiet-giap', items: bot ? BOT_ITEMS : human })
    }
    this.match = createMatch({ seed: (Date.now() & 0x7fffffff) >>> 0, mask: this.mask, spawnZones: ctx.map.spawnZones, players })
    this.stats = newStats(this.match.players.length)
    this.bot = setup.botLevel ? new BotDriver(setup.botLevel) : null
    this.vehicles = new VehicleViews(this.match, ctx.fx)
    this.weather = new WeatherView(ctx.map.height, (x, fromY) => groundYBelow(ctx.view.mask, x, fromY))
    ctx.world.addChildAt(this.weather.container, ctx.world.getChildIndex(ctx.view.sprite) + 1)
    ctx.world.addChildAt(this.vehicles.container, ctx.world.getChildIndex(ctx.view.sprite) + 2)
    ctx.hud.setVisible(true)
    ctx.hud.setHelp(HELP)
    this.turnHud.setVisible(true)
    this.aim.onFire = (_angle, power, slot) => this.fire(power, slot)
    ctx.hud.onItem = slot => { if (this.canUseItem()) this.useItem(slot) }
    this.beginTurnUi()
  }

  private isBotTurn(): boolean { return this.bot !== null && currentPlayer(this.match).team === 1 }

  private canUseItem(): boolean {
    const m = this.match
    return m.phase === 'aiming' && !this.playback && !this.isBotTurn() && !this.aim.charging && m.turnItem === null
  }

  private useItem(slot: number): void {
    applyAction(this.match, { t: 'item', id: this.match.turnPlayerId, slot }, { mask: this.mask })
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
    this.lastTurnNo = this.match.turnNo
    audio.turn()
    this.ctx.hud.setWind(this.match.wind)
    this.ctx.focus.x = p.body.x; this.ctx.focus.y = p.body.y; this.ctx.focus.t = 1.2
  }

  private fire(power: number, slot: ShotSlot): void {
    const m = this.match
    if (m.phase !== 'aiming' || this.playback) return
    const p = currentPlayer(m)
    const before = structuredClone(m)
    this.lastPower.set(p.id, power)
    for (const q of m.players) this.shownHp.set(q.id, q.hp)
    const res = applyAction(m, { t: 'fire', id: p.id, angle: this.aim.angle, power, slot }, { mask: this.mask })
    if (!res.ok || !res.shot) return
    addShotStats(this.stats, before, p.id, res.shot)
    this.aim.locked = true
    this.vehicles.fireAnim(p.id)
    this.playback = new ShotPlayback(res.shot, this.ctx.view, this.ctx.fx, {
      onDamage: (id, amount, hpAfter) => { this.shownHp.set(id, hpAfter); this.vehicles.hitAnim(id); this.damagePop(id, amount) },
    }, m.turnItem === 'teleport' ? null : getShotArt(p.mobileId, slot), getShotSfx(p.mobileId, slot))
  }

  /** Số sát thương nhảy lên trên đầu xe `id` (mỗi phát trúng một số). */
  private damagePop(id: number, amount: number): void {
    const p = this.match.players[id]
    if (p) this.ctx.fx.damageText(p.body.x, p.body.y - p.body.radius - 36, amount)
  }

  update(dt: number): void {
    const { match: m, ctx, aim } = this
    if (m.phase === 'aiming' && !this.playback) {
      if (m.turnPlayerId !== this.lastTurnPlayer || m.turnNo !== this.lastTurnNo) this.beginTurnUi()
      const p = currentPlayer(m)
      const isBot = this.bot !== null && p.team === 1
      aim.locked = isBot
      if (this.setup.allSkills) p.ss = TUNING.ss.max   // debug: bật hết skill
      aim.ssReady = p.ss >= TUNING.ss.max && m.turnItem !== 'dual'   // Bắn 2 lần không dùng với SS
      if (!aim.ssReady && aim.slot === 2) aim.slot = 0
      const ar = aimRange(this.range, TUNING.mobiles[p.mobileId]!, p.body.facing, p.body.tilt)
      aim.setRange(ar.min, ar.max)   // dải góc đổi theo dốc (xe slopeAim)
      aim.update(dt)
      if (isBot) {
        const c = this.botCmd
        this.bot!.step(m, this.mask, TUNING, dt, c)
        if (c.item >= 0) this.useItem(c.item)
        aim.angle = c.angle
        aim.moveDir = c.dir
        if (c.fire) { this.fire(c.power, c.slot); return }
      }
      if (aim.moveDir !== 0) applyAction(m, { t: 'move', id: p.id, dir: aim.moveDir, dt }, { mask: this.mask })
      applyAction(m, { t: 'aim', id: p.id, angle: aim.angle }, { mask: this.mask })
      if (aim.charging && m.turnTimeLeft - dt <= 0) { aim.release(); return }   // hết giờ khi đang tụ lực: bắn luôn
      const r = applyAction(m, { t: 'tick', dt }, { mask: this.mask })
      if (r.timedOut) aim.cancel()
      ctx.hud.setAim(aim.angle, aim.power, aim.lastPower)
    } else if (m.phase === 'resolving') {
      aim.locked = true
      aim.update(dt)
      if (this.playback) {
        if (this.playback.update(dt)) {
          this.lastHash = this.playback.hashMatches
          this.playback = null
          this.shownHp.clear()   // đã phát hết sự kiện: máu hiển thị = máu trận
        }
      } else {
        applyAction(m, { t: 'tick', dt }, { mask: this.mask })   // xe mất đất dưới chân rơi xuống
        if (isSettled(m)) {
          this.settledFor += dt
          if (this.settledFor >= SETTLE_PAUSE) {
            this.settledFor = 0
            applyAction(m, { t: 'endTurn' }, { mask: this.mask })
            this.shownHp.clear()
          }
        } else this.settledFor = 0
      }
    }
    if (!this.playback && m.phase !== 'resolving') this.shownHp.clear()
    this.weather.set(weatherOf(m, ctx.map.width, ctx.map.height), `${m.seed}:${m.roundNo}`)
    ctx.hud.setWeatherTurn(m.seed, m.roundNo, ctx.map.width, ctx.map.height)
    this.weather.update(dt)
    this.vehicles.update(dt, m, this.shownHp)
    this.turnHud.update(m)
    const cur = currentPlayer(m)
    this.ctx.hud.setItems(cur.items, m.turnItem, this.canUseItem())
    this.shotBar.update(TUNING.mobiles[cur.mobileId]!, aim.slot, cur.ss, TUNING.ss.max)
    ctx.hud.setWind(m.wind, TUNING.mobiles[cur.mobileId]!.shots[aim.slot].windFactor)
    this.shotBar.setVisible(m.phase !== 'ended')
    // hết trận: chờ hồn thoát xác bay xong rồi mới bung bảng kết quả
    if (m.phase === 'ended' && !this.playback && !this.overlay && !this.vehicles.dying && (this.endWait -= dt) <= 0) this.showEnd()
  }

  private showEnd(): void {
    const m = this.match
    // chơi với máy: người là đội Xanh; 2 người 1 máy thì chỉ ghi đội nào thắng
    const el = showResults(resultsHtml(m, this.stats, this.bot ? { team: 0 } : null, [{ id: 'tomenu', label: 'Về menu' }, { id: 'again', label: 'Ván mới', cls: 'go big' }]))
    el.querySelector('#again')!.addEventListener('click', () => this.onNewGame())
    el.querySelector('#tomenu')!.addEventListener('click', () => this.onMenu())
    this.overlay = el
  }

  debugText(): string {
    const m = this.match, p = currentPlayer(m)
    return `[hotseat ${this.setup.perTeam}v${this.setup.perTeam}] lượt ${m.turnNo} · ${p.name} · pha ${m.phase}\n` +
      `pháo ${p.mobileId}  đạn ${this.aim.slot + 1}  SS ${p.ss.toFixed(0)}  giáp hiệu lực ${(p.armor - (p.armorDebuff.turns > 0 ? p.armorDebuff.amount : 0)).toFixed(2)}\n` +
      `góc ${this.aim.angle}°  lực ${this.aim.power.toFixed(1)}  nhiên liệu ${p.body.fuel.toFixed(0)}  trên đất ${p.body.onGround}\n` +
      `độ dốc xe ${(p.body.tilt * 180 / Math.PI).toFixed(1)}°  delay ${p.delay.toFixed(0)}\n` +
      `gió (${m.wind.x}, ${m.wind.y}) |${windMagnitude(m.wind).toFixed(1)}|  còn ${m.turnTimeLeft.toFixed(1)} s\n` +
      `hash mask hiển thị/trận: ${this.ctx.view.mask.hash().toString(16)} / ${this.mask.hash().toString(16)}` +
      `${this.playback ? '' : this.ctx.view.mask.hash() === this.mask.hash() ? ' (khớp)' : ' (LỆCH)'}\n` +
      `phát bắn gần nhất khớp hash: ${this.lastHash === null ? '—' : this.lastHash ? 'có' : 'LỆCH'}`
  }

  destroy(): void {
    this.ctx.hud.onItem = null
    this.ctx.hud.setItems(null, null, false)
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
