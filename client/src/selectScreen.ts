import { ALL_MOBILE_IDS, MOBILE_IDS, TEAM_NAMES, TUNING, type Team } from '@gunb/shared'

export interface SelectHandlers { onStart: (mobileIds: string[]) => void; onBack: () => void }

const bar = (v: number): string => `<div class="bar"><i style="width:${Math.round(Math.max(0, Math.min(1, v)) * 100)}%"></i></div>`

/** Màn chọn pháo cho từng người chơi (người chơi i thuộc đội i % 2, như HotseatMode). */
export class SelectScreen {
  private readonly el: HTMLElement

  /** `single`: chỉ chọn một xe (tập bắn). */
  constructor(perTeam: number, h: SelectHandlers, single = false) {
    const total = single ? 1 : perTeam * 2
    const picks: number[] = Array.from({ length: total }, (_, i) => Math.floor(i / 2) % MOBILE_IDS.length)
    this.el = document.createElement('div')
    this.el.className = 'overlay'
    const render = (): void => {
      const rows = picks.map((pick, i) => {
        const team = (i % 2) as Team
        const cards = MOBILE_IDS.map((id, k) => {
          const d = TUNING.mobiles[id]!
          return `<div class="card${k === pick ? ' sel' : ''}" data-p="${i}" data-k="${k}"><b>${d.name}</b><div style="opacity:.7;margin-bottom:4px">${d.role}</div>
            <div>Máu ${d.hp}</div>${bar(d.hp / 1200)}<div>Giáp ${Math.round(d.armor * 100)}%</div>${bar(d.armor / 0.2)}<div>Cơ động</div>${bar((d.fuel * d.speedMul) / 160)}
            <span style="opacity:.7">Góc ${d.angleMin}–${d.angleMax}°${d.slopeAim ? ' (theo thân, đứng dốc để nâng cao hơn)' : ''} · ${d.shots.map(s => s.name).join(' / ')}</span></div>`
        }).join('')
        return `<div class="selrow"><div class="who" style="color:${team === 0 ? '#60a5fa' : '#f87171'}">${single ? 'Bạn' : `${TEAM_NAMES[team]} ${Math.floor(i / 2) + 1}`}</div><div class="cards">${cards}</div></div>`
      }).join('')
      this.el.innerHTML = `<div class="panel" style="max-width:92vw"><h2>Chọn pháo</h2><div class="scroll">${rows}</div>
        <div class="row" style="margin-top:12px"><button id="back">Quay lại</button><button id="rand">Ngẫu nhiên</button><button id="go">Bắt đầu</button></div></div>`
      this.el.querySelectorAll<HTMLElement>('.card').forEach(c => c.addEventListener('click', () => { picks[Number(c.dataset.p)] = Number(c.dataset.k); render() }))
      this.el.querySelector('#back')!.addEventListener('click', () => h.onBack())
      this.el.querySelector('#rand')!.addEventListener('click', () => { for (let i = 0; i < total; i++) picks[i] = Math.floor(Math.random() * ALL_MOBILE_IDS.length); render() })
      this.el.querySelector('#go')!.addEventListener('click', () => h.onStart(picks.map(k => ALL_MOBILE_IDS[k]!)))
    }
    render()
    document.body.appendChild(this.el)
  }

  destroy(): void { this.el.remove() }
}
