import { TUNING, turnOrder, type MatchState } from '@gunb/shared'
import { TEAM_COLORS } from './vehicleView'

const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`
const esc = (s: string): string => s.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`)

/** HUD lượt chơi (trên phải): đồng hồ vòng, người đang đi + nhiên liệu, thứ tự lượt kèm máu và delay. Kiểu dáng ở ui/hud.css. */
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
    const aiming = m.phase === 'aiming'
    const secs = Math.ceil(m.turnTimeLeft)
    const p = aiming ? Math.round(Math.max(0, Math.min(1, m.turnTimeLeft / TUNING.turn.timeS)) * 60) / 60 : 1
    const rows = turnOrder(m.players).map(q => {
      const dead = q.hp <= 0 || !q.body.alive
      const hp = Math.max(0, Math.min(1, q.hp / q.maxHp))
      return `<div class="th-row${q.id === m.turnPlayerId ? ' cur' : ''}${dead ? ' dead' : ''}">` +
        `<span class="th-dot" style="background:${hex(TEAM_COLORS[q.team])}">${dead ? '✕' : ''}</span>` +
        `<span class="th-name">${esc(q.name)}<small>${TUNING.mobiles[q.mobileId]!.name}</small></span>` +
        `<span class="th-delay">${Math.round(q.delay)}</span>` +
        `<span class="th-hp"><i class="${hp < 0.3 ? 'low' : ''}" style="width:${(hp * 100).toFixed(0)}%"></i></span></div>`
    }).join('')
    const html =
      `<div class="th-head t${cur.team}">` +
        `<div class="th-timer${aiming && secs <= 5 ? ' warn' : ''}" style="--p:${p.toFixed(3)}"><span>${aiming ? secs : '…'}</span></div>` +
        `<div class="th-turn"><small>Lượt ${m.turnNo}</small><b>${esc(cur.name)}</b>` +
        `<div class="th-fuel">Xăng<div class="bar"><div style="width:${Math.max(0, Math.min(100, (cur.body.fuel / fuelMax) * 100)).toFixed(0)}%"></div></div></div></div>` +
      `</div>` +
      `<div class="th-list"><div class="th-list-title"><span>Thứ tự lượt</span><span>delay</span></div>${rows}</div>`
    if (html !== this.last) { this.el.innerHTML = html; this.last = html }
  }

  setVisible(v: boolean): void { this.el.style.display = v ? 'block' : 'none' }
  destroy(): void { this.el.remove() }
}
