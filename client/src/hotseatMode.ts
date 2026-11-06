import {
  TEAM_NAMES, TUNING, applyAction, createMatch, currentPlayer, isSettled, windMagnitude,
  type MatchState, type ShotSlot, type Team, type TerrainMask,
} from '@gunb/shared'
import type { GameCtx, Mode } from './ctx'
import { AimInput } from './input'
import { ShotPlayback } from './playback'
import { ShotBar } from './shotBar'
import { TurnHud } from './turnHud'
import { VehicleViews } from './vehicleView'

const HELP = '↑↓ góc · ←→ đi (tốn nhiên liệu) · 1/2/3 chọn đạn (3 = SS khi đầy) · giữ Space tích lực, nhả để bắn · Esc: menu'
const SETTLE_PAUSE = 0.3

export interface HotseatSetup { perTeam: number; mobileIds: string[] }   // mobileIds[i] là pháo của người chơi id i

/** Hotseat: 1v1..4v4 chung một bàn phím. */
export class HotseatMode implements Mode {
  private readonly match: MatchState
  private readonly mask: TerrainMask       // sự thật của trận; ctx.view.mask chỉ là bản hiển thị, được phát lại theo từng phát bắn
  private readonly aim = new AimInput(true)
  private readonly vehicles: VehicleViews
  private readonly turnHud = new TurnHud()
  private readonly shotBar = new ShotBar(slot => { if (slot !== 2 || this.aim.ssReady) this.aim.slot = slot })
  private readonly shownHp = new Map<number, number>()
  private readonly lastPower = new Map<number, number>()
  private playback: ShotPlayback | null = null
  private settledFor = 0
  private lastTurnPlayer = -1
  private lastHash: boolean | null = null
  private overlay: HTMLElement | null = null

  constructor(private readonly ctx: GameCtx, private readonly setup: HotseatSetup, private readonly onNewGame: () => void, private readonly onMenu: () => void) {
    ctx.view.reset()
    this.mask = ctx.view.mask.clone()
    const players = []
    for (let i = 0; i < setup.perTeam * 2; i++) {
      const team = (i % 2) as Team
      players.push({ name: `${TEAM_NAMES[team]} ${Math.floor(i / 2) + 1}`, team, mobileId: setup.mobileIds[i] ?? 'oc-thiet-giap' })
    }
    this.match = createMatch({ seed: (Date.now() & 0x7fffffff) >>> 0, mask: this.mask, spawnZones: ctx.map.spawnZones, players })
    this.vehicles = new VehicleViews(this.match)
    ctx.world.addChildAt(this.vehicles.container, ctx.world.getChildIndex(ctx.view.sprite) + 1)
    ctx.hud.setVisible(true)
    ctx.hud.setHelp(HELP)
    this.turnHud.setVisible(true)
    this.aim.onFire = (_angle, power, slot) => this.fire(power, slot)
    this.beginTurnUi()
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
    this.ctx.hud.setWind(this.match.wind)
    this.ctx.focus.x = p.body.x; this.ctx.focus.y = p.body.y; this.ctx.focus.t = 1.2
  }

  private fire(power: number, slot: ShotSlot): void {
    const m = this.match
    if (m.phase !== 'aiming' || this.playback) return
    const p = currentPlayer(m)
    this.lastPower.set(p.id, power)
    for (const q of m.players) this.shownHp.set(q.id, q.hp)
    const res = applyAction(m, { t: 'fire', id: p.id, angle: this.aim.angle, power, slot }, { mask: this.mask })
    if (!res.ok || !res.shot) return
    this.aim.locked = true
    this.playback = new ShotPlayback(res.shot, this.ctx.view, this.ctx.fx, {
      onDamage: (id, _amount, hpAfter) => this.shownHp.set(id, hpAfter),
    })
  }

  update(dt: number): void {
    const { match: m, ctx, aim } = this
    if (m.phase === 'aiming' && !this.playback) {
      if (m.turnPlayerId !== this.lastTurnPlayer) this.beginTurnUi()
      aim.locked = false
      const p = currentPlayer(m)
      aim.ssReady = p.ss >= TUNING.ss.max
      aim.update(dt)
      if (aim.moveDir !== 0) applyAction(m, { t: 'move', id: p.id, dir: aim.moveDir, dt }, { mask: this.mask })
      applyAction(m, { t: 'aim', id: p.id, angle: aim.angle }, { mask: this.mask })
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
        }
      } else {
        applyAction(m, { t: 'tick', dt }, { mask: this.mask })   // xe mất đất dưới chân rơi xuống
        if (isSettled(m)) {
          this.settledFor += dt
          if (this.settledFor >= SETTLE_PAUSE) {
            this.settledFor = 0
            applyAction(m, { t: 'endTurn' }, { mask: this.mask })
            this.shownHp.clear()
            if ((m.phase as string) === 'ended') this.showEnd()
          }
        } else this.settledFor = 0
      }
    }
    if (!this.playback && m.phase !== 'resolving') this.shownHp.clear()
    this.vehicles.update(dt, m, this.shownHp)
    this.turnHud.update(m)
    const cur = currentPlayer(m)
    this.shotBar.update(TUNING.mobiles[cur.mobileId]!, aim.slot, cur.ss, TUNING.ss.max)
    this.shotBar.setVisible(m.phase !== 'ended')
  }

  private showEnd(): void {
    const m = this.match
    const el = document.createElement('div')
    el.className = 'overlay'
    const title = m.winner === -1 ? 'Hoà!' : `${TEAM_NAMES[m.winner as Team]} thắng!`
    const rows = m.players.map(p => `<tr><td>${p.name}</td><td>${p.hp > 0 ? p.hp + ' HP' : 'đã hạ'}</td></tr>`).join('')
    el.innerHTML = `<div class="panel"><h2>${title}</h2><table>${rows}</table><div class="row"><button id="again">Ván mới</button><button id="tomenu">Về menu</button></div></div>`
    el.querySelector('#again')!.addEventListener('click', () => this.onNewGame())
    el.querySelector('#tomenu')!.addEventListener('click', () => this.onMenu())
    document.body.appendChild(el)
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
    this.aim.dispose()
    this.turnHud.destroy()
    this.shotBar.destroy()
    this.overlay?.remove()
    this.ctx.world.removeChild(this.vehicles.container)
    this.vehicles.destroy()
    this.ctx.fx.hideProjectiles()
  }
}
