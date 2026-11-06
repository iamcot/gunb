import { TUNING, turnOrder, type MatchState } from '@gunb/shared'
import { TEAM_COLORS } from './vehicleView'

const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`

/** HUD lượt chơi: đồng hồ, nhiên liệu, danh sách thứ tự lượt kèm delay. */
export class TurnHud {
  private readonly el: HTMLElement
  private last = ''

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'turnhud'
    document.body.appendChild(this.el)
  }

  update(m: MatchState): void {
    const cur = m.players[m.turnPlayerId]!
    const fuelMax = TUNING.mobiles[cur.mobileId]!.fuel
    const secs = Math.ceil(m.turnTimeLeft)
    const rows = turnOrder(m.players).map((p, i) =>
      `<div class="th-row${p.id === m.turnPlayerId ? ' cur' : ''}"><span class="th-dot" style="background:${hex(TEAM_COLORS[p.team])}"></span><span class="th-name">${i + 1}. ${p.name}</span><span class="th-mob">${TUNING.mobiles[p.mobileId]!.name}</span><span class="th-delay">${Math.round(p.delay)}</span></div>`).join('')
    const html =
      `<div class="th-timer${m.phase === 'aiming' && secs <= 5 ? ' warn' : ''}">${m.phase === 'aiming' ? secs : '…'}</div>` +
      `<div class="th-turn">Lượt ${m.turnNo}: <b>${cur.name}</b></div>` +
      `<div class="th-fuel"><div style="width:${Math.max(0, Math.min(100, (cur.body.fuel / fuelMax) * 100)).toFixed(0)}%"></div></div>` +
      `<div class="th-list-title">Thứ tự lượt (delay)</div>${rows}`
    if (html !== this.last) { this.el.innerHTML = html; this.last = html }
  }

  setVisible(v: boolean): void { this.el.style.display = v ? 'block' : 'none' }
  destroy(): void { this.el.remove() }
}
